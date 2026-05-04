/**
 * Mocking live changes for Operations monitoring
 * Now reads real order/user data from centralized state
 */
document.addEventListener("DOMContentLoaded", () => {
    const activeSessions = document.getElementById("activeSessions");
    const dbLoad = document.getElementById("dbLoad");

    function hydrateFromState() {
        if (!window.AppState) return;
        var state = window.AppState.getState();
        var orders = state.orders || [];
        var users = state.users || [];
        var complaints = state.complaints || [];

        // Active sessions = total users (simulated)
        if (activeSessions) {
            var base = users.length * 8 + orders.length;
            activeSessions.innerText = base + Math.floor(Math.random() * 20);
        }

        // DB Load derived from order count
        if (dbLoad) {
            var load = Math.min(92, 20 + Math.round(orders.length * 1.5));
            load += Math.floor(Math.random() * 5) - 2;
            if (load < 10) load = 10;
            if (load > 95) load = 95;
            dbLoad.innerText = load + "%";
        }
    }

    // Initial hydration
    hydrateFromState();

    // Simulate simple live monitoring fluctuations
    setInterval(() => {
        hydrateFromState();
    }, 3000);

    // React to state changes from other actors
    window.addEventListener('appStateChanged', hydrateFromState);
});
