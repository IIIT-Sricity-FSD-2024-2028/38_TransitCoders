/**
 * Admin Complaints Management JS
 */
document.addEventListener('DOMContentLoaded', async () => {
    await AdminStorage.init();
    renderComplaints();
    document.getElementById('complaintSearch')?.addEventListener('input', renderComplaints);
    document.getElementById('complaintStatusFilter')?.addEventListener('change', renderComplaints);
});

function showToast(msg, type) {
    let c = document.querySelector('.toast-container');
    if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'info');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}

function getStatusClass(s) {
    return { 'Open':'warning', 'In Progress':'blue', 'Resolved':'success', 'Closed':'error' }[s] || 'blue';
}

function getPriorityClass(p) {
    return p.toLowerCase();
}

function renderComplaints() {
    let complaints = AdminStorage.getComplaints();
    const search = document.getElementById('complaintSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('complaintStatusFilter')?.value || '';

    if (search) complaints = complaints.filter(c =>
        c.id.toLowerCase().includes(search) || c.customer.toLowerCase().includes(search) || c.type.toLowerCase().includes(search)
    );
    if (statusFilter) complaints = complaints.filter(c => c.status === statusFilter);

    const tbody = document.getElementById('complaintsTableBody');
    tbody.innerHTML = '';

    if (complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-subtitle);">No complaints found</td></tr>';
        return;
    }

    complaints.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600;color:var(--text-title)">${c.id}</td>
            <td>${c.customer}</td>
            <td>${c.type}</td>
            <td><span class="priority-badge ${getPriorityClass(c.priority)}">${c.priority}</span></td>
            <td><span class="status-badge ${getStatusClass(c.status)}">${c.status}</span></td>
            <td>${c.date}</td>
            <td>
                <div class="table-actions">
                    <button class="action-btn" title="View" onclick="viewComplaint('${c.id}')">
                        <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="action-btn" title="Assign" onclick="assignComplaint('${c.id}')">
                        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </button>
                    <button class="action-btn" title="Resolve" onclick="resolveComplaint('${c.id}')">
                        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button class="action-btn" title="Close" onclick="closeComplaint('${c.id}')">
                        <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </button>
                    <button class="action-btn danger" title="Delete" onclick="deleteComplaint('${c.id}')">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewComplaint(id) {
    const c = AdminStorage.getComplaints().find(x => x.id === id);
    if (!c) return;
    const body = document.getElementById('viewComplaintBody');
    body.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Complaint ID</div><div style="font-weight:600;">${c.id}</div></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Customer</div><div style="font-weight:600;">${c.customer}</div></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Type</div><div>${c.type}</div></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Priority</div><span class="priority-badge ${getPriorityClass(c.priority)}">${c.priority}</span></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Status</div><span class="status-badge ${getStatusClass(c.status)}">${c.status}</span></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Assigned To</div><div>${c.assignedTo}</div></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Order ID</div><div>${c.orderId}</div></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Date</div><div>${c.date}</div></div>
        </div>
        <div class="complaint-description"><strong>Description:</strong><br>${c.description}</div>
    `;
    document.getElementById('viewComplaintModal').classList.add('active');
}

function closeViewComplaintModal() {
    document.getElementById('viewComplaintModal').classList.remove('active');
}

function assignComplaint(id) {
    document.getElementById('assignComplaintId').value = id;
    document.getElementById('assignTeamSelect').value = '';
    document.getElementById('assignComplaintModal').classList.add('active');
}

function closeAssignComplaintModal() {
    document.getElementById('assignComplaintModal').classList.remove('active');
}

function confirmAssignComplaint() {
    const id = document.getElementById('assignComplaintId').value;
    const team = document.getElementById('assignTeamSelect').value;
    if (!team) { showToast('Please select a team', 'warning'); return; }
    AdminStorage.updateComplaint(id, { assignedTo: team, status: 'In Progress' });
    closeAssignComplaintModal();
    showToast('Complaint assigned to ' + team, 'success');
    renderComplaints();
}

function resolveComplaint(id) {
    AdminStorage.updateComplaint(id, { status: 'Resolved' });
    showToast('Complaint resolved', 'success');
    renderComplaints();
}

function closeComplaint(id) {
    AdminStorage.updateComplaint(id, { status: 'Closed' });
    showToast('Complaint closed', 'info');
    renderComplaints();
}

function deleteComplaint(id) {
    if (!confirm('Delete complaint ' + id + '?')) return;
    AdminStorage.deleteComplaint(id);
    showToast('Complaint deleted', 'error');
    renderComplaints();
}
