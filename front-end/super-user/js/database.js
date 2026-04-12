/**
 * Database Management JavaScript
 * Animated backup progress + log simulation
 */

document.addEventListener("DOMContentLoaded", () => {
    const backupBtn = document.getElementById("createBackupBtn");
    const progressWrap = document.getElementById("backupProgressWrap");
    const progressFill = document.getElementById("backupProgressFill");
    const progressText = document.getElementById("backupProgressText");

    const setProgress = (value) => {
        const safeProgress = Math.max(0, Math.min(100, Math.round(value)));
        if (progressFill) {
            progressFill.style.width = `${safeProgress}%`;
            progressFill.setAttribute("data-pct", `${safeProgress}%`);
        }
        if (progressText) {
            progressText.textContent = safeProgress >= 100
                ? "Backup complete - 320GB snapshot saved."
                : `Backing up snapshot... ${safeProgress}%`;
        }
    };

    if (backupBtn) {
        backupBtn.addEventListener("click", () => {
            if (backupBtn.disabled) {
                return;
            }

            backupBtn.disabled = true;
            backupBtn.innerHTML = `
                <svg style="width:16px;height:16px;margin-right:8px;animation:spin 1s linear infinite" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                Backing Up...
            `;

            if (progressWrap) {
                progressWrap.classList.add("active");
            }

            let progress = 0;
            setProgress(progress);

            const interval = setInterval(() => {
                progress += Math.random() * 9 + 4;
                if (progress > 97) {
                    progress = 100;
                }

                setProgress(progress);

                if (progress >= 100) {
                    clearInterval(interval);

                    backupBtn.innerHTML = `
                        <svg style="width:16px;height:16px;margin-right:8px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Backup Complete!
                    `;
                    backupBtn.style.background = "var(--clr-green-500)";

                    if (typeof window.showToast === "function") {
                        window.showToast("Database backup completed successfully.", "success");
                    }

                    setTimeout(() => {
                        backupBtn.disabled = false;
                        backupBtn.innerHTML = "Create Backup Now";
                        backupBtn.style.background = "";

                        if (progressWrap) {
                            progressWrap.classList.remove("active");
                        }

                        setProgress(0);
                        if (progressText) {
                            progressText.textContent = "Ready to create a fresh backup snapshot.";
                        }
                    }, 2600);
                }
            }, 220);
        });
    }

    const logTerminal = document.getElementById("logTerminal");
    if (logTerminal) {
        const logs = [
            { time: "22:04:12", level: "info", msg: "SELECT * FROM shipments WHERE status='active' - 1,248 rows" },
            { time: "22:04:11", level: "info", msg: "INSERT INTO audit_log (action, user_id) VALUES ('login', 'USR-2001')" },
            { time: "22:04:10", level: "warn", msg: "Connection pool approaching limit: 85/100 active connections" },
            { time: "22:04:08", level: "info", msg: "UPDATE complaints SET status='Resolved' WHERE id='CMP-301'" },
            { time: "22:04:05", level: "info", msg: "Cron: daily_backup job completed in 12.4s" },
            { time: "22:04:02", level: "error", msg: "Timeout on notification_gateway.send() after 5000ms - retrying" },
            { time: "22:03:58", level: "info", msg: "DELETE FROM sessions WHERE expires_at < NOW() - 34 rows purged" },
            { time: "22:03:55", level: "info", msg: "SELECT COUNT(*) FROM users - result: 4" }
        ];

        logTerminal.innerHTML = logs.map((log) => `
            <div class="log-line">
                <span class="log-time">[${log.time}]</span>
                <span class="log-level-${log.level}">[${log.level.toUpperCase()}]</span>
                ${log.msg}
            </div>
        `).join("");
    }
});

const spinStyle = document.createElement("style");
spinStyle.textContent = "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
document.head.appendChild(spinStyle);
