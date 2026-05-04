/**
 * Complaints Management — wired to backend API
 * Falls back to StorageAPI if backend is offline.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody     = document.getElementById("complaintsTableBody");
  const searchInput   = document.getElementById("searchInput");
  const priorityFilter = document.getElementById("priorityFilter");
  const statusFilter  = document.getElementById("statusFilter");

  let complaints = [];

  function getUsersById() {
    const users = window.AppState?.getState?.().users || [];
    return new Map(users.map((user) => [user.user_id || user.id, user]));
  }

  function buildReference(prefix, index) {
    return `${prefix}-${String(index + 1).padStart(4, "0")}`;
  }

  // Load from backend and local Storage; merge and normalize so UI never shows literal 'undefined'
  async function loadComplaints() {
    const usersById = getUsersById();
    const safe = (v, fallback) => {
      if (v === undefined || v === null) return fallback;
      if (typeof v === 'string' && v.trim().toLowerCase() === 'undefined') return fallback;
      return v;
    };

    // Try backend first; if backend is reachable use it, but always merge local Storage entries
    let backendList = [];
    try {
      backendList = await window.API.complaints.getAll() || [];
    } catch (e) {
      backendList = [];
    }

    // Local stored complaints (may include newly created ones when offline)
    const localList = (StorageAPI?.getComplaints?.() || []);

    // Merge, preferring backend entries, dedupe by id
    const merged = [...backendList];
    for (const l of localList) {
      if (!merged.find(b => b && (b.id === l.id || b.id === l._id))) merged.push(l);
    }

    // Normalize merged shape → table shape
    complaints = merged.map((c, index) => ({
      id: safe(c.id || c._id, 'CMP-' + Date.now().toString().slice(-6)),
      reference: safe(c.reference, buildReference('CMP', index)),
      customer: safe(c.customerName, safe(c.customer, usersById.get(c.userId)?.name || c.userId || 'Customer')),
      type: safe(c.description, c.type || '—'),
      priority: safe(c.priority, 'Medium'),
      status: safe(c.status, 'Open'),
      date: c.date ? new Date(c.date).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : (c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : ''),
      _raw: c,
    }));
  }

  function renderTable() {
    const search    = searchInput.value.toLowerCase();
    const fPriority = priorityFilter.value;
    const fStatus   = statusFilter.value;

    const filtered = complaints.filter(c => {
      const matchSearch   = c.reference.toLowerCase().includes(search) ||
                            c.id.toLowerCase().includes(search) ||
                            (c.customer || '').toLowerCase().includes(search) ||
                            (c.type || '').toLowerCase().includes(search);
      const matchPriority = fPriority === "All" || c.priority === fPriority;
      const matchStatus   = fStatus === "All"   || c.status === fStatus;
      return matchSearch && matchPriority && matchStatus;
    });

    tableBody.innerHTML = filtered.length > 0 ? filtered.map(c => `
      <tr>
        <td><span class="user-name-text">${c.reference || ''}</span><span class="user-id-text">${c.id || ''}</span></td>
        <td>
          <span class="user-name-text">${c.customer}</span>
          <span class="user-id-text">${c.date || ''}</span>
        </td>
        <td>${c.type}</td>
        <td><span class="status-badge badge-${(c.priority || 'medium').toLowerCase()}">${c.priority || 'Medium'}</span></td>
        <td><span class="status-badge badge-${(c.status || '').toLowerCase().replace(/ /g,'-')}">${c.status}</span></td>
        <td class="actions-col">
          <div class="action-dropdown" tabindex="0">
            <button class="action-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
            </button>
            <div class="action-menu">
              ${c.status !== 'Resolved' ? `<button class="quick-status-btn" data-id="${c._raw?.id || c.id}" data-new-status="Resolved">Mark Resolved</button>` : ''}
              ${c.status === window.SwiftTrackEnums.ComplaintStatus.OPEN ? `<button class="quick-status-btn" data-id="${c._raw?.id || c.id}" data-new-status="In Progress">Mark In Progress</button>` : ''}
              ${c.status === window.SwiftTrackEnums.ComplaintStatus.RESOLVED ? `<button class="quick-status-btn" data-id="${c._raw?.id || c.id}" data-new-status="Open">Reopen</button>` : ''}
            </div>
          </div>
        </td>
      </tr>
    `).join("") : `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-subtitle)">No complaints found.</td></tr>`;

    document.querySelectorAll('.quick-status-btn').forEach(b => b.addEventListener('click', async (e) => {
      const id     = e.currentTarget.dataset.id;
      const status = e.currentTarget.dataset.newStatus;
      try {
        await window.API.complaints.update(id, { status });
      } catch (_) {
        StorageAPI?.updateComplaintStatus?.(id, status);
      }
      await loadComplaints();
      renderTable();
    }));
  }

  searchInput.addEventListener("input", renderTable);
  priorityFilter.addEventListener("change", renderTable);
  statusFilter.addEventListener("change", renderTable);

  await loadComplaints();
  renderTable();

  window.addEventListener('appStateChanged', async () => { await loadComplaints(); renderTable(); });
});
