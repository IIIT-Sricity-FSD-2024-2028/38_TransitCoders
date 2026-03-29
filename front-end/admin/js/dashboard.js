/**
 * Admin Dashboard JS — Hub Operations Dashboard
 */
document.addEventListener('DOMContentLoaded', async () => {
    await AdminStorage.init();
    renderDashboard();
});

function showToast(message, type) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

function renderDashboard() {
    const orders = AdminStorage.getOrders();
    const agents = AdminStorage.getAgents();
    const complaints = AdminStorage.getComplaints();

    // KPI values
    const activeOrders = orders.filter(o => o.status === 'In Transit' || o.status === 'Out for Delivery').length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const availableAgents = agents.filter(a => a.status === 'Available').length;

    document.getElementById('kpi-active').textContent = activeOrders;
    document.getElementById('kpi-pending').textContent = pendingOrders;
    document.getElementById('kpi-agents').textContent = availableAgents;
    document.getElementById('kpi-delivery-time').textContent = '38 min';

    // Recent orders
    const recentList = document.getElementById('recentOrdersList');
    recentList.innerHTML = '';
    const recent = orders.slice(0, 5);

    if (recent.length === 0) {
        recentList.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-subtitle);">No orders yet</td></tr>';
        return;
    }

    recent.forEach(order => {
        const statusClass = getStatusClass(order.status);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight:600;color:var(--text-title)">${order.id}</td>
            <td>${order.customerName}</td>
            <td>${order.deliveryLocation}</td>
            <td><span class="status-badge ${statusClass}">${order.status}</span></td>
            <td><span class="priority-badge ${order.priority.toLowerCase()}">${order.priority}</span></td>
        `;
        recentList.appendChild(row);
    });

    // Overview stats
    const delivered = orders.filter(o => o.status === 'Delivered').length;
    const cancelled = orders.filter(o => o.status === 'Cancelled').length;
    const openComplaints = complaints.filter(c => c.status === 'Open').length;
    const totalAgents = agents.length;

    document.getElementById('stat-delivered').textContent = delivered;
    document.getElementById('stat-cancelled').textContent = cancelled;
    document.getElementById('stat-complaints').textContent = openComplaints;
    document.getElementById('stat-total-agents').textContent = totalAgents;
}

function getStatusClass(status) {
    const map = {
        'Pending': 'warning',
        'In Transit': 'blue',
        'Out for Delivery': 'blue',
        'Delivered': 'success',
        'Cancelled': 'error'
    };
    return map[status] || 'blue';
}

// Dashboard search
const dashSearch = document.getElementById('dashboardSearch');
if (dashSearch) {
    dashSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#recentOrdersList tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    });
}
