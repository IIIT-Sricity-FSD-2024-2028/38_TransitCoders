/**
 * Dashboard Logic — Now with live state reactivity
 */

async function renderDashboard() {
    await StorageAPI.init();
    // Load KPI Data
    const users = StorageAPI.getUsers();
    const complaints = StorageAPI.getComplaints();
    const feedback = StorageAPI.getFeedback();

    const kpiUsers = document.getElementById("kpi-users");
    if (kpiUsers) kpiUsers.innerText = users.length;
    
    const openComplaints = complaints.filter(c => c.status !== "Resolved").length;
    const kpiComplaints = document.getElementById("kpi-complaints");
    if (kpiComplaints) kpiComplaints.innerText = openComplaints;

    const pendingFeedback = feedback.filter(f => f.status === window.SwiftTrackEnums.FeedbackStatus.PENDING).length;
    const kpiFeedback = document.getElementById("kpi-feedback");
    if (kpiFeedback) kpiFeedback.innerText = pendingFeedback;

    // Render Recent Users
    const recentUsersList = document.getElementById("recentUsersList");
    if(recentUsersList) {
        // Just take last 3
        const topUsers = [...users].reverse().slice(0, 3);
        recentUsersList.innerHTML = topUsers.map(user => `
            <div class="activity-item">
                <div class="activity-info">
                    <span class="activity-title">${user.name}</span>
                    <span class="activity-meta">${user.email} • ${user.role}</span>
                </div>
                <span class="status-badge ${user.status === window.SwiftTrackEnums.UserStatus.ACTIVE ? 'success' : 'warning'}">${user.status}</span>
            </div>
        `).join("");
    }

    // Render Recent Complaints
    const recentComplaintsList = document.getElementById("recentComplaintsList");
    if(recentComplaintsList) {
        const topComplaints = [...complaints].reverse().slice(0, 3);
        recentComplaintsList.innerHTML = topComplaints.map(comp => `
            <div class="activity-item">
                <div class="activity-info">
                    <span class="activity-title">${comp.type}</span>
                    <span class="activity-meta">${comp.customer} • ${comp.date}</span>
                </div>
                <span class="status-badge ${comp.priority === 'Critical' ? 'error' : 'warning'}">${comp.priority}</span>
            </div>
        `).join("");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderDashboard();

    // Live reactivity: re-render when any actor changes state
    window.addEventListener('appStateChanged', renderDashboard);
});
