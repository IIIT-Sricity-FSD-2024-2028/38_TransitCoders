/**
 * Profile Page — Load profile data, status toggle, edit profile
 */

document.addEventListener('DOMContentLoaded', () => {
    initCommon();
    loadProfile();
    bindStatusToggle();
    bindEditProfile();
});

function loadProfile() {
    const p = DeliveryData.getProfile();

    // Personal Details
    document.getElementById('profile-name').innerHTML = `${p.name} <span class="active-badge">${p.contractStatus}</span>`;
    document.getElementById('profile-sub-id').textContent = `${p.agentId} · ${p.role}`;
    document.getElementById('pd-name').textContent = p.name;
    document.getElementById('pd-id').textContent = p.agentId;
    document.getElementById('pd-role').textContent = p.role;
    document.getElementById('pd-phone').textContent = p.phone;
    document.getElementById('pd-email').textContent = p.email;
    document.getElementById('pd-license').textContent = p.licenseNo;
    document.getElementById('pd-joined').textContent = p.joinedDate;
    document.getElementById('pd-contract').textContent = p.contractStatus;

    // Performance
    document.getElementById('perf-total').textContent = p.performance.total;
    document.getElementById('perf-completed').textContent = p.performance.completed;
    document.getElementById('perf-failed').textContent = p.performance.failed;
    document.getElementById('perf-rating').innerHTML = `<span class="value">${p.performance.rating}</span><i class="fas fa-star star"></i>`;

    // Vehicle
    document.getElementById('v-number').textContent = p.vehicle.number;
    document.getElementById('v-type').textContent = p.vehicle.type;
    document.getElementById('v-capacity').textContent = p.vehicle.capacity;
    document.getElementById('v-status').textContent = p.vehicle.status;

    // Hub
    document.getElementById('h-name').textContent = p.hub.name;
    document.getElementById('h-code').textContent = p.hub.code;
    document.getElementById('h-contact').textContent = p.hub.contact;

    // Status
    updateStatusUI(p.currentStatus);
}

function bindStatusToggle() {
    document.getElementById('status-options').addEventListener('click', e => {
        const option = e.target.closest('.status-option');
        if (!option) return;

        const status = option.dataset.status;
        DeliveryData.updateProfileStatus(status);
        updateStatusUI(status);
        showToast(`Status updated to ${status.replace('-', ' ')}`, 'success');
    });
}

function updateStatusUI(status) {
    document.querySelectorAll('.status-option').forEach(opt => {
        if (opt.dataset.status === status) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}

function bindEditProfile() {
    const editBtn = document.getElementById('edit-profile-btn');
    const form = document.getElementById('edit-profile-form');

    editBtn.addEventListener('click', () => {
        const p = DeliveryData.getProfile();
        document.getElementById('edit-name').value = p.name;
        document.getElementById('edit-phone').value = p.phone;
        document.getElementById('edit-email').value = p.email;
        showModal('edit-profile-modal');
    });

    form.addEventListener('submit', e => {
        e.preventDefault();

        const name = document.getElementById('edit-name').value.trim();
        const phone = document.getElementById('edit-phone').value.trim();
        const email = document.getElementById('edit-email').value.trim();

        // Validation
        let valid = true;

        if (!name) {
            document.getElementById('edit-name').closest('.form-group').classList.add('error');
            valid = false;
        } else {
            document.getElementById('edit-name').closest('.form-group').classList.remove('error');
        }

        if (!phone) {
            document.getElementById('edit-phone').closest('.form-group').classList.add('error');
            valid = false;
        } else {
            document.getElementById('edit-phone').closest('.form-group').classList.remove('error');
        }

        if (!email || !email.includes('@')) {
            document.getElementById('edit-email').closest('.form-group').classList.add('error');
            valid = false;
        } else {
            document.getElementById('edit-email').closest('.form-group').classList.remove('error');
        }

        if (!valid) {
            showToast('Please fix validation errors', 'error');
            return;
        }

        DeliveryData.updateProfile({ name, phone, email });
        hideModal('edit-profile-modal');
        showToast('Profile updated successfully!', 'success');
        loadProfile(); // Refresh UI
    });
}
