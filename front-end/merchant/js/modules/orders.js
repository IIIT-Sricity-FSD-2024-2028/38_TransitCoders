/* js/modules/orders.js – My Orders view with full CRUD */

const Orders = (() => {

  const statusBadge = {
    'delivered':  '<span class="badge b-delivered">Delivered</span>',
    'in-transit': '<span class="badge b-in-transit">In Transit</span>',
    'pending':    '<span class="badge b-pending">Pending</span>',
    'cancelled':  '<span class="badge b-cancelled">Cancelled</span>',
    'processing': '<span class="badge b-processing">Processing</span>',
  };

  let currentFilter = 'all';

  /* ── RENDER TABLE ── */
  function render(filter) {
    if (filter) currentFilter = filter;
    const user = Auth.currentUser();
    const mid  = Auth.isSuperUser() ? null : user?.user_id;
    let data   = MockDB.getShipments(mid);

    if (currentFilter !== 'all') data = data.filter(s => s.status === currentFilter);

    // Search filter
    const q = (document.getElementById('orders-search')?.value || '').toLowerCase();
    if (q) data = data.filter(s =>
      s.id.toLowerCase().includes(q) ||
      s.recipient.toLowerCase().includes(q) ||
      s.dest.toLowerCase().includes(q)
    );

    const tbody = document.getElementById('orders-table');
    if (!tbody) return;

    // Update badge count
    const badge = document.querySelector('.nav-badge');
    if (badge) badge.textContent = MockDB.getShipments(Auth.isSuperUser() ? null : user?.user_id).length;

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-row">No orders found for the selected filter.</td></tr>';
      return;
    }

    const canEdit = Auth.isSuperUser() || Auth.isAdmin() || Auth.isMerchant();
    const canDelete = Auth.isSuperUser() || Auth.isMerchant();

    tbody.innerHTML = data.map(s => `
      <tr class="table-row" data-id="${s.id}">
        <td><span class="tracking-id">${s.id}</span></td>
        <td>${escapeHtml(s.recipient)}</td>
        <td style="color:var(--mid);font-size:11px">${escapeHtml(s.origin)} → ${escapeHtml(s.dest)}</td>
        <td>${s.service}</td>
        <td>${s.weight}</td>
        <td style="font-weight:600">${s.amount}</td>
        <td style="color:var(--mid)">${s.date}</td>
        <td>${statusBadge[s.status] || s.status}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick="Orders.trackFrom('${s.id}')">Track</button>
            ${canEdit ? `<button class="btn btn-secondary btn-sm" onclick="Orders.openEdit('${s.id}')">Edit</button>` : ''}
            ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="Orders.confirmDelete('${s.id}')">Delete</button>` : ''}
          </div>
        </td>
      </tr>`).join('');
  }

  /* ── FILTER BUTTONS ── */
  function setFilter(f, btn) {
    document.querySelectorAll('#view-orders .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(f);
  }

  /* ── TRACK FROM ORDERS ── */
  function trackFrom(id) {
    navigate('track');
    setTimeout(() => {
      document.getElementById('track-input').value = id;
      Tracking.doTrack();
    }, 100);
  }

  /* ── EDIT MODAL ── */
  function openEdit(id) {
    const s = MockDB.getShipment(id);
    if (!s) return;

    document.getElementById('edit-ship-id').value        = s.id;
    document.getElementById('edit-recipient').value      = s.recipient;
    document.getElementById('edit-origin').value         = s.origin;
    document.getElementById('edit-dest').value           = s.dest;
    document.getElementById('edit-service').value        = s.service;
    document.getElementById('edit-weight').value         = parseFloat(s.weight);
    document.getElementById('edit-amount').value         = parseFloat(s.amount.replace('₹','').replace(/,/g,''));
    document.getElementById('edit-status').value         = s.status;

    Validator.clearAllErrors(document.getElementById('edit-shipment-form'));
    Modal.open('edit-shipment-modal');
  }

  async function saveEdit() {
    const form = document.getElementById('edit-shipment-form');
    if (!Validator.validateForm(form)) {
      showToast('Please fix the errors before saving.', 'error');
      return;
    }

    const trackingId = document.getElementById('edit-ship-id').value;
    // Find the real backend UUID from AppState
    const state = window.AppState ? window.AppState.getState() : { orders: [] };
    const canonical = state.orders.find(o => o.tracking_id === trackingId || o.order_id === trackingId);
    const backendId = canonical ? (canonical.id || trackingId) : trackingId;

    const payload = {
      customerName: document.getElementById('edit-recipient').value.trim(),
      pickupAddress: document.getElementById('edit-origin').value.trim(),
      deliveryAddress: document.getElementById('edit-dest').value.trim(),
      packageType: document.getElementById('edit-service').value,
      weight: parseFloat(document.getElementById('edit-weight').value) || 1,
    };

    try {
      if (window.API && window.API.orders && backendId) {
        await window.API.orders.update(backendId, payload);
        if (window.AppState) await window.AppState.refresh();
      }
      Modal.close('edit-shipment-modal');
      render();
      showToast('Shipment updated successfully!');
    } catch (err) {
      console.error('[Orders] update failed:', err?.message || err);
      showToast('Update failed \u2014 ' + (err?.message || 'server error'), 'error');
    }
  }

  /* ── DELETE / CANCEL ── */
  async function confirmDelete(id) {
    const ok = await Confirm.show('Cancel Shipment', `Are you sure you want to cancel shipment ${id}? This cannot be undone.`);
    if (!ok) return;

    const state = window.AppState ? window.AppState.getState() : { orders: [] };
    const canonical = state.orders.find(o => o.tracking_id === id || o.order_id === id);
    const backendId = canonical ? (canonical.id || id) : id;

    try {
      if (window.API && window.API.orders && backendId) {
        await window.API.orders.cancel(backendId);
        if (window.AppState) await window.AppState.refresh();
      }
      render();
      if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
      showToast('Shipment cancelled.', 'warning');
    } catch (err) {
      console.error('[Orders] cancel failed:', err?.message || err);
      showToast('Cancel failed \u2014 ' + (err?.message || 'server error'), 'error');
    }
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Wire search input
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('orders-search')?.addEventListener('input', () => render());
    // Attach live validation to edit form
    const editForm = document.getElementById('edit-shipment-form');
    if (editForm) Validator.attachLiveValidation(editForm);
    
    // LIVE UI REFRESH
    window.addEventListener('appStateChanged', () => render());
  });

  return { render, setFilter, trackFrom, openEdit, saveEdit, confirmDelete };
})();
