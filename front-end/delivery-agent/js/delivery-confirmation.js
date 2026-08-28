/**
 * Delivery Confirmation Page — Show summary, return to dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    initCommon();
    loadConfirmation();
    bindUpload();
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
window.addEventListener('appStateChanged', () => {
    // Only reload if we're actually on the page to prevent errors
    if(document.getElementById('conf-recipient')) {
        loadConfirmation();
    }
});

function bindUpload() {
    const btn = document.getElementById('upload-pod-btn');
    const input = document.getElementById('pod-upload');
    
    if(!btn || !input) return;

    btn.addEventListener('click', async () => {
        if (!input.files || input.files.length === 0) {
            showToast('Please select a photo first', 'error');
            return;
        }

        const file = input.files[0];
        
        // Agent ID could be retrieved from current user state, assuming a mock ID if missing
        const user = window.Auth ? window.Auth.getUser() : JSON.parse(localStorage.getItem('user') || '{}');
        const agentId = user.id || 'AG1001'; // Fallback for demo
        
        try {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            btn.disabled = true;
            
            // Call the real backend API
            if (window.API && window.API.agents) {
                const response = await window.API.agents.uploadPhoto(agentId, file);
                showToast(response.message || 'Photo uploaded successfully', 'success');
                btn.innerHTML = '<i class="fas fa-check"></i> Uploaded';
                btn.style.borderColor = 'var(--success)';
                btn.style.color = 'var(--success)';
            } else {
                throw new Error('API not initialized');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast(error.message || 'Upload failed', 'error');
            btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Try Again';
            btn.disabled = false;
        }
    });
}