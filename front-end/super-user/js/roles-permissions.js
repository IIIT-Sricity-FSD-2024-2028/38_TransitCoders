/**
 * Roles & Permissions Controller
 * Handles the RBAC UI logic, table generation, filtering, and persistence.
 */

document.addEventListener("DOMContentLoaded", async () => {
    // Wait for backend hydration — no StorageAPI needed
    if (window.AppState && typeof window.AppState.hydrate === 'function') {
        await window.AppState.hydrate();
    }
    
    // Check if PermissionsConfig is loaded, if not wait a bit or error
    if (typeof window.PermissionsConfig === 'undefined') {
        console.error("PermissionsConfig not loaded! Ensure permissions-config.js is included.");
        return;
    }

    const { modules, defaultRoles } = window.PermissionsConfig;
    
    // Core state
    let activeRoles = [];
    let selectedRoleIndex = null;
    
    // DOM Elements
    const matrixHeader = document.getElementById("matrixHeader");
    const matrixBody = document.getElementById("matrixBody");
    const saveBtn = document.getElementById("savePermissionsBtn");
    const resetBtn = document.getElementById("resetDefaultsBtn");
    const searchInput = document.getElementById("permSearch");
    
    // Summary Card Elements
    const sCardTitle = document.getElementById("scard-title");
    const sCardDesc = document.getElementById("scard-desc");
    const sCardBadge = document.getElementById("scard-badge");
    const sCardCount = document.getElementById("scard-count");

    // Load data
    function loadData() {
        // Read roles from live AppState (backend-hydrated)
        const storedRoles = (window.AppState ? window.AppState.getState().roles : []) || [];
        // Fallback to default configs if backend returned nothing
        if (storedRoles && storedRoles.length > 0 && storedRoles[0].id) {
            activeRoles = JSON.parse(JSON.stringify(storedRoles));

            // Auto-append any new roles from default config not currently in backend
            defaultRoles.forEach(dRole => {
                if (!activeRoles.find(ar => ar.id === dRole.id)) {
                    activeRoles.push(JSON.parse(JSON.stringify(dRole)));
                }
            });
        } else {
            activeRoles = JSON.parse(JSON.stringify(defaultRoles));
        }

        // Select 'admin' by default if possible, else first
        const adminIdx = activeRoles.findIndex(r => r.id === 'admin');
        selectedRoleIndex = adminIdx >= 0 ? adminIdx : 0;
    }

    function renderMatrix() {
        // Render Header Row
        let headerHtml = `<tr><th class="col-perm-name">Module / Permission</th>`;
        activeRoles.forEach((r, idx) => {
            headerHtml += `<th class="role-col-header" data-idx="${idx}" style="cursor:pointer; ${idx === selectedRoleIndex ? 'color:var(--primary); background:rgba(255,92,2,0.05);' : ''}">${r.name}</th>`;
        });
        headerHtml += `</tr>`;
        matrixHeader.innerHTML = headerHtml;

        // Render Body
        let bodyHtml = "";
        
        modules.forEach(mod => {
            // Group Header
            bodyHtml += `
                <tr class="module-group-header" data-mod="${mod.id}">
                    <td colspan="${activeRoles.length + 1}">
                        <div class="group-title-wrapper">
                            <svg class="group-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            ${mod.name}
                        </div>
                    </td>
                </tr>
            `;
            
            // Permissions Rows
            mod.permissions.forEach(p => {
                bodyHtml += `<tr class="permission-row" data-mod="${mod.id}" data-search="${p.label.toLowerCase()} ${mod.name.toLowerCase()}">
                    <td class="perm-label-cell">${p.label}</td>`;
                
                // Columns for each role
                activeRoles.forEach((role, rIdx) => {
                    const isSystemOverride = role.id === 'super_user';
                    const isChecked = role.permissions[p.key] === true;
                    
                    bodyHtml += `
                        <td>
                            <label class="permission-toggle">
                                <input type="checkbox" 
                                    data-role-idx="${rIdx}" 
                                    data-perm-key="${p.key}"
                                    ${isChecked ? 'checked' : ''}
                                    ${isSystemOverride ? 'disabled' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </td>
                    `;
                });
                
                bodyHtml += `</tr>`;
            });
        });
        
        matrixBody.innerHTML = bodyHtml;
        
        attachMatrixListeners();
        updateSummaryCard();
    }

    function attachMatrixListeners() {
        // Toggles
        document.querySelectorAll('.permission-toggle input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                saveBtn.disabled = false;
                const idx = parseInt(e.target.getAttribute('data-role-idx'));
                const key = e.target.getAttribute('data-perm-key');
                activeRoles[idx].permissions[key] = e.target.checked;
                
                if (idx === selectedRoleIndex) {
                    updateSummaryCard();
                }
            });
        });

        // Column selection
        document.querySelectorAll('.role-col-header').forEach(th => {
            th.addEventListener('click', (e) => {
                selectedRoleIndex = parseInt(e.currentTarget.getAttribute('data-idx'));
                renderMatrix();
            });
        });

        // Collapsible Mod headers
        document.querySelectorAll('.module-group-header').forEach(tr => {
            tr.addEventListener('click', (e) => {
                const header = e.currentTarget;
                const modId = header.getAttribute('data-mod');
                const isCollapsed = header.classList.toggle('collapsed');
                
                // Toggle rows
                document.querySelectorAll(`.permission-row[data-mod="${modId}"]`).forEach(row => {
                    if (isCollapsed) row.classList.add('hidden');
                    else {
                        // respect search if active
                        const term = searchInput.value.toLowerCase();
                        if (!term || row.getAttribute('data-search').includes(term)) {
                            row.classList.remove('hidden');
                        }
                    }
                });
            });
        });
    }

    function updateSummaryCard() {
        if (!activeRoles[selectedRoleIndex]) return;
        const role = activeRoles[selectedRoleIndex];
        
        sCardTitle.innerText = role.name;
        sCardDesc.innerText = role.description || '';
        sCardBadge.innerText = role.isSystem ? 'System Role' : 'Customizable';
        sCardBadge.style.color = role.isSystem ? '#dc2626' : 'var(--primary)';
        sCardBadge.style.background = role.isSystem ? 'rgba(220, 38, 38, 0.1)' : 'rgba(255, 92, 2, 0.1)';
        
        // Count true permissions
        let activeCount = Object.values(role.permissions).filter(v => v === true).length;
        sCardCount.innerText = activeCount;
    }

    // Search filter
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.permission-row').forEach(row => {
                const searchable = row.getAttribute('data-search');
                const modId = row.getAttribute('data-mod');
                const headerNode = document.querySelector(`.module-group-header[data-mod="${modId}"]`);
                
                if (term === '' && !headerNode.classList.contains('collapsed')) {
                    row.classList.remove('hidden');
                } else if (term === '') {
                    // Do nothing, let collapse state rule
                } else {
                    if (searchable.includes(term)) {
                        row.classList.remove('hidden');
                        headerNode.classList.remove('collapsed'); // force expand parent
                    } else {
                        row.classList.add('hidden');
                    }
                }
            });
        });
    }

    // Save — persist each role to the backend
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const promises = activeRoles.map(role => {
                const id = role.roleId || role.id;
                if (!id || !window.API || !window.API.roles) return Promise.resolve();
                return window.API.roles.update(id, { permissions: role.permissions }).catch(err => {
                    console.error(`[roles-permissions.js] Failed to update role ${id}:`, err?.message);
                });
            });
            await Promise.all(promises);

            saveBtn.disabled = true;
            if (typeof window.showToast === 'function') {
                showToast("Permissions successfully updated.", "success");
            }
            // Refresh from backend
            if (window.AppState) await window.AppState.refresh();
        });
    }

    // Reset Defaults
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset all roles back to their system defaults? This cannot be undone.")) {
                activeRoles = JSON.parse(JSON.stringify(defaultRoles));
                saveBtn.disabled = false;
                renderMatrix();
                if (typeof window.showToast === 'function') {
                    showToast("Loaded system defaults. Click Save changes to apply.", "info");
                }
            }
        });
    }

    // Init display
    loadData();
    renderMatrix();
});
