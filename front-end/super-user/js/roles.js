/**
 * Roles & Permissions Logic
 * Bug Fix F7: Replaced StorageAPI with live backend data via window.AppState
 * and window.API.roles.update() for persisting changes to the backend.
 */

document.addEventListener("DOMContentLoaded", async () => {
    // Wait for backend hydration
    if (window.AppState && typeof window.AppState.hydrate === 'function') {
        await window.AppState.hydrate();
    }

    const matrixBody = document.getElementById("matrixBody");
    const saveBtn    = document.getElementById("savePermissionsBtn");

    let rolesData = [];

    function renderMatrix() {
        // Read roles from live AppState (backend-hydrated)
        rolesData = (window.AppState ? window.AppState.getState().roles : []) || [];

        const permissionKeys = ['manageUsers', 'manageComplaints', 'viewReports', 'configureSystem', 'manageDatabase'];

        matrixBody.innerHTML = rolesData.map((role, rIndex) => {
            const isSuperUser = role.roleId === 'super_user' || role.name === 'Super User';

            return `
                <tr>
                    <td class="role-col">${role.name}</td>
                    ${permissionKeys.map(key => `
                        <td>
                            <label class="switch">
                                <input type="checkbox"
                                    data-role-idx="${rIndex}"
                                    data-perm-key="${key}"
                                    ${(role.permissions || {})[key] ? 'checked' : ''}
                                    ${isSuperUser ? 'disabled' : ''}>
                                <span class="slider"></span>
                            </label>
                        </td>
                    `).join("")}
                </tr>
            `;
        }).join("");

        // Attach change listeners
        document.querySelectorAll('.matrix-table input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                saveBtn.disabled = false;
                saveBtn.innerText = "Save Changes";

                const idx = parseInt(e.target.getAttribute('data-role-idx'), 10);
                const key = e.target.getAttribute('data-perm-key');
                if (!rolesData[idx].permissions) rolesData[idx].permissions = {};
                rolesData[idx].permissions[key] = e.target.checked;
            });
        });
    }

    saveBtn.addEventListener('click', async () => {
        // Persist each changed role to the backend
        const promises = rolesData.map(role => {
            const id = role.roleId || role.id;
            if (!id) return Promise.resolve();
            return window.API && window.API.roles
                ? window.API.roles.update(id, { permissions: role.permissions }).catch(err => {
                    console.error(`[roles.js] Failed to update role ${id}:`, err?.message);
                })
                : Promise.resolve();
        });
        await Promise.all(promises);

        saveBtn.disabled = true;
        saveBtn.innerText = "Saved Successfully ✓";
        setTimeout(() => { saveBtn.innerText = "Save Changes"; }, 2000);

        // Refresh state from backend
        if (window.AppState) await window.AppState.refresh();
    });

    // Init
    renderMatrix();

    window.addEventListener('appStateChanged', () => {
        renderMatrix();
    });
});
