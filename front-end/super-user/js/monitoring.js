/**
 * Operations Monitoring — Super Admin
 * Live simulated fluctuations for monitoring KPIs.
 * Reads real user/order counts from state.
 */
document.addEventListener("DOMContentLoaded", function () {
    var activeSessions = document.getElementById("activeSessions");
    var dbLoad = document.getElementById("dbLoad");

    // Set initial values from real data if possible
    if (activeSessions && typeof StorageAPI !== 'undefined') {
        var users = StorageAPI.getUsers();
        activeSessions.innerText = 200 + users.length * 30;
    }

    // Simulate simple live monitoring fluctuations
    setInterval(function () {
        if (!dbLoad || !activeSessions) return;

        var currentLoad = parseInt(dbLoad.innerText) || 42;
        var currentSessions = parseInt(activeSessions.innerText) || 489;

        // +/- 5% variation
        currentLoad += Math.floor(Math.random() * 5) - 2;
        if (currentLoad < 10) currentLoad = 10;
        if (currentLoad > 95) currentLoad = 95;
        
        currentSessions += Math.floor(Math.random() * 20) - 10;
        if (currentSessions < 100) currentSessions = 100;

        dbLoad.innerText = currentLoad + "%";
        activeSessions.innerText = currentSessions;
    }, 3000);
});
