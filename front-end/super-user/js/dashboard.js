/**
 * Dashboard Logic
 */

document.addEventListener("DOMContentLoaded", async () => {
    await StorageAPI.init();
    // Load KPI Data
    const users = StorageAPI.getUsers();
    const complaints = StorageAPI.getComplaints();
    const feedback = StorageAPI.getFeedback();

    document.getElementById("kpi-users").innerText = users.length;
    
    const openComplaints = complaints.filter(c => c.status !== "Resolved").length;
    document.getElementById("kpi-complaints").innerText = openComplaints;

    const pendingFeedback = feedback.filter(f => f.status === "Pending").length;
    document.getElementById("kpi-feedback").innerText = pendingFeedback;

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
                <span class="status-badge ${user.status === 'Active' ? 'success' : 'warning'}">${user.status}</span>
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
});
