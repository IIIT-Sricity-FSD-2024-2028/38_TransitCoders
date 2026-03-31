/**
 * Database Management JavaScript — Super Admin
 * Animated backup progress + log simulation + Export + Restore buttons.
 */

document.addEventListener("DOMContentLoaded", function () {
    var backupBtn = document.getElementById("createBackupBtn");
    var progressWrap = document.getElementById("backupProgressWrap");
    var progressFill = document.getElementById("backupProgressFill");
    var progressText = document.getElementById("backupProgressText");

    var setProgress = function(value) {
        var safeProgress = Math.max(0, Math.min(100, Math.round(value)));
        if (progressFill) {
            progressFill.style.width = safeProgress + '%';
            progressFill.setAttribute("data-pct", safeProgress + '%');
        }
        if (progressText) {
            progressText.textContent = safeProgress >= 100
                ? "Backup complete - 320GB snapshot saved."
                : "Backing up snapshot... " + safeProgress + "%";
        }
    };

    if (backupBtn) {
        backupBtn.addEventListener("click", function () {
            if (backupBtn.disabled) return;

            backupBtn.disabled = true;
            backupBtn.innerHTML = '<svg style="width:16px;height:16px;margin-right:8px;animation:spin 1s linear infinite" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>Backing Up...';

            if (progressWrap) progressWrap.classList.add("active");

            var progress = 0;
            setProgress(progress);

            var interval = setInterval(function () {
                progress += Math.random() * 9 + 4;
                if (progress > 97) progress = 100;

                setProgress(progress);

                if (progress >= 100) {
                    clearInterval(interval);

                    backupBtn.innerHTML = '<svg style="width:16px;height:16px;margin-right:8px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>Backup Complete!';
                    backupBtn.style.background = "var(--clr-green-500)";

                    if (typeof window.showToast === "function") {
                        window.showToast("Database backup completed successfully.", "success");
                    }

                    // Log the action
                    if (typeof StorageAPI !== 'undefined' && StorageAPI._addSecurityLog) {
                        StorageAPI._addSecurityLog('Database Backup Created');
                    }

                    setTimeout(function () {
                        backupBtn.disabled = false;
                        backupBtn.innerHTML = "Create Backup Now";
                        backupBtn.style.background = "";

                        if (progressWrap) progressWrap.classList.remove("active");
                        setProgress(0);
                        if (progressText) progressText.textContent = "Ready to create a fresh backup snapshot.";
                    }, 2600);
                }
            }, 220);
        });
    }

    // Log Terminal
    var logTerminal = document.getElementById("logTerminal");
    if (logTerminal) {
        // Read security logs from state
        var secLogs = (typeof StorageAPI !== 'undefined' && StorageAPI.getSecurityLogs) ? 
            StorageAPI.getSecurityLogs().slice(0, 8) : [];

        // Fallback if empty
        if (secLogs.length === 0) {
            secLogs = [
                { time: "22:04:12", user: "system", action: "SELECT * FROM shipments WHERE status='active' - 1,248 rows", status: "Success" },
                { time: "22:04:11", user: "system", action: "INSERT INTO audit_log (action, user_id) VALUES ('login', 'USR-2001')", status: "Success" },
                { time: "22:04:10", user: "system", action: "Connection pool approaching limit: 85/100 active connections", status: "Failed" },
                { time: "22:04:08", user: "system", action: "UPDATE complaints SET status='Resolved' WHERE id='CMP-301'", status: "Success" },
                { time: "22:04:05", user: "system", action: "Cron: daily_backup job completed in 12.4s", status: "Success" },
                { time: "22:04:02", user: "system", action: "Timeout on notification_gateway.send() after 5000ms - retrying", status: "Failed" }
            ];
        }

        logTerminal.innerHTML = secLogs.map(function(log) {
            var timeStr = log.time.length > 8 ? log.time.slice(11, 19) : log.time;
            var level = log.status === 'Success' ? 'info' : (log.status === 'Failed' ? 'error' : 'warn');
            return '<div class="log-line">' +
                '<span class="log-time">[' + (timeStr || '00:00:00') + ']</span>' +
                '<span class="log-level-' + level + '">[' + level.toUpperCase() + ']</span> ' +
                log.action +
            '</div>';
        }).join("");
    }

    // --- Export Full DB Button ---
    var exportBtn = document.querySelector('.page-header .btn-secondary');
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            // Export all localStorage data as JSON
            var exportData = {};
            try {
                var state = window.AppState.getState();
                exportData = state;
            } catch (e) {
                exportData = { error: 'Failed to read state' };
            }

            var jsonStr = JSON.stringify(exportData, null, 2);
            var blob = new Blob([jsonStr], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'swifttrack_db_export_' + new Date().toISOString().slice(0, 10) + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (typeof showToast === 'function') {
                showToast('Full database exported as JSON.', 'success');
            }
            if (typeof StorageAPI !== 'undefined' && StorageAPI._addSecurityLog) {
                StorageAPI._addSecurityLog('Full Database Export');
            }
        });
    }

    // --- Restore Buttons ---
    document.querySelectorAll('.service-item .btn-secondary').forEach(function(btn) {
        btn.addEventListener('click', function () {
            var itemName = this.closest('.service-item').querySelector('strong').textContent;
            if (confirm('Restore from "' + itemName + '"? This will simulate restoring a backup.')) {
                var origText = this.textContent;
                this.textContent = 'Restoring...';
                this.disabled = true;

                var self = this;
                setTimeout(function () {
                    self.textContent = '✓ Restored';
                    self.style.color = 'var(--clr-green-500)';
                    if (typeof showToast === 'function') {
                        showToast('Backup "' + itemName + '" restored successfully.', 'success');
                    }
                    setTimeout(function () {
                        self.textContent = origText;
                        self.style.color = '';
                        self.disabled = false;
                    }, 2000);
                }, 1500);
            }
        });
    });

    // Update users row count dynamically
    var dbTableItems = document.querySelectorAll('.db-table-item');
    if (dbTableItems.length > 0 && typeof StorageAPI !== 'undefined') {
        var users = StorageAPI.getUsers();
        var orders = StorageAPI.getOrders();
        var complaints = StorageAPI.getComplaints();

        dbTableItems.forEach(function(item) {
            var nameEl = item.querySelector('.db-table-name');
            var metaEl = item.querySelector('.db-table-meta');
            if (!nameEl || !metaEl) return;
            var tableName = nameEl.textContent.trim();
            if (tableName === 'users') metaEl.textContent = users.length + ' rows';
            else if (tableName === 'shipments') metaEl.textContent = orders.length.toLocaleString() + ' rows';
            else if (tableName === 'complaints') metaEl.textContent = complaints.length + ' rows';
        });
    }
});

var spinStyle = document.createElement("style");
spinStyle.textContent = "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
document.head.appendChild(spinStyle);
