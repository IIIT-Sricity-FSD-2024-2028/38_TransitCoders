/**
 * SwiftTrack – Global UI Utilities
 * Shared across all actor modules (Customer, Delivery Agent, Super User, Hub Manager)
 * Provides: toggleDropdown, handleLogout, toggleTheme, user profile population
 */

/* ── DROPDOWN TOGGLE (same as Merchant app.js) ── */
window.toggleDropdown = function(panelId) {
  var panel = document.getElementById(panelId);
  if (!panel) return;
  document.querySelectorAll('.dropdown-panel').forEach(function(p) {
    if (p.id !== panelId) p.classList.remove('open');
  });
  panel.classList.toggle('open');
};

/* ── CLOSE DROPDOWNS ON OUTSIDE CLICK ── */
document.addEventListener('click', function(e) {
  var isDropdownClick = e.target.closest('.dropdown-panel');
  var isBtnClick = e.target.closest('.icon-btn, .user-profile-btn');
  if (!isDropdownClick && !isBtnClick) {
    document.querySelectorAll('.dropdown-panel').forEach(function(panel) {
      panel.classList.remove('open');
    });
  }
});

/* ── THEME TOGGLE (exact Merchant logic) ── */
(function() {
  var dark = localStorage.getItem('st_theme') === 'dark' || localStorage.getItem('theme') === 'dark';

  function applyTheme() {
    document.body.classList.toggle('dark', dark);
    var svgEl = document.getElementById('theme-icon-svg');
    var labelEl = document.getElementById('theme-label');
    if (svgEl) {
      if (dark) {
        svgEl.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
      } else {
        svgEl.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
      }
    }
    if (labelEl) {
      labelEl.textContent = dark ? 'Dark' : 'Light';
    }
  }

  window.toggleTheme = function() {
    dark = !dark;
    localStorage.setItem('st_theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    applyTheme();
  };

  applyTheme();
})();

/* ── LOGOUT ── */
if (typeof window.handleLogout === 'undefined') {
  window.handleLogout = function() {
    if (typeof Auth !== 'undefined' && Auth.logout) {
      Auth.logout();
    } else {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '../index.html';
    }
  };
}

/* ── POPULATE USER INFO FROM SESSION ── */
document.addEventListener('DOMContentLoaded', function() {
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem('user')); } catch(e) {}
  if (!user) try { user = JSON.parse(sessionStorage.getItem('st_session')); } catch(e) {}
  if (!user) return;

  var name = user.name || user.fullName || 'User';
  var email = user.email || name.toLowerCase().replace(/\s/g,'') + '@swifttrack.com';
  var role = user.role || 'User';
  var rolePretty = role.replace(/_/g,' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  var initials = name.split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);

  // Sidebar user info
  var sidebarName = document.querySelector('.sidebar-footer .u-name');
  var sidebarRole = document.querySelector('.sidebar-footer .u-role');
  var sidebarAvatar = document.querySelector('.sidebar-footer .user-avatar');
  if (sidebarName) sidebarName.textContent = name;
  if (sidebarRole) sidebarRole.textContent = rolePretty;
  if (sidebarAvatar) sidebarAvatar.textContent = initials;

  // Topbar user panel dropdown
  var dropdownName = document.getElementById('dropdown-name');
  var dropdownEmail = document.getElementById('dropdown-email');
  var dropdownRole = document.getElementById('dropdown-role-label');
  var dropdownAvatar = document.getElementById('dropdown-avatar-initials');
  var topbarAvatar = document.getElementById('topbar-avatar-initials');
  if (dropdownName) dropdownName.textContent = name;
  if (dropdownEmail) dropdownEmail.textContent = email;
  if (dropdownRole) dropdownRole.textContent = rolePretty.toUpperCase();
  if (dropdownAvatar) dropdownAvatar.textContent = initials;
  if (topbarAvatar) topbarAvatar.textContent = initials;

  // Profile panel details
  var profileName = document.getElementById('profile-name');
  var profileEmail = document.getElementById('profile-email');
  var profileFullName = document.getElementById('profile-fullname');
  var profileEmailDetail = document.getElementById('profile-email-detail');
  var profilePhone = document.getElementById('profile-phone');
  if (profileName) profileName.textContent = name;
  if (profileEmail) profileEmail.textContent = email;
  if (profileFullName) profileFullName.textContent = name;
  if (profileEmailDetail) profileEmailDetail.textContent = email;
  if (profilePhone) profilePhone.textContent = user.phone || '+91 98765 43210';

  // Profile panel large avatar
  var profileAvatarInitials = document.getElementById('profile-avatar-initials');
  if (profileAvatarInitials) profileAvatarInitials.textContent = initials;
});
