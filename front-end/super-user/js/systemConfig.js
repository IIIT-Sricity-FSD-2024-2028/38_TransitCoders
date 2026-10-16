/**
 * System Configurations Javascript
 * Bug Fix F12: Removed StorageAPI. Zones are replaced by backend Hubs
 * (the zones table does not exist in the NestJS schema).
 */

document.addEventListener("DOMContentLoaded", async () => {
    // Wait for backend hydration — no StorageAPI needed
    if (window.AppState && typeof window.AppState.hydrate === 'function') {
        await window.AppState.hydrate();
    }

    // Tab routing logically
    const tabs   = document.querySelectorAll('.settings-tab');
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

    // Populate Hubs (backend equivalent of zones)
    const zoneContainer = document.getElementById("zoneListContainer");
    const hubs = (window.AppState ? window.AppState.getState().hubs : []) || [];

    if (zoneContainer) {
        if (hubs.length > 0) {
            zoneContainer.innerHTML = hubs.map(h => `
                <div class="zone-item">
                    <div class="zone-details">
                        <strong>${h.name}</strong>
                        <span>${h.city || h.location || ''} • Capacity: ${h.capacity || 'N/A'}</span>
                    </div>
                    <div class="action-buttons">
                        <button class="action-icon edit-btn" title="Edit"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                        <button class="action-icon danger delete-btn" title="Delete"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                    </div>
                </div>
            `).join("");
        } else {
            zoneContainer.innerHTML = `<p style="color:var(--text-subtitle);padding:16px">No hubs configured. Add hubs via the backend API.</p>`;
        }
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

