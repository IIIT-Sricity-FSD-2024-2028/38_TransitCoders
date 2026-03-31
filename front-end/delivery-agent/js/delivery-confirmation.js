/**
 * Delivery Confirmation Page — Show summary, return to dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    initCommon();
    loadConfirmation();
    bindReturn();
});

function loadConfirmation() {
    const orderId = getUrlParam('id');
    if (!orderId) {
        window.location.href = 'worklist.html';
        return;
    }

    const order = DeliveryData.getOrderById(orderId);
    if (!order) {
        showToast('Order not found', 'error');
        setTimeout(() => window.location.href = 'worklist.html', 1500);
        return;
    }

    // Ensure it's marked delivered
    if (order.status !== 'delivered') {
        DeliveryData.updateOrderStatus(orderId, 'delivered');
    }

    document.getElementById('conf-recipient').textContent = order.customer;
    document.getElementById('conf-address').textContent = order.destination;
    document.getElementById('conf-order-id').textContent = order.id;
    document.getElementById('conf-package-id').textContent = order.packageId;
    document.getElementById('conf-payment').textContent = order.paymentMode;
    document.getElementById('conf-amount').textContent = '₹' + order.amount.toFixed(2);
    document.getElementById('conf-weight').textContent = order.weight;
    document.getElementById('conf-volume').textContent = order.volume;
}

function bindReturn() {
    document.getElementById('return-btn').addEventListener('click', () => {
        showToast('Returning to dashboard...', 'success');
        setTimeout(() => {
            window.location.href = 'worklist.html';
        }, 800);
    });
}


// React to centralized state changes
window.addEventListener('appStateChanged', initConfirmation);