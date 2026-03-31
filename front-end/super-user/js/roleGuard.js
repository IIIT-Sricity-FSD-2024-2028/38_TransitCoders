/**
 * Role checking to prevent unauthorized access.
 */
document.addEventListener("DOMContentLoaded", () => {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        user = null;
    }

    const roleFromUser = user && user.role ? String(user.role).toLowerCase() : "";
    const roleFromLegacyKey = String(localStorage.getItem("userRole") || "").toLowerCase();
    const currentRole = roleFromUser || roleFromLegacyKey;

    const allowedRoles = ["super_user", "super-user", "superuser"];
    if (!allowedRoles.includes(currentRole)) {
        window.location.replace("access-denied.html");
        return;
    }

    // Keep legacy key in sync for pages/scripts that still read userRole directly.
    localStorage.setItem("userRole", currentRole);

    initProfileModal(user);
    
    // Quick logout handler for the UI
    const logoutBtn = document.getElementById("logoutBtn");
    if(logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            performLogout();
        });
    }
});

function performLogout() {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    localStorage.removeItem("userRole");
    window.location.href = "../auth/login.html";
}

function initProfileModal(user) {
    const profileTrigger = document.querySelector(".topbar .user-profile");
    if (!profileTrigger) return;

    const safeName = user && user.name ? user.name : "Super User";
    const safeEmail = user && user.email ? user.email : "admin@swifttrack.com";
    const safeHub = user && user.hub_id ? user.hub_id : "Global Workspace";
    const initials = safeName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    let modalBackdrop = document.getElementById("superUserProfileModal");
    if (!modalBackdrop) {
        modalBackdrop = document.createElement("div");
        modalBackdrop.id = "superUserProfileModal";
        modalBackdrop.className = "profile-modal-backdrop";
        modalBackdrop.innerHTML = `
            <div class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle">
                <button type="button" class="profile-modal-close" id="profileModalCloseBtn" aria-label="Close profile modal">&times;</button>
                <h3 id="profileModalTitle" class="profile-modal-title">Profile</h3>
                <div class="profile-modal-avatar">${initials || "SU"}</div>
                <div class="profile-modal-name">${safeName}</div>
                <div class="profile-modal-email">${safeEmail}</div>
                <div class="profile-modal-hub">Hub: ${safeHub}</div>
                <div class="profile-modal-role">Role: Super User</div>
                <div class="profile-modal-actions">
                    <button type="button" class="profile-modal-btn profile-modal-btn-secondary" id="profileModalCloseAction">Close</button>
                    <button type="button" class="profile-modal-btn profile-modal-btn-primary" id="profileModalLogoutAction">Logout</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalBackdrop);
    }

    const closeButton = document.getElementById("profileModalCloseBtn");
    const closeAction = document.getElementById("profileModalCloseAction");
    const logoutAction = document.getElementById("profileModalLogoutAction");

    const openModal = () => {
        modalBackdrop.classList.add("active");
    };

    const closeModal = () => {
        modalBackdrop.classList.remove("active");
    };

    profileTrigger.addEventListener("click", openModal);
    closeButton.addEventListener("click", closeModal);
    closeAction.addEventListener("click", closeModal);
    logoutAction.addEventListener("click", performLogout);

    modalBackdrop.addEventListener("click", (event) => {
        if (event.target === modalBackdrop) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modalBackdrop.classList.contains("active")) {
            closeModal();
        }
    });
}
