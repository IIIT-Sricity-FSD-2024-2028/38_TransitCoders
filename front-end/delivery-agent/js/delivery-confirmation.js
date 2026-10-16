/**
 * Delivery Confirmation Page — Show summary, return to dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    initCommon();
    loadConfirmation();
    bindUpload();
    bindReturn();
});

async function loadConfirmation() {
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

    // Mark delivered via real backend API if not already delivered
    if (order.status !== 'delivered' && order._ref) {
        try {
            if (window.API && window.API.orders) {
                await window.API.orders.confirmDelivery(order._ref);
                if (window.AppState) window.AppState.refresh();
            }
        } catch (err) {
            console.error('[Delivery] confirmDelivery failed:', err?.message || err);
            showToast('Warning: could not confirm delivery on server', 'error');
        }
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
        
        // Agent ID from real session — no hardcoded fallback
        const user = window.Auth ? window.Auth.getUser()
            : JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
        const agentId = user.id || user.user_id || '';

        if (!agentId) {
            showToast('Session error — cannot identify agent', 'error');
            return;
        }
        
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