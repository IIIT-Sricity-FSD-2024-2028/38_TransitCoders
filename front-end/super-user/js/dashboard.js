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

    const roleFromLegacyKey = String(localStorage.getItem("userRole") || "").toLowerCase();
    const isAdmin = roleFromLegacyKey === 'admin';

    if (isAdmin) {
        const titleEl = document.getElementById("page-title");
        if (titleEl) titleEl.innerText = "Business Overview";
        const subtitleEl = document.getElementById("page-subtitle");
        if (subtitleEl) subtitleEl.innerText = "Real-time business performance and operations.";
        const topbarTitle = document.getElementById("topbar-title");
        if (topbarTitle) topbarTitle.innerText = "Business Dashboard";

        const kpi1Label = document.getElementById("kpi-1-label");
        if (kpi1Label) kpi1Label.innerText = "Total Revenue";
        const kpiUsers = document.getElementById("kpi-users");
        const kpi1Icon = document.getElementById("kpi-1-icon");
        if (kpi1Icon) kpi1Icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;

        const kpi4Label = document.getElementById("kpi-4-label");
        if (kpi4Label) kpi4Label.innerText = "Net Profit";
        const kpiHealth = document.getElementById("kpi-health");
        const kpi4Icon = document.getElementById("kpi-4-icon");
        if (kpi4Icon) kpi4Icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;

        try {
            const rev = await window.API.reports.getRevenue();
            if (kpiUsers) kpiUsers.innerText = `₹${rev.netRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
            if (kpiHealth) kpiHealth.innerText = `₹${rev.operatingProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        } catch (e) {
            console.error(e);
            if (kpiUsers) kpiUsers.innerText = "--";
            if (kpiHealth) kpiHealth.innerText = "--";
        }
    } else {
        const kpiUsers = document.getElementById("kpi-users");
        if (kpiUsers) kpiUsers.innerText = users.length;
    }

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
