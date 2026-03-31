/**
 * Complaints Management Logic — Super Admin
 * Full CRUD with status changes, toast feedback, and cross-page sync.
 */

document.addEventListener("DOMContentLoaded", function () {
    var tableBody = document.getElementById("complaintsTableBody");
    var searchInput = document.getElementById("searchInput");
    var priorityFilter = document.getElementById("priorityFilter");
    var statusFilter = document.getElementById("statusFilter");

    function renderTable() {
        var complaints = StorageAPI.getComplaints();
        var search = searchInput.value.toLowerCase();
        var fPriority = priorityFilter.value;
        var fStatus = statusFilter.value;

        var filtered = complaints.filter(function(c) {
            var matchesSearch = c.id.toLowerCase().indexOf(search) !== -1 || 
                                 c.customer.toLowerCase().indexOf(search) !== -1 || 
                                 c.type.toLowerCase().indexOf(search) !== -1;
            var matchesPriority = fPriority === "All" || c.priority === fPriority;
            var matchesStatus = fStatus === "All" || c.status === fStatus;
            return matchesSearch && matchesPriority && matchesStatus;
        });

        if (filtered.length > 0) {
            tableBody.innerHTML = filtered.map(function(c) {
                var priorityClass = c.priority === 'Critical' ? 'badge-critical' : 
                                    c.priority === 'High' ? 'badge-high' : 
                                    c.priority === 'Medium' ? 'badge-medium' : 'badge-low';
                var statusClass = c.status === 'Resolved' ? 'badge-resolved' : 
                                  c.status === 'Escalated' ? 'badge-escalated' : 'badge-open';

                var actionButtons = '';
                if (c.status !== 'Resolved') {
                    actionButtons += '<button class="quick-status-btn" data-id="' + c.id + '" data-new-status="Resolved">Mark Resolved</button>';
                }
                if (c.status === 'Open') {
                    actionButtons += '<button class="quick-status-btn" data-id="' + c.id + '" data-new-status="Escalated">Escalate Issue</button>';
                }
                if (c.status === 'Resolved') {
                    actionButtons += '<button class="quick-status-btn" data-id="' + c.id + '" data-new-status="Open">Reopen</button>';
                }
                actionButtons += '<button class="danger delete-btn" data-id="' + c.id + '">Delete</button>';

                return '<tr>' +
                    '<td><span class="user-name-text">' + c.id + '</span></td>' +
                    '<td>' +
                        '<span class="user-name-text">' + c.customer + '</span>' +
                        '<span class="user-id-text">' + c.date + '</span>' +
                    '</td>' +
                    '<td>' + c.type + '</td>' +
                    '<td><span class="status-badge ' + priorityClass + '">' + c.priority + '</span></td>' +
                    '<td><span class="status-badge ' + statusClass + '">' + c.status + '</span></td>' +
                    '<td class="actions-col">' +
                        '<div class="action-dropdown" tabindex="0">' +
                            '<button class="action-icon">' +
                                '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>' +
                            '</button>' +
                            '<div class="action-menu">' + actionButtons + '</div>' +
                        '</div>' +
                    '</td>' +
                '</tr>';
            }).join("");
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-subtitle)">No complaints found.</td></tr>';
        }

        // Attach listeners
        document.querySelectorAll('.quick-status-btn').forEach(function(b) {
            b.addEventListener('click', function(e) {
                var id = e.currentTarget.dataset.id;
                var newStatus = e.currentTarget.dataset.newStatus;
                StorageAPI.updateComplaintStatus(id, newStatus);
                renderTable();
                if (typeof showToast === 'function') {
                    showToast('Complaint ' + id + ' marked as "' + newStatus + '".', 'success');
                }
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(function(b) {
            b.addEventListener('click', function(e) {
                var id = e.currentTarget.dataset.id;
                if (confirm('Delete complaint ' + id + ' permanently?')) {
                    var list = StorageAPI.getComplaints();
                    list = list.filter(function(item) { return item.id !== id; });
                    StorageAPI._save("complaints", list);
                    renderTable();
                    if (typeof showToast === 'function') {
                        showToast('Complaint ' + id + ' deleted.', 'warning');
                    }
                }
            });
        });
    }

    searchInput.addEventListener("input", renderTable);
    priorityFilter.addEventListener("change", renderTable);
    statusFilter.addEventListener("change", renderTable);

    renderTable();

    window.addEventListener('appStateChanged', renderTable);
    window.addEventListener('storage', function(e) {
        if (e.key === 'swifttrack_central_state') renderTable();
    });
});
