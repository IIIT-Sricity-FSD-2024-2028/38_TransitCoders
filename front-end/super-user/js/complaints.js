/**
 * Complaints Management Logic
 */

document.addEventListener("DOMContentLoaded", async () => {
    await StorageAPI.init();
    const tableBody = document.getElementById("complaintsTableBody");
    const searchInput = document.getElementById("searchInput");
    const priorityFilter = document.getElementById("priorityFilter");
    const statusFilter = document.getElementById("statusFilter");

    function renderTable() {
        const complaints = StorageAPI.getComplaints();
        const search = searchInput.value.toLowerCase();
        const fPriority = priorityFilter.value;
        const fStatus = statusFilter.value;

        // Filter 
        let filtered = complaints.filter(c => {
            const matchesSearch = c.id.toLowerCase().includes(search) || c.customer.toLowerCase().includes(search) || c.type.toLowerCase().includes(search);
            const matchesPriority = fPriority === "All" || c.priority === fPriority;
            const matchesStatus = fStatus === "All" || c.status === fStatus;
            return matchesSearch && matchesPriority && matchesStatus;
        });

        tableBody.innerHTML = filtered.length > 0 ? filtered.map(c => `
            <tr>
                <td><span class="user-name-text">${c.id}</span></td>
                <td>
                    <span class="user-name-text">${c.customer}</span>
                    <span class="user-id-text">${c.date}</span>
                </td>
                <td>${c.type}</td>
                <td><span class="status-badge badge-${c.priority.toLowerCase()}">${c.priority}</span></td>
                <td><span class="status-badge badge-${c.status.toLowerCase()}">${c.status}</span></td>
                <td class="actions-col">
                    <div class="action-dropdown" tabindex="0">
                        <button class="action-icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                        </button>
                        <div class="action-menu">
                            ${c.status !== 'Resolved' ? `<button class="quick-status-btn" data-id="${c.id}" data-new-status="Resolved">Mark Resolved</button>` : ''}
                            ${c.status === 'Open' ? `<button class="quick-status-btn" data-id="${c.id}" data-new-status="Escalated">Escalate Issue</button>` : ''}
                            ${c.status === 'Resolved' ? `<button class="quick-status-btn" data-id="${c.id}" data-new-status="Open">Reopen</button>` : ''}
                            <button class="danger delete-btn" data-id="${c.id}">Delete</button>
                        </div>
                    </div>
                </td>
            </tr>
        `).join("") : `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-subtitle)">No complaints found.</td></tr>`;

        // Attach listeners
        document.querySelectorAll('.quick-status-btn').forEach(b => b.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const status = e.currentTarget.dataset.newStatus;
            StorageAPI.updateComplaintStatus(id, status);
            renderTable();
        }));
        
        document.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', (e) => {
            if(confirm('Delete complaint permanently?')) {
                const id = e.currentTarget.dataset.id;
                let list = StorageAPI.getComplaints();
                list = list.filter(item => item.id !== id);
                StorageAPI._save("complaints", list);
                renderTable();
            }
        }));
    }

    searchInput.addEventListener("input", renderTable);
    priorityFilter.addEventListener("change", renderTable);
    statusFilter.addEventListener("change", renderTable);

    renderTable();
});
