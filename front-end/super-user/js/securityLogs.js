/**
 * Security Logs Mock rendering
 */
document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("logsTableBody");
    const searchInput = document.getElementById("searchInput");

    // Fake mock logs for demonstration
    const logs = [
        { time: "2026-03-29 14:12:00", user: "alice@swifttrack.com", action: "User Login", ip: "192.168.1.100", status: "Success" },
        { time: "2026-03-29 13:45:12", user: "system", action: "Database Backup", ip: "localhost", status: "Success" },
        { time: "2026-03-29 12:30:45", user: "unknown", action: "Failed Login", ip: "203.0.113.44", status: "Failed" },
        { time: "2026-03-28 22:15:20", user: "bob@swifttrack.com", action: "Deleted Zone ZON-3", ip: "10.0.0.5", status: "Success" },
        { time: "2026-03-28 15:40:02", user: "admin@swifttrack.com", action: "Exported Reports", ip: "192.168.1.201", status: "Success" }
    ];

    function renderTable() {
        const search = searchInput.value.toLowerCase();
        
        let filtered = logs.filter(l => l.user.toLowerCase().includes(search) || l.ip.includes(search) || l.action.toLowerCase().includes(search));

        tableBody.innerHTML = filtered.length > 0 ? filtered.map(l => `
            <tr>
                <td style="color:var(--text-subtitle); font-size:0.875rem">${l.time}</td>
                <td style="font-weight:500">${l.user}</td>
                <td>${l.action}</td>
                <td style="font-family: monospace">${l.ip}</td>
                <td>
                    <span class="status-badge badge-${l.status === 'Success' ? 'active' : 'suspended'}">${l.status}</span>
                </td>
            </tr>
        `).join("") : `<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--text-subtitle)">No logs found.</td></tr>`;
    }

    searchInput.addEventListener("input", renderTable);
    renderTable();

    window.addEventListener('appStateChanged', () => {
        renderTable();
    });
});
