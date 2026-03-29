/**
 * Admin Interhub Transfer JS
 */
let activeTab = 'Pending';

document.addEventListener('DOMContentLoaded', async () => {
    await AdminStorage.init();
    renderTransfers();
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

function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.transfer-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    renderTransfers();
}

function renderTransfers() {
    const all = AdminStorage.getTransfers();
    const filtered = all.filter(t => t.status === activeTab);

    // Update tab counts
    document.getElementById('countPending').textContent = all.filter(t => t.status === 'Pending').length;
    document.getElementById('countApproved').textContent = all.filter(t => t.status === 'Approved').length;
    document.getElementById('countRejected').textContent = all.filter(t => t.status === 'Rejected').length;

    const grid = document.getElementById('transferGrid');
    grid.innerHTML = '';

    if (filtered.length === 0) {
        grid.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text-subtitle);grid-column:1/-1;">No ' + activeTab.toLowerCase() + ' transfers</div>';
        return;
    }

    filtered.forEach(transfer => {
        const card = document.createElement('div');
        card.className = 'transfer-card';
        card.innerHTML = `
            <div class="transfer-card-header">
                <span class="shipment-id">${transfer.shipmentId}</span>
                <span class="priority-badge ${transfer.priority.toLowerCase()}">${transfer.priority}</span>
            </div>
            <div class="transfer-route">
                <span class="hub-name">${transfer.currentHub}</span>
                <span class="route-arrow"><svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
                <span class="hub-name">${transfer.destinationHub}</span>
            </div>
            <div class="transfer-card-body">
                <div class="transfer-field">
                    <span class="field-label">Cargo Type</span>
                    <span class="field-value">${transfer.cargoType}</span>
                </div>
                <div class="transfer-field">
                    <span class="field-label">Weight</span>
                    <span class="field-value">${transfer.weight}</span>
                </div>
                <div class="transfer-field">
                    <span class="field-label">Transit Time</span>
                    <span class="field-value">${transfer.estimatedTransit}</span>
                </div>
                <div class="transfer-field">
                    <span class="field-label">Request Date</span>
                    <span class="field-value">${transfer.requestDate}</span>
                </div>
            </div>
            <div class="transfer-card-actions">
                ${transfer.status === 'Pending' ? `
                    <button class="btn btn-primary" onclick="approveTransfer('${transfer.id}')">Approve</button>
                    <button class="btn btn-danger" onclick="rejectTransfer('${transfer.id}')">Reject</button>
                    <button class="btn btn-secondary" onclick="openChangeDestModal('${transfer.id}')">Change Dest.</button>
                ` : ''}
                <button class="btn btn-secondary" style="color:var(--clr-red-500);" onclick="deleteTransfer('${transfer.id}')">Delete</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function approveTransfer(id) {
    AdminStorage.updateTransfer(id, { status: 'Approved' });
    showToast('Transfer approved', 'success');
    renderTransfers();
}

function rejectTransfer(id) {
    AdminStorage.updateTransfer(id, { status: 'Rejected' });
    showToast('Transfer rejected', 'error');
    renderTransfers();
}

function deleteTransfer(id) {
    if (!confirm('Delete this transfer?')) return;
    AdminStorage.deleteTransfer(id);
    showToast('Transfer deleted', 'error');
    renderTransfers();
}

function openChangeDestModal(id) {
    document.getElementById('changeDestTransferId').value = id;
    const transfer = AdminStorage.getTransfers().find(t => t.id === id);
    document.getElementById('changeDestInfo').textContent = transfer ? transfer.shipmentId : id;
    document.getElementById('newDestSelect').value = '';
    document.getElementById('changeDestModal').classList.add('active');
}

function closeChangeDestModal() {
    document.getElementById('changeDestModal').classList.remove('active');
}

function confirmChangeDest() {
    const id = document.getElementById('changeDestTransferId').value;
    const dest = document.getElementById('newDestSelect').value;
    if (!dest) { showToast('Please select a destination', 'warning'); return; }
    AdminStorage.updateTransfer(id, { destinationHub: dest });
    closeChangeDestModal();
    showToast('Destination changed', 'success');
    renderTransfers();
}

function openConfirmTransferModal() {
    document.getElementById('confirmTransferModal').classList.add('active');
    // Populate form
    document.getElementById('ctShipmentId').value = MockData.generateShipmentId();
    document.getElementById('ctCargoType').value = '';
    document.getElementById('ctCurrentHub').value = '';
    document.getElementById('ctDestHub').value = '';
    document.getElementById('ctPriority').value = 'Medium';
    document.getElementById('ctWeight').value = '';
    document.getElementById('ctTransitTime').value = '';
    Validator.clearErrors(document.getElementById('confirmTransferForm'));
}

function closeConfirmTransferModal() {
    document.getElementById('confirmTransferModal').classList.remove('active');
}

function submitNewTransfer() {
    const form = document.getElementById('confirmTransferForm');
    const data = {
        id: MockData.generateTransferId(),
        shipmentId: document.getElementById('ctShipmentId').value.trim(),
        cargoType: document.getElementById('ctCargoType').value,
        currentHub: document.getElementById('ctCurrentHub').value,
        destinationHub: document.getElementById('ctDestHub').value,
        priority: document.getElementById('ctPriority').value,
        weight: document.getElementById('ctWeight').value.trim() + ' kg',
        estimatedTransit: document.getElementById('ctTransitTime').value.trim() + ' hrs',
        status: 'Pending',
        requestDate: MockData.todayDate()
    };

    const existingShipments = AdminStorage.getTransfers().map(t => t.shipmentId);
    const result = Validator.validateForm([
        { field: 'Shipment ID', value: data.shipmentId, rules: [Validator.required, (v, f) => Validator.duplicateId(v, existingShipments, f)] },
        { field: 'Cargo Type', value: data.cargoType, rules: [Validator.required] },
        { field: 'Current Hub', value: data.currentHub, rules: [Validator.required] },
        { field: 'Destination Hub', value: data.destinationHub, rules: [Validator.required] },
        { field: 'Weight', value: document.getElementById('ctWeight').value, rules: [Validator.required, Validator.numeric] },
        { field: 'Transit Time', value: document.getElementById('ctTransitTime').value, rules: [Validator.required, Validator.numeric] }
    ]);

    if (!result.valid) {
        Validator.showErrors(form, result.errors);
        return;
    }

    AdminStorage.addTransfer(data);
    closeConfirmTransferModal();
    showToast('Transfer request created', 'success');
    renderTransfers();
}
