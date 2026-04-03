/**
 * User Management Script
 * Handles CRUD, Zone field for Delivery Agents, and proper credential storage
 */

document.addEventListener("DOMContentLoaded", () => {
    // UI Elements
    const userTableBody    = document.getElementById("userTableBody");
    const searchInput      = document.getElementById("searchInput");
    const roleFilter       = document.getElementById("roleFilter");
    const statusFilter     = document.getElementById("statusFilter");

    const userModal        = document.getElementById("userModal");
    const openAddUserModalBtn = document.getElementById("openAddUserModalBtn");
    const closeModalBtn    = document.getElementById("closeModalBtn");
    const cancelBtn        = document.getElementById("cancelBtn");
    const saveBtn          = document.getElementById("saveBtn");
    const modalTitle       = document.getElementById("modalTitle");
    const userForm         = document.getElementById("userForm");

    const idInput          = document.getElementById("userId");
    const nameInput        = document.getElementById("userName");
    const emailInput       = document.getElementById("userEmail");
    const passwordInput    = document.getElementById("userPassword");
    const roleInput        = document.getElementById("userRole");
    const statusInput      = document.getElementById("userStatus");
    const zoneFieldGroup   = document.getElementById("zoneFieldGroup");
    const zoneInput        = document.getElementById("userZone");

    // Role display name map (internal -> display)
    const ROLE_LABELS = {
        hub_manager:    'Hub Manager',
        merchant:       'Merchant',
        delivery_agent: 'Delivery Agent',
        customer:       'Customer'
    };

    // RBAC guard
    if (window.Auth && !window.Auth.hasPermission('create_users')) {
        if (openAddUserModalBtn) {
            openAddUserModalBtn.disabled = true;
            openAddUserModalBtn.title = "You do not have permission to create users";
            openAddUserModalBtn.style.opacity = '0.5';
            openAddUserModalBtn.style.cursor = 'not-allowed';
        }
    }

    let isEditing = false;

    // ── Populate zones dropdown from state ─────────────────────────────
    function populateZones() {
        const zones = StorageAPI.getZones();
        zoneInput.innerHTML = '<option value="">Select a zone...</option>';
        zones.forEach(z => {
            const opt = document.createElement('option');
            opt.value = z.id;
            opt.textContent = `${z.name} (${z.region})`;
            zoneInput.appendChild(opt);
        });
    }

    // ── Toggle zone field based on role ────────────────────────────────
    roleInput.addEventListener('change', () => {
        if (roleInput.value === 'delivery_agent') {
            zoneFieldGroup.style.display = '';
            populateZones();
        } else {
            zoneFieldGroup.style.display = 'none';
            zoneInput.value = '';
        }
    });

    // ── Load & Render Users ────────────────────────────────────────────
    function renderTable() {
        const users   = StorageAPI.getUsers();
        const search  = searchInput.value.toLowerCase();
        const fRole   = roleFilter.value;
        const fStatus = statusFilter.value;

        // Normalise role for filter comparison
        const normaliseRole = (r) => {
            r = (r || '').toLowerCase();
            if (r === 'hub_manager' || r === 'hub manager') return 'hub manager';
            if (r === 'delivery_agent' || r === 'delivery agent') return 'delivery agent';
            return r;
        };

        let filtered = users.filter(u => {
            const matchesSearch  = u.name.toLowerCase().includes(search) ||
                                   u.email.toLowerCase().includes(search) ||
                                   (u.id || '').toLowerCase().includes(search);
            const matchesRole    = fRole === "All" ||
                                   normaliseRole(u.role) === fRole.toLowerCase();
            const matchesStatus  = fStatus === "All" || u.status === fStatus;
            return matchesSearch && matchesRole && matchesStatus;
        });

        const roleLabel = (r) => ROLE_LABELS[r] || r;

        userTableBody.innerHTML = filtered.length > 0
            ? filtered.map(u => `
            <tr${u.status === 'Pending' ? ' style="background: rgba(245,158,11,0.06)"' : ''}>
                <td>
                    <div class="user-name-cell">
                        <div class="user-avatar-sm">${u.name.charAt(0).toUpperCase()}</div>
                        <div>
                            <span class="user-name-text">${u.name}</span>
                            <span class="user-id-text">${u.id}</span>
                        </div>
                    </div>
                </td>
                <td>${u.email}</td>
                <td>${roleLabel(u.role)}</td>
                <td><span class="status-badge badge-${u.status.toLowerCase()}">${u.status}</span></td>
                <td>${u.lastLogin}</td>
                <td class="actions-col">
                    <div class="action-buttons">
                        ${u.status === 'Pending' ? `<button class="action-icon approve-btn" data-id="${u.id}" title="Approve" style="color:#10b981;">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>` : ''}
                        <button class="action-icon edit-btn" data-id="${u.id}" title="Edit">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="action-icon danger delete-btn" data-id="${u.id}" title="Delete">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join("")
        : `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-subtitle)">No users found.</td></tr>`;

        document.querySelectorAll('.approve-btn').forEach(b => b.addEventListener('click', e => approveUser(e.currentTarget.dataset.id)));
        document.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', e => openEditModal(e.currentTarget.dataset.id)));
        document.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', e => deleteUser(e.currentTarget.dataset.id)));
    }

    function approveUser(id) {
        StorageAPI.updateUser(id, { status: 'Active' });
        if (typeof window.showToast === 'function') window.showToast('User approved successfully!', 'success');
        renderTable();
    }

    // ── Modal Helpers ──────────────────────────────────────────────────
    function openModal() {
        userModal.classList.add("active");
        resetValidation();
    }

    function closeModal() {
        userModal.classList.remove("active");
        userForm.reset();
        idInput.value = "";
        zoneFieldGroup.style.display = 'none';
    }

    function openEditModal(id) {
        isEditing = true;
        modalTitle.innerText = "Edit User";
        const user = StorageAPI.getUsers().find(u => u.id === id);
        if (!user) return;

        idInput.value       = user.id;
        nameInput.value     = user.name;
        emailInput.value    = user.email;
        passwordInput.value = user.password || "***";
        roleInput.value     = user.role;
        statusInput.value   = user.status;

        // Handle zone field visibility on edit
        if (user.role === 'delivery_agent') {
            zoneFieldGroup.style.display = '';
            populateZones();
            if (user.zone_id) zoneInput.value = user.zone_id;
        } else {
            zoneFieldGroup.style.display = 'none';
        }

        openModal();
    }

    function deleteUser(id) {
        if (confirm(`Are you sure you want to delete user ${id}?`)) {
            StorageAPI.deleteUser(id);
            renderTable();
        }
    }

    // ── Validation ─────────────────────────────────────────────────────
    function resetValidation() {
        document.querySelectorAll('.has-error').forEach(e => e.classList.remove('has-error'));
        saveBtn.disabled = false;
    }

    function validateForm() {
        resetValidation();
        let valid = true;

        if (!nameInput.value.trim()) {
            nameInput.closest('.form-group').classList.add('has-error');
            valid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value)) {
            emailInput.closest('.form-group').classList.add('has-error');
            valid = false;
        } else {
            const existing = StorageAPI.getUsers().find(u => u.email === emailInput.value && u.id !== idInput.value);
            if (existing) {
                const grp = emailInput.closest('.form-group');
                grp.classList.add('has-error');
                grp.querySelector('.form-error').innerText = "Email already in use.";
                valid = false;
            }
        }

        if (!isEditing && (!passwordInput.value || !passwordInput.value.trim())) {
            passwordInput.closest('.form-group').classList.add('has-error');
            valid = false;
        }

        if (!roleInput.value) {
            roleInput.closest('.form-group').classList.add('has-error');
            valid = false;
        }

        // Zone validation for delivery agents
        if (roleInput.value === 'delivery_agent' && !zoneInput.value) {
            zoneInput.closest('.form-group').classList.add('has-error');
            valid = false;
        }

        saveBtn.disabled = !valid;
        return valid;
    }

    // ── Event Listeners ────────────────────────────────────────────────
    searchInput.addEventListener("input", renderTable);
    roleFilter.addEventListener("change", renderTable);
    statusFilter.addEventListener("change", renderTable);

    openAddUserModalBtn.addEventListener('click', () => {
        isEditing = false;
        modalTitle.innerText = "Add New User";
        userForm.reset();
        idInput.value = "";
        statusInput.value = "Active";
        zoneFieldGroup.style.display = 'none';
        openModal();
    });

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', e => { e.preventDefault(); closeModal(); });

    [nameInput, emailInput, roleInput, passwordInput].forEach(inp => {
        inp.addEventListener('input', () => {
            inp.closest('.form-group').classList.remove('has-error');
            if (saveBtn.disabled && nameInput.value.trim() && roleInput.value && emailInput.value.trim()) {
                saveBtn.disabled = false;
            }
        });
    });

    // ── Save User ───────────────────────────────────────────────────────
    saveBtn.addEventListener('click', e => {
        e.preventDefault();
        if (!validateForm()) return;

        // Build role-aware numeric ID suffix for a new user
        const rolePrefix = {
            hub_manager:    'U_HM_',
            merchant:       'U_MER_',
            delivery_agent: 'U_AGT_',
            customer:       'U_CUS_'
        };

        const data = {
            name:    nameInput.value.trim(),
            email:   emailInput.value.trim(),
            role:    roleInput.value,
            status:  statusInput.value,
            active:  statusInput.value === 'Active'
        };

        if (roleInput.value === 'delivery_agent') {
            data.zone_id = zoneInput.value;
            // Derive hub from zone
            const zones = StorageAPI.getZones();
            const selectedZone = zones.find(z => z.id === zoneInput.value);
            if (selectedZone) data.hub_id = selectedZone.hub_id;
        }

        if (passwordInput.value.trim() !== "******" &&
            passwordInput.value.trim() !== "***" &&
            passwordInput.value.trim() !== "") {
            data.password = passwordInput.value.trim();
        }

        if (isEditing) {
            StorageAPI.updateUser(idInput.value, data);
            if (typeof window.showToast === 'function') window.showToast('User updated successfully!', 'success');
        } else {
            // Generate a stable user_id based on role
            const prefix = rolePrefix[data.role] || 'USR_';
            const s = window.AppState.getState();
            const roleCount = s.users.filter(u => u.role === data.role).length;
            data.user_id = prefix + (roleCount + 200 + Math.floor(Math.random() * 9) + 1);
            s.users.push(data);
            window.AppState.saveState(s);
            if (typeof window.showToast === 'function') {
                window.showToast(`User "${data.name}" created! They can log in with: ${data.email} / ${data.password || '(no password set)'}`, 'success');
            }
        }

        closeModal();
        renderTable();
    });

    // ── Initial Render ─────────────────────────────────────────────────
    renderTable();

    window.addEventListener('appStateChanged', renderTable);
});
