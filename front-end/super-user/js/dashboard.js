/**
 * Dashboard Logic — Super Admin
 * Dynamically reads all KPIs from centralized state (localStorage).
 * No page reloads. Listens to appStateChanged + storage events.
 */

document.addEventListener("DOMContentLoaded", function () {
    function renderDashboard() {
        var users = StorageAPI.getUsers();
        var complaints = StorageAPI.getComplaints();
        var feedback = StorageAPI.getFeedback();
        var orders = StorageAPI.getOrders();
        var hubs = StorageAPI.getHubs();

        // --- KPI Cards ---
        var kpiUsers = document.getElementById("kpi-users");
        if (kpiUsers) kpiUsers.innerText = users.length;

        var openComplaints = complaints.filter(function(c) { return c.status !== "Resolved"; }).length;
        var kpiComplaints = document.getElementById("kpi-complaints");
        if (kpiComplaints) kpiComplaints.innerText = openComplaints;

        var pendingFeedback = feedback.filter(function(f) { return f.status === "Pending"; }).length;
        var kpiFeedback = document.getElementById("kpi-feedback");
        if (kpiFeedback) kpiFeedback.innerText = pendingFeedback;

        // Active Shipments KPI (dynamically from orders)
        var kpiShipments = document.getElementById("kpi-shipments");
        if (kpiShipments) {
            var activeOrders = orders.filter(function(o) {
                var st = (o.status || '').toLowerCase();
                return st !== 'delivered' && st !== 'cancelled';
            });
            kpiShipments.innerText = activeOrders.length.toLocaleString();
        }

        // --- Recent Users ---
        var recentUsersList = document.getElementById("recentUsersList");
        if (recentUsersList) {
            var topUsers = users.slice().reverse().slice(0, 4);
            if (topUsers.length === 0) {
                recentUsersList.innerHTML = '<div class="activity-item"><div class="activity-info"><span class="activity-title" style="color:var(--text-subtitle)">No users yet.</span></div></div>';
            } else {
                recentUsersList.innerHTML = topUsers.map(function(user) {
                    var badgeClass = user.status === 'Active' ? 'success' : (user.status === 'Suspended' ? 'error' : 'warning');
                    return '<div class="activity-item">' +
                        '<div class="activity-info">' +
                            '<span class="activity-title">' + user.name + '</span>' +
                            '<span class="activity-meta">' + user.email + ' • ' + user.role + '</span>' +
                        '</div>' +
                        '<span class="status-badge ' + badgeClass + '">' + user.status + '</span>' +
                    '</div>';
                }).join("");
            }
        }

        // --- Recent Complaints ---
        var recentComplaintsList = document.getElementById("recentComplaintsList");
        if (recentComplaintsList) {
            var topComplaints = complaints.slice().reverse().slice(0, 4);
            if (topComplaints.length === 0) {
                recentComplaintsList.innerHTML = '<div class="activity-item"><div class="activity-info"><span class="activity-title" style="color:var(--text-subtitle)">No complaints.</span></div></div>';
            } else {
                recentComplaintsList.innerHTML = topComplaints.map(function(comp) {
                    var badgeClass = comp.priority === 'Critical' ? 'error' : (comp.priority === 'High' ? 'warning' : 'blue');
                    return '<div class="activity-item">' +
                        '<div class="activity-info">' +
                            '<span class="activity-title">' + comp.type + '</span>' +
                            '<span class="activity-meta">' + comp.customer + ' • ' + comp.date + '</span>' +
                        '</div>' +
                        '<span class="status-badge ' + badgeClass + '">' + comp.priority + '</span>' +
                    '</div>';
                }).join("");
            }
        }
    }

    // Initial render
    renderDashboard();

    // Cross-page reactivity
    window.addEventListener('appStateChanged', renderDashboard);
    window.addEventListener('storage', function(e) {
        if (e.key === 'swifttrack_central_state') renderDashboard();
    });
});
