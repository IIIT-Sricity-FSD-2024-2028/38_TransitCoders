/**
 * Roles & Permissions Logic — Super Admin
 * Permission matrix with save to centralized state.
 */

document.addEventListener("DOMContentLoaded", function () {
    var matrixBody = document.getElementById("matrixBody");
    var saveBtn = document.getElementById("savePermissionsBtn");
    
    var rolesData = [];

    function renderMatrix() {
        rolesData = JSON.parse(JSON.stringify(StorageAPI.getRoles())); // deep clone
        
        var permissionKeys = ['manageUsers', 'manageComplaints', 'viewReports', 'configureSystem', 'manageDatabase'];
        
        matrixBody.innerHTML = rolesData.map(function(role, rIndex) {
            var isSuperUser = role.name === "Super User";
            
            return '<tr>' +
                '<td class="role-col">' + role.name + '</td>' +
                permissionKeys.map(function(key) {
                    return '<td>' +
                        '<label class="switch">' +
                            '<input type="checkbox" ' +
                                'data-role-idx="' + rIndex + '" ' +
                                'data-perm-key="' + key + '" ' +
                                (role.permissions[key] ? 'checked' : '') + ' ' +
                                (isSuperUser ? 'disabled' : '') + '>' +
                            '<span class="slider"></span>' +
                        '</label>' +
                    '</td>';
                }).join("") +
            '</tr>';
        }).join("");

        // Attach listeners
        document.querySelectorAll('.matrix-table input[type="checkbox"]').forEach(function(checkbox) {
            checkbox.addEventListener('change', function(e) {
                saveBtn.disabled = false;
                saveBtn.innerText = "Save Changes";
                
                var idx = parseInt(e.target.getAttribute('data-role-idx'));
                var key = e.target.getAttribute('data-perm-key');
                rolesData[idx].permissions[key] = e.target.checked;
            });
        });
    }

    saveBtn.addEventListener('click', function() {
        // Save each role's permissions to storage
        rolesData.forEach(function(role) {
            StorageAPI.updateRolePermissions(role.name, role.permissions);
        });
        
        saveBtn.disabled = true;
        saveBtn.innerText = "Saved Successfully ✓";
        
        if (typeof showToast === 'function') {
            showToast('Permissions saved successfully.', 'success');
        }

        setTimeout(function() {
            saveBtn.innerText = "Save Changes";
        }, 2000);
    });

    // Init
    renderMatrix();

    window.addEventListener('appStateChanged', renderMatrix);
    window.addEventListener('storage', function(e) {
        if (e.key === 'swifttrack_central_state') renderMatrix();
    });
});
