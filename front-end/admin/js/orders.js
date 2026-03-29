/**
 * Admin Orders Queue JS — Full CRUD
 */
let currentEditId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await AdminStorage.init();
    renderOrders();
    bindEvents();
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

function getStatusClass(s) {
    return { 'Pending':'warning','In Transit':'blue','Out for Delivery':'blue','Delivered':'success','Cancelled':'error' }[s] || 'blue';
}

function renderOrders() {
    let orders = AdminStorage.getOrders();
    const search = document.getElementById('orderSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const priorityFilter = document.getElementById('priorityFilter')?.value || '';
    const sort = document.getElementById('sortSelect')?.value || '';

    if (search) orders = orders.filter(o => 
        o.id.toLowerCase().includes(search) || o.customerName.toLowerCase().includes(search) || o.deliveryLocation.toLowerCase().includes(search)
    );
    if (statusFilter) orders = orders.filter(o => o.status === statusFilter);
    if (priorityFilter) orders = orders.filter(o => o.priority === priorityFilter);

    if (sort === 'date-desc') orders.sort((a, b) => b.date.localeCompare(a.date));
    else if (sort === 'date-asc') orders.sort((a, b) => a.date.localeCompare(b.date));
    else if (sort === 'priority') {
        const p = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        orders.sort((a, b) => (p[a.priority] || 4) - (p[b.priority] || 4));
    }

    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><p>No orders found</p></td></tr>';
        document.getElementById('ordersCount').textContent = '0 orders';
        return;
    }

    orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600;color:var(--text-title)">${order.id}</td>
            <td>${order.customerName}</td>
            <td>${order.assignedAgent}</td>
            <td>${order.pickupHub}</td>
            <td>${order.deliveryLocation}</td>
            <td><span class="status-badge ${getStatusClass(order.status)}">${order.status}</span></td>
            <td><span class="priority-badge ${order.priority.toLowerCase()}">${order.priority}</span></td>
            <td>
                <div class="table-actions">
                    <button class="action-btn" title="Assign Agent" onclick="openAssignModal('${order.id}')">
                        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </button>
                    <button class="action-btn" title="Transfer Hub" onclick="openTransferModal('${order.id}')">
                        <svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    </button>
                    <button class="action-btn" title="View Details" onclick="viewOrder('${order.id}')">
                        <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="action-btn" title="Edit" onclick="editOrder('${order.id}')">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn danger" title="Delete" onclick="deleteOrder('${order.id}')">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('ordersCount').textContent = orders.length + ' order' + (orders.length !== 1 ? 's' : '');
}

function bindEvents() {
    document.getElementById('orderSearch')?.addEventListener('input', renderOrders);
    document.getElementById('statusFilter')?.addEventListener('change', renderOrders);
    document.getElementById('priorityFilter')?.addEventListener('change', renderOrders);
    document.getElementById('sortSelect')?.addEventListener('change', renderOrders);
}

function openAddOrderModal() {
    currentEditId = null;
    document.getElementById('orderModalTitle').textContent = 'Add New Order';
    const form = document.getElementById('orderForm');
    form.reset();
    Validator.clearErrors(form);
    document.getElementById('orderIdField').disabled = false;
    document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
    currentEditId = null;
}

function editOrder(id) {
    const order = AdminStorage.getOrders().find(o => o.id === id);
    if (!order) return;
    currentEditId = id;
    document.getElementById('orderModalTitle').textContent = 'Edit Order';
    document.getElementById('orderIdField').value = order.id;
    document.getElementById('orderIdField').disabled = true;
    document.getElementById('customerNameField').value = order.customerName;
    document.getElementById('agentField').value = order.assignedAgent;
    document.getElementById('pickupHubField').value = order.pickupHub;
    document.getElementById('deliveryField').value = order.deliveryLocation;
    document.getElementById('statusField').value = order.status;
    document.getElementById('priorityField').value = order.priority;
    Validator.clearErrors(document.getElementById('orderForm'));
    document.getElementById('orderModal').classList.add('active');
}

function saveOrder() {
    const form = document.getElementById('orderForm');
    const id = document.getElementById('orderIdField').value.trim();
    const data = {
        id: id,
        customerName: document.getElementById('customerNameField').value.trim(),
        assignedAgent: document.getElementById('agentField').value.trim() || 'Unassigned',
        pickupHub: document.getElementById('pickupHubField').value,
        deliveryLocation: document.getElementById('deliveryField').value.trim(),
        status: document.getElementById('statusField').value,
        priority: document.getElementById('priorityField').value,
        date: MockData.todayDate(),
        weight: '1.0 kg',
        estimatedTime: '30 min'
    };

    const existingIds = AdminStorage.getOrders().map(o => o.id);
    const rules = [
        { field: 'Order ID', value: data.id, rules: [Validator.required, ...(currentEditId ? [] : [(v, f) => Validator.duplicateId(v, existingIds, f)])] },
        { field: 'Customer Name', value: data.customerName, rules: [Validator.required] },
        { field: 'Delivery Location', value: data.deliveryLocation, rules: [Validator.required] }
    ];

    const result = Validator.validateForm(rules);
    if (!result.valid) {
        Validator.showErrors(form, result.errors);
        return;
    }

    if (currentEditId) {
        AdminStorage.updateOrder(currentEditId, data);
        showToast('Order updated successfully', 'success');
    } else {
        AdminStorage.addOrder(data);
        showToast('Order added successfully', 'success');
    }

    closeOrderModal();
    renderOrders();
}

function deleteOrder(id) {
    if (!confirm('Delete order ' + id + '?')) return;
    AdminStorage.deleteOrder(id);
    showToast('Order deleted', 'error');
    renderOrders();
}

function viewOrder(id) {
    const order = AdminStorage.getOrders().find(o => o.id === id);
    if (!order) return;
    const body = document.getElementById('viewOrderBody');
    body.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Order ID</div><div style="font-weight:600;">${order.id}</div></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Customer</div><div style="font-weight:600;">${order.customerName}</div></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Agent</div><div>${order.assignedAgent}</div></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Pickup Hub</div><div>${order.pickupHub}</div></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Delivery</div><div>${order.deliveryLocation}</div></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Status</div><span class="status-badge ${getStatusClass(order.status)}">${order.status}</span></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Priority</div><span class="priority-badge ${order.priority.toLowerCase()}">${order.priority}</span></div>
            <div><div style="font-size:0.75rem;color:var(--text-subtitle);text-transform:uppercase;margin-bottom:4px;">Date</div><div>${order.date}</div></div>
        </div>
    `;
    document.getElementById('viewOrderModal').classList.add('active');
}

function closeViewOrderModal() {
    document.getElementById('viewOrderModal').classList.remove('active');
}

function openAssignModal(id) {
    const agents = AdminStorage.getAgents().filter(a => a.status === 'Available');
    const sel = document.getElementById('assignAgentSelect');
    sel.innerHTML = '<option value="">Select Agent</option>';
    agents.forEach(a => {
        sel.innerHTML += '<option value="' + a.name + '">' + a.name + ' (' + a.distanceAway + ')</option>';
    });
    document.getElementById('assignOrderId').value = id;
    document.getElementById('assignModal').classList.add('active');
}

function closeAssignModal() { document.getElementById('assignModal').classList.remove('active'); }

function confirmAssign() {
    const id = document.getElementById('assignOrderId').value;
    const agent = document.getElementById('assignAgentSelect').value;
    if (!agent) { showToast('Please select an agent', 'warning'); return; }
    AdminStorage.updateOrder(id, { assignedAgent: agent, status: 'In Transit' });
    closeAssignModal();
    showToast('Agent assigned', 'success');
    renderOrders();
}

function openTransferModal(id) {
    document.getElementById('transferOrderId').value = id;
    document.getElementById('transferHubSelect').value = '';
    document.getElementById('transferModal').classList.add('active');
}

function closeTransferModal() { document.getElementById('transferModal').classList.remove('active'); }

function confirmTransferHub() {
    const id = document.getElementById('transferOrderId').value;
    const hub = document.getElementById('transferHubSelect').value;
    if (!hub) { showToast('Please select a hub', 'warning'); return; }
    AdminStorage.updateOrder(id, { pickupHub: hub });
    closeTransferModal();
    showToast('Hub transferred', 'success');
    renderOrders();
}
