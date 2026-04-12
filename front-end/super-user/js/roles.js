/**
 * Roles & Permissions Logic
 */

document.addEventListener("DOMContentLoaded", async () => {
    await StorageAPI.init();
    const matrixBody = document.getElementById("matrixBody");
    const saveBtn = document.getElementById("savePermissionsBtn");
    
    let rolesData = [];

    function renderMatrix() {
        rolesData = StorageAPI.getRoles();
        
        const permissionKeys = ['manageUsers', 'manageComplaints', 'viewReports', 'configureSystem', 'manageDatabase'];
        
        matrixBody.innerHTML = rolesData.map((role, rIndex) => {
            // Super User cannot be disabled
            const isSuperUser = role.name === "Super User";
            
            return `
                <tr>
                    <td class="role-col">${role.name}</td>
                    ${permissionKeys.map(key => `
                        <td>
                            <label class="switch">
                                <input type="checkbox" 
                                    data-role-idx="${rIndex}" 
                                    data-perm-key="${key}"
                                    ${role.permissions[key] ? 'checked' : ''}
                                    ${isSuperUser ? 'disabled' : ''}>
                                <span class="slider"></span>
                            </label>
                        </td>
                    `).join("")}
                </tr>
            `;
        }).join("");

        // Attach listeners
        document.querySelectorAll('.matrix-table input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                saveBtn.disabled = false;
                saveBtn.innerText = "Save Changes";
                
                const idx = e.target.getAttribute('data-role-idx');
                const key = e.target.getAttribute('data-perm-key');
                rolesData[idx].permissions[key] = e.target.checked;
            });
        });
    }

    saveBtn.addEventListener('click', () => {
        // Save to storage
        rolesData.forEach(role => {
            StorageAPI.updateRolePermissions(role.name, role.permissions);
        });
        
        saveBtn.disabled = true;
        saveBtn.innerText = "Saved Successfully ✓";
        
        // Notify user quickly
        setTimeout(() => {
            saveBtn.innerText = "Save Changes";
        }, 2000);
    });

    // Init
    renderMatrix();

    window.addEventListener('appStateChanged', () => {
        renderMatrix();
    });
});
