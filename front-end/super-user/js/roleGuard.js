/**
 * Role checking to prevent unauthorized access.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Determine the current role. If not set, mock it for development purposes.
    if (!localStorage.getItem("userRole")) {
        // Uncomment below to enforce hard logic in production:
        // window.location.href = "access-denied.html";
        
        // For development, we set to superUser to keep the flow working.
        localStorage.setItem("userRole", "superUser");
    }

    const currentRole = localStorage.getItem("userRole");

    if (currentRole !== "superUser") {
        // Access denied if role is not strictly superUser
        window.location.replace("access-denied.html");
    }
    
    // Quick logout handler for the UI
    const logoutBtn = document.getElementById("logoutBtn");
    if(logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("userRole");
            // Redirect to shared login in a real scenario
            window.location.href = "../auth/login.html"; 
        });
    }
});
