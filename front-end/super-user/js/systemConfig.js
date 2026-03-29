/**
 * System Configurations Javascript
 */

document.addEventListener("DOMContentLoaded", async () => {
    await StorageAPI.init();
    // Tab routing logically
    const tabs = document.querySelectorAll('.settings-tab');
    const panels = document.querySelectorAll('.settings-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // strip active
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            // set active
            tab.classList.add('active');
            const target = tab.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
        });
    });

    // Populate Zones
    const zoneContainer = document.getElementById("zoneListContainer");
    const zones = StorageAPI.getZones();

    if(zoneContainer && zones) {
        zoneContainer.innerHTML = zones.map(z => `
            <div class="zone-item">
                <div class="zone-details">
                    <strong>${z.name}</strong>
                    <span>${z.region} • Limits: ${z.boundaries}</span>
                </div>
                <div class="action-buttons">
                    <button class="action-icon edit-btn" title="Edit"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button class="action-icon danger delete-btn" title="Delete"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                </div>
            </div>
        `).join("");
    }

    // Save Generic Configs
    document.getElementById("saveGlobalBtn").addEventListener('click', (e) => {
        let btn = e.target;
        btn.innerText = "Settings Saved!";
        btn.disabled = true;
        setTimeout(() => {
            btn.innerText = "Save Core Settings";
            btn.disabled = false;
        }, 2000);
    });
});
