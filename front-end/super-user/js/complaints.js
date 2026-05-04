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

  // Load from backend, fall back to StorageAPI
  async function loadComplaints() {
    try {
      complaints = await window.API.complaints.getAll();
      // Normalize backend shape → table shape
      complaints = complaints.map(c => ({
        id: c.id,
        customer: c.userId || 'Customer',
        type: c.description || '—',
        priority: 'Medium',  // backend doesn't have priority on complaints
        status: c.status || 'Open',
        date: new Date(c.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' }),
        _raw: c,
      }));
    } catch (_) {
      // fallback
      complaints = (StorageAPI?.getComplaints?.() || []);
    }
  }

  function renderTable() {
    const search    = searchInput.value.toLowerCase();
    const fPriority = priorityFilter.value;
    const fStatus   = statusFilter.value;

    const filtered = complaints.filter(c => {
      const matchSearch   = c.id.toLowerCase().includes(search) ||
                            (c.customer || '').toLowerCase().includes(search) ||
                            (c.type || '').toLowerCase().includes(search);
      const matchPriority = fPriority === "All" || c.priority === fPriority;
      const matchStatus   = fStatus === "All"   || c.status === fStatus;
      return matchSearch && matchPriority && matchStatus;
    });

    tableBody.innerHTML = filtered.length > 0 ? filtered.map(c => `
      <tr>
        <td><span class="user-name-text">${c.id}</span></td>
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
