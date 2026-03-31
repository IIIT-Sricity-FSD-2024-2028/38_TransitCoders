/**
 * Hub Manager â€” Shared JS Module
 * Reusable functions for all hub-manager pages.
 * Depends on: ../js/mockData.js (window.mockData)
 */

/* ================================================================
   1. SESSION CHECK
   ================================================================ */

function checkSession() {
    let user = null;
    try {
        user = JSON.parse(sessionStorage.getItem('user'));
    } catch (e) { /* invalid JSON */ }

    if (!user || user.role !== 'hub_manager') {
        window.location.href = '../auth/login.html';
        return null;
    }
    return user;
}

/* ================================================================
   2. SIDEBAR
   ================================================================ */

function renderSidebar(activePage) {
    const container = document.getElementById('sidebar');
    if (!container) return;

    const user = JSON.parse(sessionStorage.getItem('user')) || {};
    const initials = (user.name || 'HM').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const links = [
        { href: 'dashboard.html',          label: 'Dashboard',              icon: iconGrid() },
        { href: 'order-queue.html',        label: 'Order Queue',            icon: iconBox() },
        { href: 'dispatch.html',           label: 'Dispatch & Assignment',  icon: iconTruck() },
        { href: 'inter-hub-transfer.html', label: 'Inter-Hub Transfer',     icon: iconTransfer() },
        { href: 'reports.html',            label: 'Reports',                icon: iconChart() }
    ];

    const navHTML = links.map(l =>
        `<a href="${l.href}" class="hm-nav-link${l.href === activePage ? ' active' : ''}">${l.icon}<span>${l.label}</span></a>`
    ).join('');

    container.innerHTML = `
        <div class="hm-sidebar-logo">
            <div class="hm-logo-icon">${iconLogoTruck()}</div>
            <div class="hm-logo-text">Swift<span>Track</span></div>
        </div>
        <nav class="hm-sidebar-nav">${navHTML}</nav>
        <div class="hm-sidebar-footer">
            <div class="hm-user-profile">
                <div class="hm-avatar">${initials}</div>
                <div>
                    <span class="hm-user-name">${user.name || 'Hub Manager'}</span>
                    <span class="hm-user-role">Hub Manager</span>
                </div>
            </div>
            <button class="hm-logout-btn" onclick="handleLogout()">${iconLogout()}<span>Logout</span></button>
        </div>
    `;
}

/* ================================================================
   3. NAVBAR
   ================================================================ */

function renderNavbar(pageTitle) {
    const container = document.getElementById('navbar');
    if (!container) return;

    const user = JSON.parse(sessionStorage.getItem('user')) || {};
    const initials = (user.name || 'HM').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const isDark = document.body.classList.contains('dark');

    container.innerHTML = `
        <span class="hm-navbar-title">${pageTitle}</span>
        <div class="hm-navbar-actions">
            <button class="hm-theme-toggle" onclick="toggleTheme()">
                ${isDark ? iconMoon() : iconSun()}
                <span>${isDark ? 'Dark' : 'Light'}</span>
            </button>
            <button class="hm-notif-btn" onclick="openNotificationsModal()">
                ${iconBell()}
                <span class="hm-notif-badge"></span>
            </button>
            <div class="hm-navbar-user hm-navbar-user-clickable" onclick="openProfileModal()">
                <span class="hm-navbar-user-name">${user.name || 'Hub Manager'}</span>
                <div class="hm-navbar-avatar">${initials}</div>
            </div>
        </div>
    `;

    ensureGlobalModals();
}

/* ================================================================
   4. THEME
   ================================================================ */

function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark');
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Re-render navbar to swap icon
    const titleEl = document.querySelector('.hm-navbar-title');
    if (titleEl) {
        renderNavbar(titleEl.textContent);
    }
}

/* ================================================================
   5. TOAST NOTIFICATIONS
   ================================================================ */

function showToast(message, type) {
    type = type || 'info';
    let container = document.querySelector('.hm-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'hm-toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: iconCheck(),
        error:   iconX(),
        info:    iconInfo()
    };

    const toast = document.createElement('div');
    toast.className = 'hm-toast hm-toast-' + type;
    toast.innerHTML = (icons[type] || '') + '<span>' + message + '</span>';
    container.appendChild(toast);

    setTimeout(function () {
        toast.classList.add('removing');
        setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
}

/* ================================================================
   6. MODAL OPEN / CLOSE
   ================================================================ */

function openModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.add('active');
}

function closeModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('active');
}

// Close on backdrop click
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('hm-modal-overlay') && e.target.classList.contains('active')) {
        e.target.classList.remove('active');
    }
});

// Close on ESC key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        var open = document.querySelector('.hm-modal-overlay.active');
        if (open) open.classList.remove('active');
    }
});

/* ================================================================
   7. STATUS BADGE HELPER
   ================================================================ */

function getStatusBadge(status) {
    var map = {
        'Pending':          'hm-badge-pending',
        'Assigned':         'hm-badge-assigned',
        'Picked Up':        'hm-badge-picked-up',
        'In Transit':       'hm-badge-in-transit',
        'Out for Delivery': 'hm-badge-out-for-delivery',
        'Delivered':        'hm-badge-delivered',
        'Failed':           'hm-badge-failed'
    };
    var cls = map[status] || 'hm-badge-pending';
    return '<span class="hm-badge ' + cls + '">' + status + '</span>';
}

function getAgentBadge(availability) {
    var cls = availability === 'Available' ? 'hm-badge-available' : 'hm-badge-busy';
    return '<span class="hm-badge ' + cls + '">' + availability + '</span>';
}

function getComplaintBadge(status) {
    var map = {
        'Open':        'hm-badge-open',
        'In Progress': 'hm-badge-in-progress',
        'Resolved':    'hm-badge-resolved'
    };
    var cls = map[status] || 'hm-badge-open';
    return '<span class="hm-badge ' + cls + '">' + status + '</span>';
}

/* ================================================================
   8. DATA FILTERS
   ================================================================ */

function filterOrdersByHub(orders) {
    var user = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user')) || {};
    if (!user.hub_id) return [];
    
    // Strict Hub Filter for Review-3
    return orders.filter(function (o) { 
        return o.assigned_hub === user.hub_id || o.pickup_hub_id === user.hub_id;
    });
}

function filterAgentsByHub(agents) {
    var user = JSON.parse(sessionStorage.getItem('user')) || {};
    if (!user.hub_id) return [];
    return agents.filter(function (a) { return a.hub_id === user.hub_id; });
}

function getHubName(hubId) {
    var hub = (window.mockData.hubs || []).find(function (h) { return h.hub_id === hubId; });
    return hub ? hub.name : hubId;
}

function getAgentName(agentId) {
    if (!agentId) return 'Unassigned';
    var agent = (window.mockData.agents || []).find(function (a) { return a.agent_id === agentId; });
    return agent ? agent.name : agentId;
}

/* ================================================================
   9. DATE UTILITIES
   ================================================================ */

function formatDate(isoString) {
    if (!isoString) return 'â€”';
    var d = new Date(isoString);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

function getTimeAgo(isoString) {
    if (!isoString) return 'â€”';
    var now = Date.now();
    var then = new Date(isoString).getTime();
    var diff = Math.floor((now - then) / 1000);

    if (diff < 60)    return diff + 's ago';
    if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}

/* ================================================================
   10. SKELETON LOADER HELPER
   ================================================================ */

function showSkeleton(containerId, rows) {
    rows = rows || 5;
    var el = document.getElementById(containerId);
    if (!el) return;
    var html = '';
    for (var i = 0; i < rows; i++) {
        var w = 60 + Math.floor(Math.random() * 40);
        html += '<div class="hm-skeleton hm-skeleton-row" style="width:' + w + '%"></div>';
    }
    el.innerHTML = html;
}

function showSkeletonBlock(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div class="hm-skeleton hm-skeleton-block"></div>';
}

/* ================================================================
   11. LOGOUT
   ================================================================ */

function handleLogout() {
    if (typeof Auth !== 'undefined') {
        Auth.logout();
    } else {
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
        window.location.href = '../auth/login.html';
    }
}

/* ================================================================
   12. TABLE SORT HELPER
   ================================================================ */

function sortData(data, key, direction) {
    direction = direction || 'asc';
    return data.slice().sort(function (a, b) {
        var valA = a[key];
        var valB = b[key];
        if (valA == null) return 1;
        if (valB == null) return -1;
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

/* ================================================================
   13. FORM VALIDATION
   ================================================================ */

function validateForm(formEl) {
    var fields = formEl.querySelectorAll('[required]');
    var firstError = null;
    var valid = true;

    fields.forEach(function (field) {
        // Clear previous error
        field.classList.remove('input-error');
        var errEl = field.parentElement.querySelector('.hm-field-error');
        if (errEl) errEl.textContent = '';

        var val = field.value.trim();

        if (!val) {
            valid = false;
            field.classList.add('input-error');
            if (errEl) errEl.textContent = 'This field is required';
            if (!firstError) firstError = field;
            return;
        }

        // Email format check
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            valid = false;
            field.classList.add('input-error');
            if (errEl) errEl.textContent = 'Enter a valid email';
            if (!firstError) firstError = field;
        }
    });

    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
    }

    return valid;
}

/* ================================================================
   14. CSV EXPORT HELPER
   ================================================================ */

function exportCSV(data, filename) {
    if (!data || !data.length) return;
    var keys = Object.keys(data[0]);
    var csv = keys.join(',') + '\n';
    data.forEach(function (row) {
        csv += keys.map(function (k) {
            var val = (row[k] == null ? '' : row[k]).toString().replace(/"/g, '""');
            return '"' + val + '"';
        }).join(',') + '\n';
    });

    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (filename || 'export') + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/* ================================================================
   SVG ICON HELPERS (inline, no external deps)
   ================================================================ */

function iconGrid() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
}

function iconBox() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>';
}

function iconTruck() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>';
}

function iconTransfer() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>';
}

function iconChart() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';
}

function iconLogoTruck() {
    return '<svg viewBox="0 0 24 24" fill="white"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>';
}

function iconLogout() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
}

function iconSun() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
}

function iconMoon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
}

function iconBell() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>';
}

function iconCheck() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
}

function iconX() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
}

function iconInfo() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
}

function iconSearch() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
}

function iconClose() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
}

/* ================================================================
   GLOBAL MODALS + DATA HELPERS
   ================================================================ */
function ensureGlobalModals() {
    if (!document.getElementById("hmNotificationsModal")) {
        var notifications = document.createElement("div");
        notifications.id = "hmNotificationsModal";
        notifications.className = "hm-modal-overlay";
        notifications.innerHTML =
            '<div class="hm-modal hm-modal-sm">' +
                '<button class="hm-modal-close" onclick="closeModal(\'hmNotificationsModal\')">' + iconClose() + '</button>' +
                '<div class="hm-modal-title">Notifications</div>' +
                '<div class="hm-modal-body" id="hmNotificationsBody"></div>' +
            '</div>';
        document.body.appendChild(notifications);
    }

    if (!document.getElementById("hmProfileModal")) {
        var profile = document.createElement("div");
        profile.id = "hmProfileModal";
        profile.className = "hm-modal-overlay";
        profile.innerHTML =
            '<div class="hm-modal hm-modal-sm">' +
                '<button class="hm-modal-close" onclick="closeModal(\'hmProfileModal\')">' + iconClose() + '</button>' +
                '<div class="hm-modal-title">Profile</div>' +
                '<div class="hm-modal-body" id="hmProfileBody"></div>' +
                '<div class="hm-modal-footer">' +
                    '<button class="hm-btn hm-btn-ghost" onclick="closeModal(\'hmProfileModal\')">Close</button>' +
                    '<button class="hm-btn hm-btn-primary" onclick="handleLogout()">Logout</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(profile);
    }
}

function getOrderById(orderId) {
    return (window.mockData.orders || []).find(function (o) { return o.order_id === orderId; }) || null;
}

function deriveOrderMeta(order) {
    var str = (order.order_id || "ORD_0").replace(/\D/g, "");
    var n = parseInt(str || "0", 10);
    var distance = (2.4 + ((n % 28) / 5)).toFixed(1);
    var etaMinutes = 12 + (n % 35);
    var phone = order.customer_phone || ("+91 98" + String(10000000 + (n % 89999999)).slice(-8));
    var payment = n % 3 === 0 ? "COD" : "PREPAID";
    return {
        phone: phone,
        distanceKm: distance,
        etaText: etaMinutes + " mins",
        paymentMode: payment
    };
}

function adjustAgentTaskCounts(oldAgentId, newAgentId) {
    var agents = window.mockData.agents || [];
    if (oldAgentId) {
        var oldAgent = agents.find(function (a) { return a.agent_id === oldAgentId; });
        if (oldAgent) oldAgent.tasks_count = Math.max(0, (oldAgent.tasks_count || 0) - 1);
    }
    if (newAgentId) {
        var newAgent = agents.find(function (a) { return a.agent_id === newAgentId; });
        if (newAgent) newAgent.tasks_count = (newAgent.tasks_count || 0) + 1;
    }
}

function setOrderAssignment(orderId, agentId, nextStatus) {
    if (!window.AppState) return false;
    var state = window.AppState.getState();
    var order = state.orders.find(function(o) { return o.order_id === orderId; });
    if (!order) return false;
    
    var previousAgent = order.assigned_agent || null;
    order.assigned_agent = agentId;
    order.status = nextStatus || "Assigned";
    order.updated_at = new Date().toISOString();
    
    window.AppState.saveState(state);
    adjustAgentTaskCounts(previousAgent, agentId);
    console.log("🔵 [HUB MANAGER] Order Assigned to Agent:", agentId);
    try {
        window.dispatchEvent(new Event('appStateChanged'));
        window.dispatchEvent(new StorageEvent('storage', { key: 'swifttrack_central_state', newValue: JSON.stringify(state) }));
    } catch(e) {}
    return true;
}

function setOrderHub(orderId, hubId) {
    if (!window.AppState) return false;
    var state = window.AppState.getState();
    var order = state.orders.find(function(o) { return o.order_id === orderId; });
    if (!order) return false;
    
    order.assigned_hub = hubId;
    order.pickup_address = hubId;
    order.updated_at = new Date().toISOString();
    
    window.AppState.saveState(state);
    return true;
}

function setActionLoading(buttonEl, isLoading, label) {
    if (!buttonEl) return;
    if (isLoading) {
        buttonEl.dataset.oldLabel = buttonEl.innerHTML;
        buttonEl.disabled = true;
        buttonEl.classList.add("hm-btn-loading");
        buttonEl.innerHTML = '<span class="hm-btn-spinner"></span>' + (label || "Processing...");
    } else {
        buttonEl.disabled = false;
        buttonEl.classList.remove("hm-btn-loading");
        if (buttonEl.dataset.oldLabel) buttonEl.innerHTML = buttonEl.dataset.oldLabel;
    }
}

function showSuccessTick(message) {
    var existing = document.getElementById("hmSuccessTick");
    if (existing) existing.remove();
    var wrap = document.createElement("div");
    wrap.id = "hmSuccessTick";
    wrap.className = "hm-success-pop";
    wrap.innerHTML =
        '<div class="hm-success-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' +
        '</div>' +
        '<div class="hm-success-text">' + (message || "Saved successfully") + "</div>";
    document.body.appendChild(wrap);
    setTimeout(function () { wrap.classList.add("show"); }, 10);
    setTimeout(function () {
        wrap.classList.remove("show");
        setTimeout(function () { wrap.remove(); }, 220);
    }, 1800);
}

function openNotificationsModal() {
    ensureGlobalModals();
    var container = document.getElementById("hmNotificationsBody");
    var user = JSON.parse(sessionStorage.getItem("user") || "{}");
    var orders = filterOrdersByHub(window.mockData.orders || []).slice().sort(function (a, b) {
        return new Date(b.updated_at) - new Date(a.updated_at);
    }).slice(0, 6);

    if (!orders.length) {
        container.innerHTML = '<div class="hm-empty-msg">No recent notifications.</div>';
        openModal("hmNotificationsModal");
        return;
    }

    container.innerHTML = orders.map(function (o) {
        return (
            '<div class="hm-notif-item">' +
                '<div class="hm-notif-title">' + o.order_id + " · " + o.status + "</div>" +
                '<div class="hm-notif-sub">' + o.customer_name + " · " + getTimeAgo(o.updated_at) + "</div>" +
                '<div class="hm-notif-sub">Hub: ' + getHubName(user.hub_id || o.pickup_hub_id) + "</div>" +
            "</div>"
        );
    }).join("");
    openModal("hmNotificationsModal");
}

function openProfileModal() {
    ensureGlobalModals();
    var container = document.getElementById("hmProfileBody");
    var user = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
    var initials = (user.name || "HM").split(" ").map(function (w) { return w[0]; }).join("").toUpperCase().slice(0, 2);
    container.innerHTML =
        '<div class="hm-profile-card">' +
            '<div class="hm-profile-avatar">' + initials + "</div>" +
            '<div class="hm-profile-name">' + (user.name || "Hub Manager") + "</div>" +
            '<div class="hm-profile-meta">' + (user.email || "hub@swifttrack.com") + "</div>" +
            '<div class="hm-profile-meta">Hub: ' + getHubName(user.hub_id || "H001") + "</div>" +
            '<div class="hm-profile-meta">Role: Hub Manager</div>' +
        "</div>";
    openModal("hmProfileModal");
}

/* ================================================================
   7. TIME & DATE HELPERS
   ================================================================ */
function getTimeAgo(dateStr) {
    if (!dateStr) return "Just now";
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - d) / 1000); // seconds
        if (diff < 60) return "Just now";
        if (diff < 3600) return Math.floor(diff / 60) + "m ago";
        if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
        return Math.floor(diff / 86400) + "d ago";
    } catch(e) { return "--"; }
}

function formatDate(dateStr) {
    if (!dateStr) return "--";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch(e) { return "--"; }
}

/* ================================================================
   8. CHANGE DESTINATION MODAL LOGIC
   ================================================================ */
function openChangeDestinationModal(orderId) {
    window._cdOrderId = orderId;
    var order = window.mockData.orders.find(function(o) { return o.order_id === orderId; });
    if (!order) return;

    var hubSelect = document.getElementById('cd-hub-select');
    var reasonSelect = document.getElementById('cd-reason-select');
    
    if (hubSelect) {
        var otherHubs = (window.mockData.hubs || []).filter(function(h) {
            return h.hub_id !== order.pickup_hub_id && h.status === 'Active';
        });
        hubSelect.innerHTML = '<option value="">Select new destination hub</option>' + 
            otherHubs.map(function(h) {
                return '<option value="' + h.hub_id + '">' + h.name + '</option>';
            }).join('');
    }

    if (reasonSelect) reasonSelect.value = '';
    
    openModal('changeDestModal');
}

function confirmChangeDestinationAction() {
    var hubSelect = document.getElementById('cd-hub-select');
    var reasonSelect = document.getElementById('cd-reason-select');
    if (!hubSelect || !reasonSelect) return;

    var hubId = hubSelect.value;
    var reason = reasonSelect.value;

    if (!hubId || !reason) {
        showToast('Please select both hub and reason', 'error');
        return;
    }

    if (setOrderHub(window._cdOrderId, hubId)) {
        showSuccessTick('Destination updated');
        showToast('Destination hub updated successfully', 'success');
    }

    closeModal('changeDestModal');

    // Re-render current page
    if (typeof loadDashboard === 'function') loadDashboard();
    if (typeof filterAndRender === 'function') filterAndRender(); // Order Queue
    if (typeof loadDispatchData === 'function') loadDispatchData();
}

function openDeliveryMap(orderId) {
    var order = window.mockData.orders.find(function(o) { return o.order_id === orderId; }) || {};
    var agent = window.mockData.agents.find(function(a) { return a.agent_id === order.agent_id; });

    // Populate modal fields
    var pickupEl = document.querySelector('#map-modal .modal-info-val-pickup');
    var destEl   = document.querySelector('#map-modal .modal-info-val-dest');
    var agentEl  = document.querySelector('#map-modal .modal-info-val-agent');
    var badgeEl  = document.querySelector('#map-modal .modal-agent-badge');

    if (pickupEl) pickupEl.textContent = getHubName(order.pickup_hub_id) || 'â€”';
    if (destEl)   destEl.textContent   = order.delivery_address || 'â€”';
    if (agentEl)  agentEl.textContent  = agent ? agent.name : 'Unassigned';
    if (badgeEl)  badgeEl.textContent  = agent ? agent.name.substring(0, 2).toUpperCase() : '??';

    openModal('map-modal');
}

/* ================================================================
   9. GLOBAL EVENT DELEGATION
   ================================================================ */

document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;

    var action = target.getAttribute('data-action');
    var orderId = target.getAttribute('data-id');

    if (action === 'expand-map') {
        openDeliveryMap(orderId);
    } else if (action === 'change-destination') {
        openChangeDestinationModal(orderId);
    }
});
