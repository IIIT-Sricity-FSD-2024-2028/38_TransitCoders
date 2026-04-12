/**
 * Verification Page — OTP flow, barcode scan, complete delivery
 */

document.addEventListener('DOMContentLoaded', () => {
    initCommon();
    loadVerificationData();
    initOTPInputs();
    bindVerificationActions();
});

let otpSent = false;
let otpVerified = false;

function loadVerificationData() {
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

    document.getElementById('verify-order-ref').textContent = '#ST-' + order.id;
    document.getElementById('verify-recipient').textContent = order.customer;
    document.getElementById('verify-address').textContent = order.destination;
}

function initOTPInputs() {
    const inputs = document.querySelectorAll('.otp-input');

    inputs.forEach((input, index) => {
        // Auto-focus to next input
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            // Check if all filled
            checkOTPComplete();
        });

        // Handle backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });

        // Allow only numbers
        input.addEventListener('keypress', (e) => {
            if (!/\d/.test(e.key)) {
                e.preventDefault();
            }
        });
    });
}

function checkOTPComplete() {
    const inputs = document.querySelectorAll('.otp-input');
    const allFilled = Array.from(inputs).every(i => i.value.length === 1);
    const authBtn = document.getElementById('auth-btn');

    if (allFilled) {
        authBtn.classList.add('active');
    } else {
        authBtn.classList.remove('active');
    }
}

function bindVerificationActions() {
    const orderId = getUrlParam('id');

    // Send OTP
    document.getElementById('send-otp-btn').addEventListener('click', () => {
        if (otpSent) {
            showToast('OTP resent successfully!', 'success');
        } else {
            otpSent = true;
            showToast('OTP sent to customer!', 'success');
            document.getElementById('send-otp-btn').textContent = 'RESEND OTP';
            document.querySelectorAll('.otp-input')[0].focus();
        }
    });

    // Authenticate
    document.getElementById('auth-btn').addEventListener('click', () => {
        const inputs = document.querySelectorAll('.otp-input');
        const allFilled = Array.from(inputs).every(i => i.value.length === 1);

        if (!otpSent) {
            showToast('Please send OTP first', 'warning');
            return;
        }

        if (!allFilled) {
            showToast('Please enter the complete OTP', 'error');
            return;
        }

        otpVerified = true;
        showModal('otp-success-modal');
    });

    // OTP Success → Proceed
    document.getElementById('otp-proceed-btn').addEventListener('click', () => {
        hideModal('otp-success-modal');
        // Highlight barcode section
        document.getElementById('barcode-btn').style.borderColor = 'var(--clr-orange-500)';
        document.getElementById('barcode-btn').scrollIntoView({ behavior: 'smooth' });
    });

    // Barcode Scan
    document.getElementById('barcode-btn').addEventListener('click', () => {
        if (!otpVerified) {
            showToast('Please verify OTP first', 'warning');
            return;
        }
        // Simulate barcode scan
        showToast('Scanning barcode...', 'info');
        setTimeout(() => {
            showModal('barcode-success-modal');
        }, 1200);
    });

    // Barcode Success → Complete Delivery
    document.getElementById('barcode-proceed-btn').addEventListener('click', () => {
        hideModal('barcode-success-modal');
        DeliveryData.updateOrderStatus(orderId, 'delivered');
        showToast('Delivery completed!', 'success');
        setTimeout(() => {
            window.location.href = `delivery-confirmation.html?id=${orderId}`;
        }, 1000);
    });
}


// React to centralized state changes
window.addEventListener('appStateChanged', initVerification);