/**
 * Delivery Acceptance Page — Load order, start delivery
 */

document.addEventListener('DOMContentLoaded', () => {
    initCommon();
    loadOrderDetails();
    bindActions();
});

function loadOrderDetails() {
    const orderId = getUrlParam('id');
    if (!orderId) {
        showToast('No order specified', 'error');
        setTimeout(() => window.location.href = 'worklist.html', 1500);
        return;
    }

    const order = DeliveryData.getOrderById(orderId);
    if (!order) {
        showToast('Order not found', 'error');
        setTimeout(() => window.location.href = 'worklist.html', 1500);
        return;
    }

    // Populate details
    document.getElementById('detail-eta').textContent = order.etaMinutes + ' mins';
    document.getElementById('detail-distance').textContent = order.distanceKm + ' km';
    document.getElementById('detail-fragile').textContent = order.fragile ? 'Yes' : 'No';
    document.getElementById('detail-fragile').className = 'value' + (order.fragile ? ' yes' : '');
    document.getElementById('detail-order-id').textContent = order.id;
    document.getElementById('detail-package-id').textContent = order.packageId;
    document.getElementById('detail-payment').textContent = order.paymentMode;
    document.getElementById('detail-payment').className = 'value' + (order.paymentMode === 'Prepaid' ? ' prepaid' : '');
    document.getElementById('detail-amount').textContent = order.amount.toFixed(2);
    document.getElementById('detail-recipient').textContent = order.destinationFull;
    document.getElementById('detail-weight').textContent = order.weight;
    document.getElementById('detail-volume').textContent = order.volume;

    // If already in-transit, change button
    if (order.status === 'in-transit') {
        const btn = document.getElementById('start-delivery-btn');
        btn.textContent = 'Continue to Verification ';
        const icon = document.createElement('i');
        icon.className = 'fas fa-arrow-right';
        btn.appendChild(icon);
    }
}

function bindActions() {
    const orderId = getUrlParam('id');

    // Start Delivery
    document.getElementById('start-delivery-btn').addEventListener('click', async () => {
        const order = DeliveryData.getOrderById(orderId);
        if (!order) return;

        if (order.status === 'pending') {
            try {
                // order._ref is the real backend UUID (mapped in state-compat.js toAgentOrder)
                if (window.API && window.API.orders && order._ref) {
                    await window.API.orders.updateStatus(order._ref, 'InTransit');
                    if (window.AppState) window.AppState.refresh();
                }
                showToast('Delivery started!', 'success');
            } catch (err) {
                console.error('[Delivery] status update failed:', err?.message || err);
                showToast('Could not update status — ' + (err?.message || 'server error'), 'error');
                return; // Don't navigate if the backend rejected it
            }
        }

        setTimeout(() => {
            window.location.href = `verification.html?id=${orderId}`;
        }, 600);
    });

    // Open Maps (mock)
    document.getElementById('open-maps-btn').addEventListener('click', () => {
        showToast('Opening Google Maps...', 'info');
    });

    // Call Customer
    document.getElementById('call-customer-btn').addEventListener('click', () => {
        const order = DeliveryData.getOrderById(orderId);
        if (order) {
            showToast(`Calling ${order.phone}...`, 'info');
        }
    });
}
