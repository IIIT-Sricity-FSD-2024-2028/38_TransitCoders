/**
 * Core Application Logic for Customer Portal
 */

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  checkAuth();
  initTheme();
  setupSidebar();
  initDropdowns();
  initNotificationWatcher();
}

function checkAuth() {
  const user = window.CustomerAPI.getCurrentUser();
  if (!user || user.role !== 'customer') {
    // Redirect to login if not a customer
    window.location.href = '../auth/login.html';
  } else {
    // Populate user profile info in the sidebar
    const initials = user.name.substring(0, 2).toUpperCase();
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-avatar').forEach(el => el.textContent = initials);
    // Populate topbar avatar initials
    document.querySelectorAll('.topbar-initials').forEach(el => el.textContent = initials);
  }
}

function initTheme() {
  const body = document.body;
  const isDarkStored = localStorage.getItem("theme") === "dark";
  if (isDarkStored) body.classList.add("dark");
  
  // Update label on load
  const label = document.getElementById("theme-label");
  if (label) label.textContent = isDarkStored ? "Dark" : "Light";

  // Update SVG icon on load
  updateThemeIcon(isDarkStored);
  
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = body.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      
      const lbl = document.getElementById("theme-label");
      if (lbl) lbl.textContent = isDark ? "Dark" : "Light";
      
      updateThemeIcon(isDark);
    });
  }
}

function updateThemeIcon(isDark) {
  const svg = document.getElementById("theme-icon-svg");
  if (!svg) return;
  if (isDark) {
    // Moon icon
    svg.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
  } else {
    // Sun icon
    svg.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  }
}

function setupSidebar() {
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  // Set active link based on current path
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}

window.showToast = function(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Inline styles for the toast component
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.padding = '12px 18px';
  toast.style.borderRadius = 'var(--r)';
  toast.style.fontFamily = "'Poppins', 'Inter', sans-serif";
  toast.style.fontSize = '13px';
  toast.style.fontWeight = '500';
  toast.style.color = '#fff';
  toast.style.backgroundColor = type === 'success' ? 'var(--green)' : 
                                type === 'danger' ? 'var(--red)' : 
                                type === 'warning' ? 'var(--yellow)' :
                                type === 'info' ? 'var(--blue)' : 'var(--dark2)';
  toast.style.zIndex = '10000';
  toast.style.boxShadow = 'var(--shadow-lg)';
  toast.style.animation = 'slideIn 0.3s ease forwards';
  
  // Add animation keyframes if not exists
  if (!document.getElementById('toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.innerHTML = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

window.logout = function() {
  if (window.API && window.API.Token) {
    window.API.Token.clear();
  }
  sessionStorage.removeItem("user");
  localStorage.removeItem("user");
  window.location.href = '../auth/login.html';
};

/* ── DROPDOWN PANELS ── */
function initDropdowns() {
  const user = window.CustomerAPI.getCurrentUser();
  const userName = user ? user.name : 'Customer';
  const userEmail = user ? (user.email || userName.toLowerCase().replace(/\s/g, '') + '@swifttrack.com') : '';
  const initials = userName.substring(0, 2).toUpperCase();

  // ---- Inject Notification Dropdown ----
  const notifWrap = document.getElementById('notif-wrap');
  if (notifWrap && !document.getElementById('notif-panel')) {
    notifWrap.style.position = 'relative';
    const notifPanel = document.createElement('div');
    notifPanel.className = 'dropdown-panel';
    notifPanel.id = 'notif-panel';
    notifPanel.innerHTML = `
      <div class="dropdown-header">
        <div class="dropdown-title">Notifications</div>
        <div class="dropdown-action dropdown-action-orange" id="mark-all-read-btn">Mark all read</div>
      </div>
      <div class="dropdown-list" id="notif-list">
        <div class="notif-item"><div class="notif-content" style="text-align:center;padding:20px;"><div class="notif-desc">No notifications yet.</div></div></div>
      </div>
      <div class="dropdown-footer" onclick="window.location.href='support.html'">View All Notifications</div>
    `;
    notifWrap.appendChild(notifPanel);

    // Mark all read
    document.getElementById('mark-all-read-btn').addEventListener('click', () => {
      if (!window.AppState) return;
      const s = window.AppState.getState();
      if (s.notifications) {
        s.notifications.forEach(n => n.unread = false);
        window.AppState.saveState(s);
      }
      renderNotificationDropdown();
    });

    // Wire the bell button
    const bellBtn = notifWrap.querySelector('.icon-btn');
    if (bellBtn) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        renderNotificationDropdown();
        toggleDropdown('notif-panel');
      });
    }

    // Initial render
    renderNotificationDropdown();
  }

  // ---- Inject User Dropdown ----
  const avatarWrap = document.getElementById('avatar-wrap');
  if (avatarWrap && !document.getElementById('user-panel')) {
    avatarWrap.style.position = 'relative';
    const userPanel = document.createElement('div');
    userPanel.className = 'dropdown-panel user-panel';
    userPanel.id = 'user-panel';
    userPanel.innerHTML = `
      <div class="user-header-dp">
        <div class="user-avatar-lg">${initials}</div>
        <div class="user-name-box">
          <div class="dp-user-name">${userName}</div>
          <div class="dp-user-email">${userEmail}</div>
        </div>
      </div>
      <div class="user-role-badge">
        <div class="user-role-lbl">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
          CUSTOMER
        </div>
      </div>
      <div class="user-menu">
        <button class="user-menu-item" onclick="window.showToast('Profile settings coming soon!', 'info')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span style="flex:1">My Profile</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" color="var(--border)"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="user-menu-item" onclick="window.showToast('Account settings coming soon!', 'info')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          <span style="flex:1">Account Settings</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" color="var(--border)"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div class="divider"></div>
        <button class="user-menu-item logout" onclick="window.logout()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          <span>Log Out</span>
        </button>
      </div>
    `;
    avatarWrap.appendChild(userPanel);

    // Wire the avatar button
    const avatarBtn = avatarWrap.querySelector('.user-profile-btn');
    if (avatarBtn) {
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown('user-panel');
      });
    }
  }

  // ---- Global click-outside-to-close ----
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-panel') && !e.target.closest('.icon-btn') && !e.target.closest('.user-profile-btn')) {
      document.querySelectorAll('.dropdown-panel').forEach(p => p.classList.remove('open'));
    }
  });
}

function toggleDropdown(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  document.querySelectorAll('.dropdown-panel').forEach(p => {
    if (p.id !== panelId) p.classList.remove('open');
  });
  panel.classList.toggle('open');
}
window.toggleDropdown = toggleDropdown;

/* ── LIVE NOTIFICATION RENDERER ── */
function renderNotificationDropdown() {
  const list = document.getElementById('notif-list');
  if (!list || !window.AppState) return;

  const state = window.AppState.getState();
  const notifs = (state.notifications || []).slice(0, 10); // latest 10

  if (notifs.length === 0) {
    list.innerHTML = '<div class="notif-item"><div class="notif-content" style="text-align:center;padding:20px;"><div class="notif-desc">No notifications yet.</div></div></div>';
    updateNotifDot(false);
    return;
  }

  const iconMap = {
    otp:       { cls: 'n-orange', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' },
    delivered: { cls: 'n-green',  svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' },
    transit:   { cls: 'n-blue',   svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>' },
    default:   { cls: 'n-gray',   svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>' }
  };

  let hasUnread = false;
  list.innerHTML = notifs.map(n => {
    const ico = iconMap[n.type] || iconMap.default;
    const ago = timeAgo(n.timestamp);
    if (n.unread) hasUnread = true;
    return `<div class="notif-item">
      <div class="notif-icon ${ico.cls}">${ico.svg}</div>
      <div class="notif-content">
        <div class="notif-title-row">
          <div class="notif-title">${n.title || 'Notification'}</div>
          <div class="notif-time">${n.unread ? '<div class="notif-unread-dot"></div>' : ''}${ago}</div>
        </div>
        <div class="notif-desc">${n.message || ''}</div>
      </div>
    </div>`;
  }).join('');

  updateNotifDot(hasUnread);
}

function updateNotifDot(show) {
  const dot = document.querySelector('.icon-wrap .notif-dot');
  if (dot) dot.style.display = show ? 'block' : 'none';
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

/* ── CROSS-TAB NOTIFICATION WATCHER ── */
var _seenNotifIds = new Set();

function initNotificationWatcher() {
  if (!window.AppState) return;

  // Seed seen IDs with existing notifications so we don't toast old ones
  const state = window.AppState.getState();
  (state.notifications || []).forEach(n => _seenNotifIds.add(n.id));

  // Listen for state changes (same-tab save + cross-tab storage event)
  window.addEventListener('appStateChanged', onStateChanged);
}

function onStateChanged() {
  if (!window.AppState) return;
  const state = window.AppState.getState();
  const notifs = state.notifications || [];

  // Find new notifications we haven't seen
  notifs.forEach(n => {
    if (!_seenNotifIds.has(n.id)) {
      _seenNotifIds.add(n.id);
      // Show toast for OTP notifications
      if (n.type === 'otp') {
        showToast('🔐 ' + n.message, 'warning');
      } else {
        showToast(n.message || n.title, 'info');
      }
    }
  });

  // Refresh the dropdown if it exists
  renderNotificationDropdown();
}
