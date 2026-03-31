/**
 * System Configuration — Super Admin
 * Tab routing, zone CRUD, config save with toast, notifications settings.
 */

document.addEventListener("DOMContentLoaded", function () {
    // Tab routing
    var tabs = document.querySelectorAll('.settings-tab');
    var panels = document.querySelectorAll('.settings-panel');

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabs.forEach(function(t) { t.classList.remove('active'); });
            panels.forEach(function(p) { p.classList.remove('active'); });
            tab.classList.add('active');
            var target = tab.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
        });
    });

    // --- Zones CRUD ---
    var zoneContainer = document.getElementById("zoneListContainer");
    var addZoneBtn = document.getElementById("addZoneBtn");
    var zoneModal = document.getElementById("zoneModal");

    function renderZones() {
        var zones = StorageAPI.getZones();
        if (!zoneContainer) return;

        if (zones.length === 0) {
            zoneContainer.innerHTML = '<div class="zone-item" style="justify-content:center; color:var(--text-subtitle)">No zones configured.</div>';
            return;
        }

        zoneContainer.innerHTML = zones.map(function(z) {
            return '<div class="zone-item" data-zone-id="' + z.id + '">' +
                '<div class="zone-details">' +
                    '<strong>' + z.name + '</strong>' +
                    '<span>' + z.region + ' • Limits: ' + z.boundaries + '</span>' +
                '</div>' +
                '<div class="action-buttons">' +
                    '<button class="action-icon zone-edit-btn" data-id="' + z.id + '" title="Edit">' +
                        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">' +
                            '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>' +
                            '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' +
                        '</svg>' +
                    '</button>' +
                    '<button class="action-icon danger zone-delete-btn" data-id="' + z.id + '" title="Delete">' +
                        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">' +
                            '<polyline points="3 6 5 6 21 6"></polyline>' +
                            '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
                            '<line x1="10" y1="11" x2="10" y2="17"></line>' +
                            '<line x1="14" y1="11" x2="14" y2="17"></line>' +
                        '</svg>' +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join("");

        // Edit buttons
        document.querySelectorAll('.zone-edit-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var id = e.currentTarget.dataset.id;
                openZoneModal(id);
            });
        });

        // Delete buttons
        document.querySelectorAll('.zone-delete-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var id = e.currentTarget.dataset.id;
                var zone = StorageAPI.getZones().find(function(z) { return z.id === id; });
                if (confirm('Delete zone "' + (zone ? zone.name : id) + '"?')) {
                    StorageAPI.deleteZone(id);
                    renderZones();
                    if (typeof showToast === 'function') {
                        showToast('Zone deleted successfully.', 'warning');
                    }
                }
            });
        });
    }

    // Zone Modal
    function createZoneModal() {
        if (document.getElementById('zoneModal')) return;
        var modal = document.createElement('div');
        modal.id = 'zoneModal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = 
            '<div class="modal-container" style="max-width:480px">' +
                '<div class="modal-header">' +
                    '<h2 id="zoneModalTitle">Add New Zone</h2>' +
                    '<button class="modal-close" id="closeZoneModalBtn">' +
                        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
                    '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="zoneForm">' +
                        '<input type="hidden" id="zoneId">' +
                        '<div class="form-group">' +
                            '<label class="form-label">Zone Name</label>' +
                            '<input type="text" id="zoneName" class="form-control" placeholder="e.g. South Hub">' +
                            '<div class="form-error">Zone name is required.</div>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label class="form-label">Region</label>' +
                            '<input type="text" id="zoneRegion" class="form-control" placeholder="e.g. Southern Metro">' +
                            '<div class="form-error">Region is required.</div>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label class="form-label">Boundaries</label>' +
                            '<input type="text" id="zoneBoundaries" class="form-control" placeholder="e.g. ZIP 4000-4999">' +
                            '<div class="form-error">Boundaries are required.</div>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-secondary" id="cancelZoneBtn">Cancel</button>' +
                    '<button class="btn btn-primary" id="saveZoneBtn">Save Zone</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(modal);

        // Events
        document.getElementById('closeZoneModalBtn').addEventListener('click', closeZoneModal);
        document.getElementById('cancelZoneBtn').addEventListener('click', function(e) { e.preventDefault(); closeZoneModal(); });
        modal.addEventListener('click', function(e) { if (e.target === modal) closeZoneModal(); });

        document.getElementById('saveZoneBtn').addEventListener('click', function(e) {
            e.preventDefault();
            var name = document.getElementById('zoneName').value.trim();
            var region = document.getElementById('zoneRegion').value.trim();
            var boundaries = document.getElementById('zoneBoundaries').value.trim();

            // Validation
            var valid = true;
            if (!name) { document.getElementById('zoneName').closest('.form-group').classList.add('has-error'); valid = false; }
            if (!region) { document.getElementById('zoneRegion').closest('.form-group').classList.add('has-error'); valid = false; }
            if (!boundaries) { document.getElementById('zoneBoundaries').closest('.form-group').classList.add('has-error'); valid = false; }
            if (!valid) return;

            var zoneId = document.getElementById('zoneId').value;
            if (zoneId) {
                // Edit
                StorageAPI.updateZone(zoneId, { name: name, region: region, boundaries: boundaries });
                if (typeof showToast === 'function') showToast('Zone updated successfully.', 'success');
            } else {
                // Add
                StorageAPI.addZone({ name: name, region: region, boundaries: boundaries });
                if (typeof showToast === 'function') showToast('Zone "' + name + '" added.', 'success');
            }
            closeZoneModal();
            renderZones();
        });

        // Clear errors on input
        ['zoneName', 'zoneRegion', 'zoneBoundaries'].forEach(function(id) {
            document.getElementById(id).addEventListener('input', function() {
                this.closest('.form-group').classList.remove('has-error');
            });
        });
    }

    function openZoneModal(editId) {
        createZoneModal();
        var modal = document.getElementById('zoneModal');
        var titleEl = document.getElementById('zoneModalTitle');
        document.querySelectorAll('#zoneForm .has-error').forEach(function(el) { el.classList.remove('has-error'); });

        if (editId) {
            var zone = StorageAPI.getZones().find(function(z) { return z.id === editId; });
            if (!zone) return;
            titleEl.innerText = "Edit Zone";
            document.getElementById('zoneId').value = zone.id;
            document.getElementById('zoneName').value = zone.name;
            document.getElementById('zoneRegion').value = zone.region;
            document.getElementById('zoneBoundaries').value = zone.boundaries;
        } else {
            titleEl.innerText = "Add New Zone";
            document.getElementById('zoneId').value = '';
            document.getElementById('zoneForm').reset();
        }
        modal.classList.add('active');
    }

    function closeZoneModal() {
        var modal = document.getElementById('zoneModal');
        if (modal) modal.classList.remove('active');
    }

    // Wire up the "Add New Zone" button
    var addZoneLink = document.querySelector('#sys-zones .view-all');
    if (addZoneLink) {
        addZoneLink.removeAttribute('onclick');
        addZoneLink.addEventListener('click', function(e) {
            e.preventDefault();
            openZoneModal();
        });
    }

    // Save Global Config with toast
    var saveGlobalBtn = document.getElementById("saveGlobalBtn");
    if (saveGlobalBtn) {
        saveGlobalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var btn = saveGlobalBtn;
            btn.innerText = "Settings Saved!";
            btn.disabled = true;
            if (typeof showToast === 'function') {
                showToast('Core system settings saved successfully.', 'success');
            }
            setTimeout(function() {
                btn.innerText = "Save Core Settings";
                btn.disabled = false;
            }, 2000);
        });
    }

    // Initial render
    renderZones();

    window.addEventListener('appStateChanged', renderZones);
    window.addEventListener('storage', function(e) {
        if (e.key === 'swifttrack_central_state') renderZones();
    });
});
