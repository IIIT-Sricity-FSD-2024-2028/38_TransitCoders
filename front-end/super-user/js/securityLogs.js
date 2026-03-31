/**
 * Security Logs — Super Admin
 * Reads from centralized state, search/filter, export CSV, and cross-page sync.
 */
document.addEventListener("DOMContentLoaded", function () {
    var tableBody = document.getElementById("logsTableBody");
    var searchInput = document.getElementById("searchInput");

    function getLogs() {
        return StorageAPI.getSecurityLogs();
    }

    function renderTable() {
        var logs = getLogs();
        var search = searchInput.value.toLowerCase();
        
        var filtered = logs.filter(function(l) {
            return l.user.toLowerCase().indexOf(search) !== -1 || 
                   l.ip.indexOf(search) !== -1 || 
                   l.action.toLowerCase().indexOf(search) !== -1;
        });

        if (filtered.length > 0) {
            tableBody.innerHTML = filtered.map(function(l) {
                return '<tr>' +
                    '<td style="color:var(--text-subtitle); font-size:0.875rem">' + l.time + '</td>' +
                    '<td style="font-weight:500">' + l.user + '</td>' +
                    '<td>' + l.action + '</td>' +
                    '<td style="font-family: monospace">' + l.ip + '</td>' +
                    '<td>' +
                        '<span class="status-badge badge-' + (l.status === 'Success' ? 'active' : 'suspended') + '">' + l.status + '</span>' +
                    '</td>' +
                '</tr>';
            }).join("");
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--text-subtitle)">No logs found.</td></tr>';
        }
    }

    searchInput.addEventListener("input", renderTable);
    renderTable();

    // Export CSV Button
    var exportBtn = document.querySelector('.page-header .btn-secondary');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            var logs = getLogs();
            var csv = 'Timestamp,User,Action,IP Address,Status\n';
            logs.forEach(function(l) {
                csv += '"' + l.time + '","' + l.user + '","' + l.action + '","' + l.ip + '","' + l.status + '"\n';
            });

            var blob = new Blob([csv], { type: 'text/csv' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'security_logs_' + new Date().toISOString().slice(0,10) + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (typeof showToast === 'function') {
                showToast('Security logs exported as CSV.', 'success');
            }
        });
    }

    window.addEventListener('appStateChanged', renderTable);
    window.addEventListener('storage', function(e) {
        if (e.key === 'swifttrack_central_state') renderTable();
    });
});
