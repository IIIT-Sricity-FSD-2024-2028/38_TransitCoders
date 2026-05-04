/* js/modules/tracking.js – Shipment Tracking */

const Tracking = (() => {
  function doTrack() {
    const v      = (document.getElementById('track-input')?.value || '').trim();
    const result = document.getElementById('track-result');
    if (!result) return;

    if (!v) {
      result.style.display = 'none';
      showToast('Please enter a tracking ID.', 'error');
      return;
    }

    const ship = MockDB.getShipment(v);
    if (!ship) {
      result.style.display = 'none';
      showToast('No shipment found with that tracking ID.', 'error');
      return;
    }

    result.style.display = 'block';

    // Update detail panel if exists
    const el = id => document.getElementById(id);
    if (el('track-tid'))   el('track-tid').textContent   = ship.id;
    if (el('track-recv'))  el('track-recv').textContent  = ship.recipient;
    if (el('track-from'))  el('track-from').textContent  = ship.origin;
    if (el('track-to'))    el('track-to').textContent    = ship.dest;
    if (el('track-svc'))   el('track-svc').textContent   = ship.service;
    if (el('track-status-badge')) el('track-status-badge').innerHTML = `<span class="badge b-${ship.status}">${ship.status.replace('-',' ')}</span>`;

    showToast(`Tracking info loaded for ${ship.id}`);
  }

  return { doTrack };
})();

function doTrack() { Tracking.doTrack(); }


/* ══════════════════════════════════════════
   SUPPORT MODULE
══════════════════════════════════════════ */
const Support = (() => {
  const prioLabel = { high: 'High', med: 'Medium', low: 'Low' };
  let ticketFilter = 'all';

  function renderTickets(filter) {
    if (filter) ticketFilter = filter;
    const user = Auth.currentUser();
    const mid  = Auth.isSuperUser() ? null : user?.user_id;
    let data   = MockDB.getTickets(mid);
    if (ticketFilter !== 'all') data = data.filter(t => t.status === ticketFilter);

    const tbody = document.getElementById('ticket-table');
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No tickets found.</td></tr>';
      return;
    }

    const canDelete = Auth.isSuperUser() || Auth.isMerchant();

    tbody.innerHTML = data.map(t => `
      <tr class="table-row">
        <td><span class="tracking-id">${t.id}</span></td>
        <td style="font-weight:500">${escapeHtml(t.subject)}</td>
        <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--orange)">${t.tid}</span></td>
        <td><span class="priority-dot p-${t.priority.slice(0,3)}"></span>${prioLabel[t.priority] || t.priority}</td>
        <td style="color:var(--mid)">${t.date}</td>
        <td>${t.status === window.SwiftTrackEnums.TicketStatus.OPEN ? '<span class="badge b-in-transit">Open</span>' : '<span class="badge b-delivered">Resolved</span>'}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick="Support.toggleStatus('${t.id}')">
              ${t.status === window.SwiftTrackEnums.TicketStatus.OPEN ? 'Resolve' : 'Reopen'}
            </button>
            ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="Support.confirmDeleteTicket('${t.id}')">Delete</button>` : ''}
          </div>
        </td>
      </tr>`).join('');
  }

  function filterTickets(f, btn) {
    document.querySelectorAll('#view-support .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTickets(f);
  }

  function toggleStatus(id) {
    const t = MockDB.tickets.find(t => t.id === id);
    if (!t) return;
    const newStatus = t.status === window.SwiftTrackEnums.TicketStatus.OPEN ? window.SwiftTrackEnums.TicketStatus.RESOLVED : window.SwiftTrackEnums.TicketStatus.OPEN;
    MockDB.updateTicket(id, { status: newStatus });
    renderTickets();
    showToast(`Ticket ${id} marked as ${newStatus}.`);
  }

  async function confirmDeleteTicket(id) {
    const ok = await Confirm.show('Delete Ticket', `Delete ticket ${id}? This cannot be undone.`);
    if (!ok) return;
    MockDB.deleteTicket(id);
    renderTickets();
    showToast('Ticket deleted.', 'warning');
  }

  function openNewTicketModal() {
    const form = document.getElementById('new-ticket-form');
    if (form) { form.reset(); Validator.clearAllErrors(form); }
    Modal.open('new-ticket-modal');
  }

  function submitNewTicket() {
    const form = document.getElementById('new-ticket-form');
    if (!Validator.validateForm(form)) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    const newTicket = MockDB.addTicket({
      subject:  document.getElementById('ticket-subject').value.trim(),
      tid:      document.getElementById('ticket-shipment-id').value.trim() || 'N/A',
      priority: document.getElementById('ticket-priority').value,
    });
    Modal.close('new-ticket-modal');
    renderTickets();
    showToast(`Ticket ${newTicket.id} created successfully!`);
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('new-ticket-form');
    if (form) Validator.attachLiveValidation(form);
  });

  return { renderTickets, filterTickets, toggleStatus, confirmDeleteTicket, openNewTicketModal, submitNewTicket };
})();


/* ══════════════════════════════════════════
   ANALYTICS MODULE
══════════════════════════════════════════ */
const Analytics = (() => {
  function render() {
    const user  = Auth.currentUser();
    const mid   = Auth.isSuperUser() ? null : user?.user_id;
    const stats = MockDB.getStats(mid);

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('ana-total',     stats.total);
    set('ana-delivered', stats.delivered);
    set('ana-transit',   stats.inTransit);
    set('ana-revenue',   '₹' + parseFloat(stats.revenue).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
  }
  return { render };
})();


/* ══════════════════════════════════════════
   ADMIN PANEL MODULE (Super User only)
══════════════════════════════════════════ */
const AdminPanel = (() => {
  function render() {
    if (!Auth.isSuperUser()) {
      showToast('Access denied. Super User role required.', 'error');
      navigate('dashboard');
      return;
    }
    renderUserTable();
    renderAllShipments();
  }

  function renderUserTable() {
    const tbody = document.getElementById('admin-users-table');
    if (!tbody) return;
    tbody.innerHTML = MockDB.users.map(u => `
      <tr class="table-row">
        <td><div class="user-avatar" style="display:inline-flex;font-size:10px">${u.avatar}</div></td>
        <td style="font-weight:600">${u.name}</td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role === 'superuser' ? 'b-processing' : u.role === 'admin' ? 'b-in-transit' : 'b-delivered'}">${u.role}</span></td>
        <td>${u.company}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="AdminPanel.simulateLogin('${u.email}')">View As</button>
        </td>
      </tr>`).join('');
  }

  function renderAllShipments() {
    const tbody = document.getElementById('admin-all-shipments');
    if (!tbody) return;
    const data = MockDB.shipments;
    const statusBadge = {
      'delivered':  '<span class="badge b-delivered">Delivered</span>',
      'in-transit': '<span class="badge b-in-transit">In Transit</span>',
      'pending':    '<span class="badge b-pending">Pending</span>',
      'cancelled':  '<span class="badge b-cancelled">Cancelled</span>',
    };
    tbody.innerHTML = data.map(s => `
      <tr class="table-row">
        <td><span class="tracking-id">${s.id}</span></td>
        <td>${s.recipient}</td>
        <td style="color:var(--mid);font-size:11px">${s.origin} → ${s.dest}</td>
        <td>${s.service}</td>
        <td>${statusBadge[s.status] || s.status}</td>
        <td>
          <select class="form-input btn-sm" style="width:120px" onchange="AdminPanel.changeStatus('${s.id}',this.value)">
            <option value="in-transit"  ${s.status==='in-transit'?'selected':''}>In Transit</option>
            <option value="delivered"   ${s.status==='delivered'?'selected':''}>Delivered</option>
            <option value="pending"     ${s.status==='pending'?'selected':''}>Pending</option>
            <option value="cancelled"   ${s.status==='cancelled'?'selected':''}>Cancelled</option>
          </select>
        </td>
      </tr>`).join('');
  }

  function changeStatus(id, status) {
    MockDB.updateShipment(id, { status });
    renderAllShipments();
    showToast(`Shipment ${id} status updated to ${status}.`);
  }

  function simulateLogin(email) {
    showToast(`Viewing system as ${email} — demonstration only.`, 'info');
  }

  return { render, renderUserTable, renderAllShipments, changeStatus, simulateLogin };
})();

// Export for global inline onclick access
window.Support = Support;
window.Analytics = Analytics;
window.AdminPanel = AdminPanel;
