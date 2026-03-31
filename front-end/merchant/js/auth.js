/* js/auth.js – Authentication & Role-Based Access Control */

const Auth = (() => {

  /* ── ROLE DEFINITIONS ── */
  const ROLES = {
    superuser: {
      label:   'Super User',
      navItems: ['dashboard','book','orders','track','analytics','support','admin-panel'],
      canCRUD:  () => true,   // full CRUD everywhere
    },
    admin: {
      label:   'Admin',
      navItems: ['dashboard','book','orders','track','analytics','support'],
      canCRUD:  (resource) => ['tickets','orders'].includes(resource), // operational only
    },
    merchant: {
      label:   'Merchant',
      navItems: ['dashboard','book','orders','track','analytics','support'],
      canCRUD:  (resource) => ['own-shipments','own-tickets'].includes(resource),
    },
    hub_manager: {
      label:   'Hub Manager',
      navItems: [],
      canCRUD:  (resource) => false,
    },
    customer: {
      label:   'Customer',
      navItems: [],
      canCRUD:  (resource) => false,
    },
  };

  /* ── INIT: restore session ── */
  function init() {
    MockDB.restoreSession();
  }

  /* ── CURRENT USER ── */
  function currentUser() {
    const s = sessionStorage.getItem('st_session');
    return s ? JSON.parse(s) : null;
  }
  function currentRole() { return currentUser()?.role || null; }

  /* ── CHECK PERMISSIONS ── */
  function can(resource) {
    const role = currentRole();
    if (!role) return false;
    return ROLES[role]?.canCRUD(resource) ?? false;
  }
  function isSuperUser() { const r = currentRole(); return r === 'superuser' || r === 'admin'; }
  function isAdmin()     { const r = currentRole(); return r === 'admin' || r === 'hub_manager'; }
  function isMerchant()  { return currentRole() === 'merchant'; }

  /* ── APPLY ROLE-BASED UI ── */
  function applyRoleUI() {
    const user = currentUser();
    if (!user) return;
    const role = user.role;
    const allowed = ROLES[role]?.navItems || [];

    // Show/hide nav items
    document.querySelectorAll('.nav-item[data-view]').forEach(el => {
      const view = el.dataset.view;
      el.style.display = allowed.includes(view) ? '' : 'none';
    });

    // Show/hide role-gated elements
    document.querySelectorAll('[data-role]').forEach(el => {
      const requiredRole = el.dataset.role;
      el.style.display = (requiredRole === role || requiredRole === 'all') ? '' : 'none';
    });

    // Superuser-only elements
    document.querySelectorAll('[data-superuser-only]').forEach(el => {
      el.style.display = isSuperUser() ? '' : 'none';
    });

    // Update user pill
    const avatarEl = document.getElementById('user-avatar-text');
    const nameEl   = document.getElementById('user-name-text');
    const roleEl   = document.getElementById('user-role-text');
    if (avatarEl) avatarEl.textContent = user.avatar;
    if (nameEl)   nameEl.textContent   = user.name;
    if (roleEl)   roleEl.textContent   = ROLES[role]?.label + ' · ' + user.company;
  }

  /* ── LOGIN ── */
  function login(email, password) {
    const user = MockDB.login(email, password);
    if (user) {
      applyRoleUI();
      return user;
    }
    return null;
  }

  /* ── LOGOUT ── */
  function logout() {
    MockDB.logout();
    if (window.location.pathname.includes('/auth/')) {
      window.location.replace('login.html');
    } else {
      window.location.replace('auth/login.html');
    }
  }

  return { init, login, logout, currentUser, currentRole, can, isSuperUser, isAdmin, isMerchant, applyRoleUI, ROLES };
})();
