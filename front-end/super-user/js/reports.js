/**
 * Reports & Analytics — Data-Driven Charts
 * Bug Fix F6: Replaced StorageAPI with window.AppState.getState() which is
 * hydrated from the NestJS backend. All chart data now comes from live API data.
 */
document.addEventListener("DOMContentLoaded", async () => {
    // Ensure state is hydrated before rendering
    if (window.AppState && typeof window.AppState.hydrate === 'function') {
        await window.AppState.hydrate();
    }

    const state      = window.AppState ? window.AppState.getState() : {};
    const users      = state.users      || [];
    const complaints = state.complaints || [];
    const feedback   = state.feedback   || [];

    // === 1. User Growth Trends — Bar chart by role ===
    const userChart = document.querySelector('[data-type="line"]');
    if (userChart) {
        const roleCounts = {};
        users.forEach(u => {
            const role = u.role || 'Unknown';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
        const maxCount = Math.max(...Object.values(roleCounts), 1);
        const colors = {
            'super_user': 'var(--clr-orange-500)', 'admin': 'var(--clr-blue-700)', 'hub_manager': 'var(--clr-blue-500)',
            'merchant': 'var(--clr-green-500)', 'delivery_agent': 'var(--clr-amber-500)', 'customer': 'var(--clr-neutral-500)',
            'support_staff': 'var(--clr-red-500)'
        };
        const roleLabels = {
            'super_user': 'Super User', 'admin': 'Admin', 'hub_manager': 'Hub Manager',
            'merchant': 'Merchant', 'delivery_agent': 'Delivery Agent', 'customer': 'Customer',
            'support_staff': 'Support'
        };

        userChart.innerHTML = `
            <div class="report-chart-bars">
                ${Object.entries(roleCounts).map(([role, count]) => `
                    <div class="report-bar-group">
                        <div class="report-bar-value">${count}</div>
                        <div class="report-bar" style="height:${Math.max((count / maxCount) * 140, 8)}px; background:${colors[role] || 'var(--clr-neutral-400)'}"></div>
                        <div class="report-bar-label">${roleLabels[role] || role}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // === 2. Complaint Volume — Horizontal chart by status ===
    const complaintChart = document.querySelector('[data-type="bar"]');
    if (complaintChart) {
        const typeCounts = {};
        complaints.forEach(c => {
            const key = c.status || 'Open';
            typeCounts[key] = (typeCounts[key] || 0) + 1;
        });
        const maxType = Math.max(...Object.values(typeCounts), 1);
        const typeColors = ['var(--clr-red-500)', 'var(--clr-orange-500)', 'var(--clr-amber-500)', 'var(--clr-blue-500)', 'var(--clr-blue-700)', 'var(--clr-green-300)', 'var(--clr-green-500)'];

        complaintChart.innerHTML = `
            <div class="report-h-bars">
                ${Object.entries(typeCounts).map(([type, count], i) => `
                    <div class="report-h-bar-row">
                        <span class="report-h-label">${type}</span>
                        <div class="report-h-track">
                            <div class="report-h-fill" style="width:${(count / maxType) * 100}%; background:${typeColors[i % typeColors.length]}"></div>
                        </div>
                        <span class="report-h-count">${count}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // === 3. Platform Usage — Active vs Total Users donut ===
    const donutChart = document.querySelector('[data-type="donut"]');
    if (donutChart) {
        const totalUsers  = users.length;
        const activeUsers = users.filter(u => u.isActive !== false && u.active !== false).length;
        const pct = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
        donutChart.style.background = `conic-gradient(var(--clr-orange-500) 0% ${pct}%, var(--clr-neutral-200) ${pct}% 100%)`;
        donutChart.style.border = 'none';
        donutChart.innerHTML = `
            <div class="report-donut-inner">
                <div class="report-donut-pct">${pct}%</div>
                <div class="report-donut-label">Active Users</div>
            </div>
        `;
    }

    // === 4. Complaint Status Mini Stats ===
    const uptimeChart = document.querySelector('[data-type="line-mini"]');
    if (uptimeChart) {
        const openComplaints = complaints.filter(c => (c.status || '').toLowerCase() === 'open').length;
        const escalated      = complaints.filter(c => (c.status || '').toLowerCase() === 'escalated').length;
        const resolved       = complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;
        uptimeChart.innerHTML = `
            <div class="report-mini-stats">
                <div class="report-mini-stat">
                    <div class="report-mini-num" style="color:var(--clr-red-500)">${openComplaints}</div>
                    <div class="report-mini-label">Open</div>
                </div>
                <div class="report-mini-stat">
                    <div class="report-mini-num" style="color:var(--clr-amber-500)">${escalated}</div>
                    <div class="report-mini-label">Escalated</div>
                </div>
                <div class="report-mini-stat">
                    <div class="report-mini-num" style="color:var(--clr-green-500)">${resolved}</div>
                    <div class="report-mini-label">Resolved</div>
                </div>
            </div>
        `;
    }

    // === 5. Feedback Rating Distribution ===
    const dbChart = document.querySelector('[data-type="bar-mini"]');
    if (dbChart) {
        const ratingDist = [0, 0, 0, 0, 0];
        feedback.forEach(f => {
            const r = Number(f.rating);
            if (r >= 1 && r <= 5) ratingDist[r - 1]++;
        });
        const maxR = Math.max(...ratingDist, 1);
        const starColors = ['var(--clr-red-500)', 'var(--clr-orange-500)', 'var(--clr-amber-500)', 'var(--clr-green-300)', 'var(--clr-green-500)'];
        dbChart.innerHTML = `
            <div class="report-chart-bars" style="gap:16px">
                ${ratingDist.map((count, i) => `
                    <div class="report-bar-group">
                        <div class="report-bar-value">${count}</div>
                        <div class="report-bar" style="height:${Math.max((count / maxR) * 100, 6)}px; background:${starColors[i]}"></div>
                        <div class="report-bar-label">${'★'.repeat(i + 1)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
});
