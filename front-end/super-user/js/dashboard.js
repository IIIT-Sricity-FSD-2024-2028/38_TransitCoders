/**
 * Dashboard Logic — Reads live data from AppState (backend-backed).
 * StorageAPI removed: Bug Fix F5 — replaced with window.AppState.getState()
 * which is hydrated from the NestJS backend on every page load.
 */

async function renderDashboard() {
    // Wait for hydration if not yet complete
    if (window.AppState && typeof window.AppState.hydrate === 'function') {
        await window.AppState.hydrate();
    }

    const state = window.AppState ? window.AppState.getState() : { users: [], complaints: [], feedback: [] };
    const users      = state.users      || [];
    const complaints = state.complaints || [];
    const feedback   = state.feedback   || [];

    const kpiUsers = document.getElementById("kpi-users");
    if (kpiUsers) kpiUsers.innerText = users.length;

    const openComplaints = complaints.filter(c => c.status !== "Resolved").length;
    const kpiComplaints = document.getElementById("kpi-complaints");
    if (kpiComplaints) kpiComplaints.innerText = openComplaints;

    const pendingFeedback = feedback.filter(f => f.status === 'New' || f.status === 'Pending').length;
    const kpiFeedback = document.getElementById("kpi-feedback");
    if (kpiFeedback) kpiFeedback.innerText = pendingFeedback;

    // Render Recent Users
    const recentUsersList = document.getElementById("recentUsersList");
    if (recentUsersList) {
        const topUsers = [...users].reverse().slice(0, 3);
        recentUsersList.innerHTML = topUsers.map(user => `
            <div class="activity-item">
                <div class="activity-info">
                    <span class="activity-title">${user.name}</span>
                    <span class="activity-meta">${user.email} • ${user.role}</span>
                </div>
                <span class="status-badge ${user.isActive ? 'success' : 'warning'}">${user.isActive ? 'Active' : 'Pending'}</span>
            </div>
        `).join("");
    }

    // Render Recent Complaints
    const recentComplaintsList = document.getElementById("recentComplaintsList");
    if (recentComplaintsList) {
        const topComplaints = [...complaints].reverse().slice(0, 3);
        recentComplaintsList.innerHTML = topComplaints.map(comp => `
            <div class="activity-item">
                <div class="activity-info">
                    <span class="activity-title">${comp.description || comp.details || 'Complaint'}</span>
                    <span class="activity-meta">${comp.userId || comp.customer_id || ''} • ${comp.date || ''}</span>
                </div>
                <span class="status-badge ${comp.status === 'Resolved' ? 'success' : 'warning'}">${comp.status || 'Open'}</span>
            </div>
        `).join("");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderDashboard();

    // Live reactivity: re-render when backend state refreshes
    window.addEventListener('appStateChanged', renderDashboard);
});
