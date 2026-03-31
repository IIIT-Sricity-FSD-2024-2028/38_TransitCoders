/**
 * Role checking to prevent unauthorized access.
 * Also initializes: profile modal, logout, notification bell panel.
 */
document.addEventListener("DOMContentLoaded", function () {
    var user = null;
    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        user = null;
    }

    var roleFromUser = user && user.role ? String(user.role).toLowerCase() : "";
    var currentRole = user && user.role ? String(user.role).toLowerCase() : "";

    var allowedRoles = ["super_user", "super-user", "superuser"];
    if (!allowedRoles.includes(currentRole)) {
        window.location.replace("access-denied.html");
        return;
    }

    initProfileModal(user);
    initNotificationPanel();
    
    // Quick logout handler
    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            performLogout();
        });
    }
});

function performLogout() {
    if (typeof Auth !== 'undefined') {
        Auth.logout();
    } else {
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        localStorage.removeItem("userRole");
        window.location.href = "../auth/login.html";
    }
}

function initProfileModal(user) {
    var profileTrigger = document.querySelector(".topbar .user-profile");
    if (!profileTrigger) return;

    var safeName = user && user.name ? user.name : "Super User";
    var safeEmail = user && user.email ? user.email : "admin@swifttrack.com";
    var safeHub = user && user.hub_id ? user.hub_id : "Global Workspace";
    var initials = safeName
        .split(" ")
        .map(function (part) { return part[0]; })
        .join("")
        .slice(0, 2)
        .toUpperCase();

    var modalBackdrop = document.getElementById("superUserProfileModal");
    if (!modalBackdrop) {
        modalBackdrop = document.createElement("div");
        modalBackdrop.id = "superUserProfileModal";
        modalBackdrop.className = "profile-modal-backdrop";
        modalBackdrop.innerHTML = 
            '<div class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle">' +
                '<button type="button" class="profile-modal-close" id="profileModalCloseBtn" aria-label="Close profile modal">&times;</button>' +
                '<h3 id="profileModalTitle" class="profile-modal-title">Profile</h3>' +
                '<div class="profile-modal-avatar">' + (initials || "SU") + '</div>' +
                '<div class="profile-modal-name">' + safeName + '</div>' +
                '<div class="profile-modal-email">' + safeEmail + '</div>' +
                '<div class="profile-modal-hub">Hub: ' + safeHub + '</div>' +
                '<div class="profile-modal-role">Role: Super User</div>' +
                '<div class="profile-modal-actions">' +
                    '<button type="button" class="profile-modal-btn profile-modal-btn-secondary" id="profileModalCloseAction">Close</button>' +
                    '<button type="button" class="profile-modal-btn profile-modal-btn-primary" id="profileModalLogoutAction">Logout</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(modalBackdrop);
    }

    var closeButton = document.getElementById("profileModalCloseBtn");
    var closeAction = document.getElementById("profileModalCloseAction");
    var logoutAction = document.getElementById("profileModalLogoutAction");

    var openModal = function () { modalBackdrop.classList.add("active"); };
    var closeModal = function () { modalBackdrop.classList.remove("active"); };

    profileTrigger.addEventListener("click", openModal);
    closeButton.addEventListener("click", closeModal);
    closeAction.addEventListener("click", closeModal);
    logoutAction.addEventListener("click", performLogout);

    modalBackdrop.addEventListener("click", function (event) {
        if (event.target === modalBackdrop) closeModal();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && modalBackdrop.classList.contains("active")) {
            closeModal();
        }
    });
}

/**
 * Notification Bell Panel — wired to bell button on every SU page.
 */
function initNotificationPanel() {
    var bellBtn = document.querySelector(".topbar-bell");
    if (!bellBtn) return;

    // Create notification dropdown panel
    var panel = document.createElement("div");
    panel.id = "notificationPanel";
    panel.className = "notification-panel";
    panel.innerHTML = 
        '<div class="notification-panel-header">' +
            '<h4>Notifications</h4>' +
            '<button class="notification-clear-btn" id="clearNotificationsBtn">Clear All</button>' +
        '</div>' +
        '<div class="notification-list" id="notificationList"></div>';
    
    // Position it in the topbar
    var topbarActions = bellBtn.parentElement;
    topbarActions.style.position = "relative";
    topbarActions.appendChild(panel);

    // Add styles
    if (!document.getElementById("notification-panel-styles")) {
        var style = document.createElement("style");
        style.id = "notification-panel-styles";
        style.textContent = 
            '.notification-panel {' +
                'position: absolute; top: 54px; right: 60px; width: 340px; max-height: 400px;' +
                'background: var(--bg-secondary, #1e293b); border: 1px solid var(--border-color, #334155);' +
                'border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); z-index: 1000;' +
                'display: none; flex-direction: column; overflow: hidden;' +
                'animation: notifSlideIn 0.2s ease;' +
            '}' +
            '.notification-panel.active { display: flex; }' +
            '@keyframes notifSlideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }' +
            '.notification-panel-header {' +
                'display: flex; justify-content: space-between; align-items: center;' +
                'padding: 14px 16px; border-bottom: 1px solid var(--border-color, #334155);' +
            '}' +
            '.notification-panel-header h4 { margin:0; font-size:0.9rem; color: var(--text-primary, #fff); }' +
            '.notification-clear-btn {' +
                'background: none; border: none; color: var(--clr-blue-500, #3b82f6); cursor: pointer;' +
                'font-size: 0.75rem; font-weight: 500;' +
            '}' +
            '.notification-clear-btn:hover { text-decoration: underline; }' +
            '.notification-list { overflow-y: auto; max-height: 320px; padding: 8px 0; }' +
            '.notification-item {' +
                'padding: 12px 16px; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.05));' +
                'cursor: pointer; transition: background 0.2s;' +
            '}' +
            '.notification-item:hover { background: rgba(99,102,241,0.08); }' +
            '.notification-item.unread { border-left: 3px solid var(--clr-blue-500, #3b82f6); }' +
            '.notification-item-title { font-size: 0.8rem; font-weight: 500; color: var(--text-primary, #e2e8f0); margin-bottom: 2px; }' +
            '.notification-item-time { font-size: 0.7rem; color: var(--text-subtitle, #94a3b8); }' +
            '.notification-empty { text-align:center; padding:24px; color: var(--text-subtitle, #94a3b8); font-size:0.8rem; }';
        document.head.appendChild(style);
    }

    function generateNotifications() {
        var items = [];
        // Generate from live data
        if (typeof StorageAPI !== 'undefined') {
            var complaints = StorageAPI.getComplaints ? StorageAPI.getComplaints() : [];
            var openComplaints = complaints.filter(function(c) { return c.status === 'Open' || c.status === 'Escalated'; });
            openComplaints.forEach(function(c) {
                items.push({
                    title: c.priority + ' Complaint: ' + c.type,
                    time: c.date + ' — ' + c.customer,
                    read: c.status === 'Open'
                });
            });

            var feedback = StorageAPI.getFeedback ? StorageAPI.getFeedback() : [];
            var pendingFb = feedback.filter(function(f) { return f.status === 'Pending'; });
            pendingFb.forEach(function(f) {
                items.push({
                    title: 'Pending Review: ' + f.customer + ' (' + f.rating + '★)',
                    time: f.date,
                    read: false
                });
            });
        }

        // Add some system notifications
        items.push(
            { title: 'System backup completed', time: '2 hours ago', read: true },
            { title: 'Notification Gateway degraded', time: '4 hours ago', read: false }
        );

        return items;
    }

    function renderNotifications() {
        var list = document.getElementById("notificationList");
        if (!list) return;

        var items = generateNotifications();
        var unreadCount = items.filter(function(i) { return !i.read; }).length;
        
        // Update bell dot
        var dot = bellBtn.querySelector('.bell-dot');
        if (dot) {
            dot.style.display = unreadCount > 0 ? 'block' : 'none';
        }

        if (items.length === 0) {
            list.innerHTML = '<div class="notification-empty">No notifications</div>';
            return;
        }

        list.innerHTML = items.map(function(item) {
            return '<div class="notification-item' + (item.read ? '' : ' unread') + '">' +
                '<div class="notification-item-title">' + item.title + '</div>' +
                '<div class="notification-item-time">' + item.time + '</div>' +
            '</div>';
        }).join("");
    }

    // Toggle panel
    bellBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var isActive = panel.classList.contains("active");
        panel.classList.toggle("active");
        if (!isActive) renderNotifications();
    });

    // Close on click outside
    document.addEventListener("click", function (e) {
        if (!panel.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
            panel.classList.remove("active");
        }
    });

    // Clear all
    document.getElementById("clearNotificationsBtn").addEventListener("click", function () {
        var list = document.getElementById("notificationList");
        list.innerHTML = '<div class="notification-empty">No notifications</div>';
        var dot = bellBtn.querySelector('.bell-dot');
        if (dot) dot.style.display = 'none';
        if (typeof showToast === 'function') showToast('Notifications cleared.', 'info');
    });

    // Initial bell dot state
    var items = generateNotifications();
    var dot = bellBtn.querySelector('.bell-dot');
    if (dot) {
        var unread = items.filter(function(i) { return !i.read; }).length;
        dot.style.display = unread > 0 ? 'block' : 'none';
    }
}
