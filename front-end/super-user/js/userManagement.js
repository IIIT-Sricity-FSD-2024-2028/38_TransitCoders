/**
 * User Management Script — Super Admin
 * Full CRUD with validation, toast feedback, and cross-page sync.
 * ABSOLUTELY NO PAGE RELOADS.
 */

document.addEventListener("DOMContentLoaded", function () {
    // UI Elements
    var userTableBody = document.getElementById("userTableBody");
    var searchInput = document.getElementById("searchInput");
    var roleFilter = document.getElementById("roleFilter");
    var statusFilter = document.getElementById("statusFilter");
    
    var userModal = document.getElementById("userModal");
    var openAddUserModalBtn = document.getElementById("openAddUserModalBtn");
    var closeModalBtn = document.getElementById("closeModalBtn");
    var cancelBtn = document.getElementById("cancelBtn");
    var saveBtn = document.getElementById("saveBtn");
    
    var modalTitle = document.getElementById("modalTitle");
    var userForm = document.getElementById("userForm");
    var idInput = document.getElementById("userId");
    var nameInput = document.getElementById("userName");
    var emailInput = document.getElementById("userEmail");
    var roleInput = document.getElementById("userRole");
    var statusInput = document.getElementById("userStatus");

    var isEditing = false;

    // Load & Render Users
    function renderTable() {
        var users = StorageAPI.getUsers();
        var search = searchInput.value.toLowerCase();
        var fRole = roleFilter.value;
        var fStatus = statusFilter.value;

        // Filter Logic
        var filtered = users.filter(function(u) {
            var matchesSearch = u.name.toLowerCase().indexOf(search) !== -1 || 
                               u.email.toLowerCase().indexOf(search) !== -1 || 
                               u.id.toLowerCase().indexOf(search) !== -1;
            var matchesRole = fRole === "All" || u.role === fRole;
            var matchesStatus = fStatus === "All" || u.status === fStatus;
            return matchesSearch && matchesRole && matchesStatus;
        });

        // HTML Gen
        if (filtered.length > 0) {
            userTableBody.innerHTML = filtered.map(function(u) {
                return '<tr>' +
                    '<td>' +
                        '<div class="user-name-cell">' +
                            '<div class="user-avatar-sm">' + u.name.charAt(0).toUpperCase() + '</div>' +
                            '<div>' +
                                '<span class="user-name-text">' + u.name + '</span>' +
                                '<span class="user-id-text">' + u.id + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</td>' +
                    '<td>' + u.email + '</td>' +
                    '<td>' + u.role + '</td>' +
                    '<td><span class="status-badge badge-' + u.status.toLowerCase() + '">' + u.status + '</span></td>' +
                    '<td>' + u.lastLogin + '</td>' +
                    '<td class="actions-col">' +
                        '<div class="action-buttons">' +
                            '<button class="action-icon edit-btn" data-id="' + u.id + '" title="Edit">' +
                                '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
                            '</button>' +
                            '<button class="action-icon danger delete-btn" data-id="' + u.id + '" title="Delete">' +
                                '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>' +
                            '</button>' +
                        '</div>' +
                    '</td>' +
                '</tr>';
            }).join("");
        } else {
            userTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-subtitle)">No users found.</td></tr>';
        }

        // Attach listeners dynamically
        document.querySelectorAll('.edit-btn').forEach(function(b) {
            b.addEventListener('click', function(e) { openEditModal(e.currentTarget.dataset.id); });
        });
        document.querySelectorAll('.delete-btn').forEach(function(b) {
            b.addEventListener('click', function(e) { deleteUser(e.currentTarget.dataset.id); });
        });
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
        isEditing = false;
    }

    function openEditModal(id) {
        isEditing = true;
        modalTitle.innerText = "Edit User";
        var user = StorageAPI.getUsers().find(function(u) { return u.id === id; });
        if (!user) return;
        
        idInput.value = user.id;
        nameInput.value = user.name;
        emailInput.value = user.email;
        roleInput.value = user.role;
        statusInput.value = user.status;
        
        openModal();
    }

    function deleteUser(id) {
        var user = StorageAPI.getUsers().find(function(u) { return u.id === id; });
        var userName = user ? user.name : id;

        // Use a custom confirm dialog-style approach
        if (confirm('Are you sure you want to delete user "' + userName + '"?')) {
            StorageAPI.deleteUser(id);
            renderTable();
            if (typeof showToast === 'function') {
                showToast('User "' + userName + '" deleted successfully.', 'success');
            }
        }
    }

    // Validation
    function resetValidation() {
        document.querySelectorAll('.has-error').forEach(function(e) { e.classList.remove('has-error'); });
        saveBtn.disabled = false;
    }

    function validateForm() {
        resetValidation();
        var valid = true;

        if (!nameInput.value.trim()) {
            nameInput.closest('.form-group').classList.add('has-error');
            valid = false;
        }

        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value)) {
            emailInput.closest('.form-group').classList.add('has-error');
            var errEl = emailInput.closest('.form-group').querySelector('.form-error');
            if (errEl) errEl.innerText = "Valid email is required.";
            valid = false;
        } else {
            // Check duplicate email
            var existing = StorageAPI.getUsers().find(function(u) { return u.email === emailInput.value && u.id !== idInput.value; });
            if (existing) {
                var grp = emailInput.closest('.form-group');
                grp.classList.add('has-error');
                var errEl2 = grp.querySelector('.form-error');
                if (errEl2) errEl2.innerText = "Email already in use.";
                valid = false;
            }
        }

        if (!roleInput.value) {
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

    openAddUserModalBtn.addEventListener('click', function() {
        isEditing = false;
        modalTitle.innerText = "Add New User";
        userForm.reset();
        idInput.value = "";
        statusInput.value = "Active"; // Default
        openModal();
    });

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', function(e) { e.preventDefault(); closeModal(); });

    // Escape key closes modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && userModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Click outside modal closes it
    userModal.addEventListener('click', function(e) {
        if (e.target === userModal) closeModal();
    });

    // Inputs real-time validate to clear errors
    [nameInput, emailInput, roleInput].forEach(function(inp) {
        inp.addEventListener('input', function() {
            if (inp.closest('.has-error')) {
                inp.closest('.form-group').classList.remove('has-error');
            }
            if (saveBtn.disabled) {
                if (nameInput.value.trim() && roleInput.value && emailInput.value.trim()) {
                    saveBtn.disabled = false;
                }
            }
        });
    });

    saveBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (!validateForm()) return;

        var data = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            role: roleInput.value,
            status: statusInput.value
        };

        if (isEditing) {
            StorageAPI.updateUser(idInput.value, data);
            if (typeof showToast === 'function') {
                showToast('User "' + data.name + '" updated successfully.', 'success');
            }
        } else {
            StorageAPI.addUser(data);
            if (typeof showToast === 'function') {
                showToast('User "' + data.name + '" created successfully.', 'success');
            }
        }

        closeModal();
        renderTable();
    });

    // Initial render
    renderTable();

    // Cross-page reactive sync
    window.addEventListener('appStateChanged', renderTable);
    window.addEventListener('storage', function(e) {
        if (e.key === 'swifttrack_central_state') renderTable();
    });
});
