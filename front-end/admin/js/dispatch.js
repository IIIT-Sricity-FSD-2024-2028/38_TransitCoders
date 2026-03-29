/**
 * Admin Dispatch & Assignment Control JS
 */
document.addEventListener('DOMContentLoaded', async () => {
    await AdminStorage.init();
    renderDispatch();
});

function showToast(msg, type) {
    let c = document.querySelector('.toast-container');
    if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'info');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}

function renderDispatch() {
    const orders = AdminStorage.getOrders();
    const agents = AdminStorage.getAgents();

    const autoAssigned = orders.filter(o => o.assignedAgent !== 'Unassigned' && o.status !== 'Delivered' && o.status !== 'Cancelled');
    const pending = orders.filter(o => o.assignedAgent === 'Unassigned');
    const highPriority = orders.filter(o => (o.priority === 'High' || o.priority === 'Critical') && o.status !== 'Delivered' && o.status !== 'Cancelled');
    const available = agents.filter(a => a.status === 'Available');

    document.getElementById('stat-auto').textContent = autoAssigned.length;
    document.getElementById('stat-pending').textContent = pending.length;
    document.getElementById('stat-high').textContent = highPriority.length;
    document.getElementById('stat-available').textContent = available.length;

    // Render pending orders
    const pendingList = document.getElementById('pendingOrdersList');
    pendingList.innerHTML = '';

    if (pending.length === 0) {
        pendingList.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-subtitle);">No pending assignments</div>';
    } else {
        pending.forEach(order => {
            const card = document.createElement('div');
            card.className = 'pending-order-card';
            card.innerHTML = `
                <div class="pending-order-header">
                    <span class="order-id">${order.id}</span>
                    <span class="priority-badge ${order.priority.toLowerCase()}">${order.priority}</span>
                </div>
                <div class="pending-order-details">
                    <span>Customer: <strong>${order.customerName}</strong></span>
                    <span>Pickup: <strong>${order.pickupHub}</strong></span>
                    <span>Delivery: <strong>${order.deliveryLocation}</strong></span>
                    <span>Weight: <strong>${order.weight || 'N/A'}</strong></span>
                </div>
                <div class="pending-order-actions">
                    <button class="btn btn-primary" style="padding:8px 16px;font-size:0.8rem;" onclick="openOverrideModal('${order.id}')">Assign Agent</button>
                </div>
            `;
            pendingList.appendChild(card);
        });
    }

    // Render available agents
    const agentList = document.getElementById('agentsList');
    agentList.innerHTML = '';

    if (available.length === 0) {
        agentList.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-subtitle);">No agents available</div>';
    } else {
        available.forEach(agent => {
            const fuelClass = agent.fuelPercent >= 60 ? 'high' : agent.fuelPercent >= 30 ? 'medium' : 'low';
            const initials = agent.name.split(' ').map(n => n[0]).join('');
            const card = document.createElement('div');
            card.className = 'agent-card';
            card.innerHTML = `
                <div class="agent-avatar">${initials}</div>
                <div class="agent-info">
                    <div class="agent-name">${agent.name}</div>
                    <div class="agent-meta">
                        <span class="agent-meta-item">
                            <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            ${agent.distanceAway}
                        </span>
                        <span class="agent-meta-item">
                            <svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                            ${agent.vehicleType}
                        </span>
                        <span class="agent-meta-item">
                            ${agent.fuelPercent}%
                            <span class="fuel-bar"><span class="fuel-bar-fill ${fuelClass}" style="width:${agent.fuelPercent}%"></span></span>
                        </span>
                    </div>
                </div>
                <span class="agent-status-dot available"></span>
            `;
            agentList.appendChild(card);
        });
    }
}

function openOverrideModal(orderId) {
    document.getElementById('overrideOrderId').value = orderId;
    const order = AdminStorage.getOrders().find(o => o.id === orderId);
    document.getElementById('overrideOrderInfo').textContent = orderId + ' — ' + (order ? order.customerName : '');

    const agents = AdminStorage.getAgents().filter(a => a.status === 'Available');
    const sel = document.getElementById('overrideAgentSelect');
    sel.innerHTML = '<option value="">Select Agent...</option>';
    agents.forEach(a => {
        sel.innerHTML += `<option value="${a.name}">${a.name} — ${a.vehicleType} — ${a.distanceAway} — ${a.fuelPercent}% fuel</option>`;
    });

    document.getElementById('overrideReasonField').value = '';
    document.getElementById('overrideModal').classList.add('active');
}

function closeOverrideModal() {
    document.getElementById('overrideModal').classList.remove('active');
}

function confirmOverride() {
    const orderId = document.getElementById('overrideOrderId').value;
    const agent = document.getElementById('overrideAgentSelect').value;
    const reason = document.getElementById('overrideReasonField').value.trim();

    if (!agent) { showToast('Please select an agent', 'warning'); return; }

    AdminStorage.updateOrder(orderId, { assignedAgent: agent, status: 'In Transit' });
    closeOverrideModal();
    showToast('Assignment overridden — ' + agent + ' assigned to ' + orderId, 'success');
    renderDispatch();
}
