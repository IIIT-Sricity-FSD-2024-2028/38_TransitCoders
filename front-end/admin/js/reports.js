/**
 * Admin Reports / Operational Intelligence JS
 */
document.addEventListener('DOMContentLoaded', async () => {
    await AdminStorage.init();
    renderReports();
});

function renderReports() {
    const orders = AdminStorage.getOrders();
    const agents = AdminStorage.getAgents();
    const reports = AdminStorage.getReports();
    const transfers = AdminStorage.getTransfers();

    // Network health
    const activeDeliveries = orders.filter(o => o.status === 'In Transit' || o.status === 'Out for Delivery').length;
    const totalOrders = orders.length;
    const healthPercent = totalOrders > 0 ? Math.round((orders.filter(o => o.status !== 'Cancelled').length / totalOrders) * 100) : 100;

    document.getElementById('networkHealth').textContent = healthPercent + '%';
    document.getElementById('activeDeliveries').textContent = activeDeliveries;
    document.getElementById('hubLoad').textContent = transfers.filter(t => t.status === 'Pending').length;
    document.getElementById('opAlerts').textContent = orders.filter(o => o.priority === 'Critical').length;

    // Hub load bars
    const hubs = ['Hub Central', 'Hub North', 'Hub South', 'Hub East', 'Hub West'];
    const hubLoadContainer = document.getElementById('hubLoadBars');
    hubLoadContainer.innerHTML = '';

    hubs.forEach(hub => {
        const hubOrders = orders.filter(o => o.pickupHub === hub).length;
        const pct = totalOrders > 0 ? Math.round((hubOrders / totalOrders) * 100) : 0;
        const colorClass = pct >= 70 ? 'red' : pct >= 40 ? 'orange' : 'green';
        const item = document.createElement('div');
        item.className = 'hub-load-item';
        item.innerHTML = `
            <span class="hub-name">${hub.replace('Hub ', '')}</span>
            <div class="load-bar"><div class="load-fill progress-fill ${colorClass}" style="width:${pct}%"></div></div>
            <span class="load-percent">${pct}%</span>
        `;
        hubLoadContainer.appendChild(item);
    });

    // Top performing agents
    const topAgentsBody = document.getElementById('topAgentsBody');
    topAgentsBody.innerHTML = '';

    const sorted = [...reports].sort((a, b) => b.deliveriesCompleted - a.deliveriesCompleted).slice(0, 5);
    sorted.forEach((r, i) => {
        const trendIcon = r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '→';
        const trendClass = r.trend === 'up' ? 'color:var(--clr-green-500)' : r.trend === 'down' ? 'color:var(--clr-red-500)' : 'color:var(--text-subtitle)';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600;">#${i + 1}</td>
            <td style="font-weight:600;color:var(--text-title)">${r.agentName}</td>
            <td>${r.deliveriesCompleted}</td>
            <td>${r.avgDeliveryTime}</td>
            <td>⭐ ${r.rating}</td>
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div class="progress-bar" style="width:80px;"><div class="progress-fill ${r.onTimeRate >= 90 ? 'green' : r.onTimeRate >= 80 ? 'orange' : 'red'}" style="width:${r.onTimeRate}%"></div></div>
                    <span style="font-size:0.8rem;font-weight:600;">${r.onTimeRate}%</span>
                </div>
            </td>
            <td><span style="${trendClass};font-weight:700;">${trendIcon}</span></td>
        `;
        topAgentsBody.appendChild(tr);
    });

    // Operational alerts
    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = '';

    const alerts = [
        { type: 'critical', title: orders.filter(o => o.priority === 'Critical' && o.status === 'Pending').length + ' Critical orders unassigned', time: 'Just now' },
        { type: 'warning', title: agents.filter(a => a.fuelPercent < 30).length + ' agents with low fuel/battery', time: '5 min ago' },
        { type: 'info', title: transfers.filter(t => t.status === 'Pending').length + ' pending hub transfers', time: '12 min ago' },
        { type: 'warning', title: 'Hub North approaching capacity', time: '25 min ago' },
        { type: 'info', title: 'Peak delivery hours starting soon', time: '30 min ago' }
    ];

    alerts.forEach(a => {
        const item = document.createElement('div');
        item.className = 'alert-item';
        item.innerHTML = `
            <span class="alert-dot ${a.type}"></span>
            <div class="alert-content">
                <div class="alert-title">${a.title}</div>
                <div class="alert-time">${a.time}</div>
            </div>
        `;
        alertsList.appendChild(item);
    });
}
