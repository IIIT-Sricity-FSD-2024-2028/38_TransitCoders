/** DB interactions */
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("createBackupBtn").addEventListener('click', (e) => {
        const og = e.target.innerText;
        e.target.innerText = "Backing up... (10%)";
        setTimeout(() => { e.target.innerText = "Backing up... (89%)"; }, 1000);
        setTimeout(() => { e.target.innerText = "Backup Complete ✓"; }, 2000);
        setTimeout(() => { e.target.innerText = og; }, 4000);
    });
});
