/**
 * User Management Script
 * Handles CRUD and Table rendering
 */

document.addEventListener("DOMContentLoaded", async () => {
    // StorageAPI.init() no longer needed; state managed centrally
    
    // UI Elements
    const userTableBody = document.getElementById("userTableBody");
    const searchInput = document.getElementById("searchInput");
    const roleFilter = document.getElementById("roleFilter");
    const statusFilter = document.getElementById("statusFilter");
    
    const userModal = document.getElementById("userModal");
    const openAddUserModalBtn = document.getElementById("openAddUserModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const saveBtn = document.getElementById("saveBtn");
    
    const modalTitle = document.getElementById("modalTitle");
    const userForm = document.getElementById("userForm");
    const idInput = document.getElementById("userId");
    const nameInput = document.getElementById("userName");
    const emailInput = document.getElementById("userEmail");
    const roleInput = document.getElementById("userRole");
    const statusInput = document.getElementById("userStatus");

    // RBAC: Disable Add User if lacking permission
    if (window.Auth && !window.Auth.hasPermission('create_users')) {
        if (openAddUserModalBtn) {
            openAddUserModalBtn.disabled = true;
            openAddUserModalBtn.title = "You do not have permission to create users";
            openAddUserModalBtn.style.opacity = '0.5';
            openAddUserModalBtn.style.cursor = 'not-allowed';
        }
    }

    let isEditing = false;

    // Load & Render Users
    function renderTable() {
        const users = StorageAPI.getUsers();
        const search = searchInput.value.toLowerCase();
        const fRole = roleFilter.value;
        const fStatus = statusFilter.value;

        // Filter Logic
        let filtered = users.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search) || u.id.toLowerCase().includes(search);
            const matchesRole = fRole === "All" || u.role === fRole;
            const matchesStatus = fStatus === "All" || u.status === fStatus;
            return matchesSearch && matchesRole && matchesStatus;
        });

        // HTML Gen
        userTableBody.innerHTML = filtered.length > 0 ? filtered.map(u => `
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
                <td>${u.role}</td>
                <td><span class="status-badge badge-${u.status.toLowerCase()}">${u.status}</span></td>
                <td>${u.lastLogin}</td>
                <td class="actions-col">
                    <div class="action-buttons">
                        ${u.status === 'Pending' ? `<button class="action-icon approve-btn" data-id="${u.id}" title="Approve" style="color:#10b981;" ${window.Auth && !window.Auth.hasPermission('edit_users') ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>` : ''}
                        <button class="action-icon edit-btn" data-id="${u.id}" title="Edit" ${window.Auth && !window.Auth.hasPermission('edit_users') ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="action-icon danger delete-btn" data-id="${u.id}" title="Delete" ${window.Auth && !window.Auth.hasPermission('delete_users') ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join("") : `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-subtitle)">No users found.</td></tr>`;

        // Attach listeners dynamically
        document.querySelectorAll('.approve-btn').forEach(b => b.addEventListener('click', (e) => approveUser(e.currentTarget.dataset.id)));
        document.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', (e) => openEditModal(e.currentTarget.dataset.id)));
        document.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', (e) => deleteUser(e.currentTarget.dataset.id)));
    }

    function approveUser(id) {
        StorageAPI.updateUser(id, { status: 'Active' });
        if (typeof window.showToast === 'function') {
            window.showToast('User approved successfully!', 'success');
        }
        renderTable();
    }

    // Modal Helpers
    function openModal() {
        userModal.classList.add("active");
        resetValidation();
    }
    
    function closeModal() {
        userModal.classList.remove("active");
        userForm.reset();
        idInput.value = "";
    }

    function openEditModal(id) {
        isEditing = true;
        modalTitle.innerText = "Edit User";
        const user = StorageAPI.getUsers().find(u => u.id === id);
        if(!user) return;
        
        idInput.value = user.id;
        nameInput.value = user.name;
        emailInput.value = user.email;
        roleInput.value = user.role;
        statusInput.value = user.status;
        
        openModal();
    }

    function deleteUser(id) {
        if(confirm(`Are you sure you want to delete user ${id}?`)) {
            StorageAPI.deleteUser(id);
            renderTable();
        }
    }

    // Validation
    function resetValidation() {
        document.querySelectorAll('.has-error').forEach(e => e.classList.remove('has-error'));
        saveBtn.disabled = false;
    }

    function validateForm() {
        resetValidation();
        let valid = true;

        if(!nameInput.value.trim()) {
            nameInput.closest('.form-group').classList.add('has-error');
            valid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailInput.value.trim() || !emailRegex.test(emailInput.value)) {
            emailInput.closest('.form-group').classList.add('has-error');
            valid = false;
        } else {
            // Check duplicate email
            const existing = StorageAPI.getUsers().find(u => u.email === emailInput.value && u.id !== idInput.value);
            if(existing) {
                const grp = emailInput.closest('.form-group');
                grp.classList.add('has-error');
                grp.querySelector('.form-error').innerText = "Email already in use.";
                valid = false;
            }
        }

        if(!roleInput.value) {
            roleInput.closest('.form-group').classList.add('has-error');
            valid = false;
        }

        saveBtn.disabled = !valid;
        return valid;
    }

    // Event Listeners
    searchInput.addEventListener("input", renderTable);
    roleFilter.addEventListener("change", renderTable);
    statusFilter.addEventListener("change", renderTable);

    openAddUserModalBtn.addEventListener('click', () => {
        isEditing = false;
        modalTitle.innerText = "Add New User";
        userForm.reset();
        idInput.value = "";
        statusInput.value = "Active"; // Default
        openModal();
    });

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

    // Inputs real-time validate to clear errors
    [nameInput, emailInput, roleInput].forEach(inp => {
        inp.addEventListener('input', () => {
            if(inp.closest('.has-error')) {
                inp.closest('.form-group').classList.remove('has-error');
            }
            // Re-check overall valid state if button was disabled
            if(saveBtn.disabled) {
                if(nameInput.value.trim() && roleInput.value && emailInput.value.trim()) {
                    saveBtn.disabled = false;
                }
            }
        });
    });

    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if(!validateForm()) return;

        const data = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            role: roleInput.value,
            status: statusInput.value
        };

        if(isEditing) {
            StorageAPI.updateUser(idInput.value, data);
        } else {
            StorageAPI.addUser(data);
        }

        closeModal();
        renderTable();
    });

    // Initial render
    renderTable();

    window.addEventListener('appStateChanged', () => {
        renderTable();
    });
});
