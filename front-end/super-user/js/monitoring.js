/**
 * Mocking live changes for Operations monitoring
 */
document.addEventListener("DOMContentLoaded", () => {
    const activeSessions = document.getElementById("activeSessions");
    const dbLoad = document.getElementById("dbLoad");

    // Simulate simple live monitoring fluctuations
    setInterval(() => {
        let currentLoad = parseInt(dbLoad.innerText);
        let currentSessions = parseInt(activeSessions.innerText);

        // +/- 5% variation
        currentLoad += Math.floor(Math.random() * 5) - 2;
        if(currentLoad < 10) currentLoad = 10;
        if(currentLoad > 95) currentLoad = 95;
        
        currentSessions += Math.floor(Math.random() * 20) - 10;
        if(currentSessions < 100) currentSessions = 100;

        dbLoad.innerText = currentLoad + "%";
        activeSessions.innerText = currentSessions;
    }, 3000);
});
