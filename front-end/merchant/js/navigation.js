/* js/navigation.js – SPA Navigation & State Management */

const Navigation = (() => {
  const titles = {
    dashboard:    'Dashboard',
    book:         'Book Shipment',
    orders:       'My Orders',
    track:        'Track Shipment',
    analytics:    'Analytics Report',
    support:      'Support Center',
    'admin-panel':'Admin Panel',
  };

  let current = null;

  function go(id) {
    // Guard: check if view exists
    const viewEl = document.getElementById('view-' + id);
    if (!viewEl) { console.warn(`View "${id}" not found.`); return; }

    // Deactivate all
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item[data-view]').forEach(n => n.classList.remove('active'));

    // Activate target
    viewEl.classList.add('active');
    const navEl = document.querySelector(`[data-view="${id}"]`);
    if (navEl) navEl.classList.add('active');

    // Update topbar title
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = titles[id] || id;

    current = id;

    // Trigger view-specific render
    onNavigate(id);

    // Persist state
    sessionStorage.setItem('st_view', id);
  }

  function onNavigate(id) {
    if (id === 'dashboard')   { Dashboard.render(); }
    if (id === 'orders')      { Orders.render('all'); }
    if (id === 'support')     { Support.renderTickets(); }
    if (id === 'analytics')   { Analytics.render(); }
    if (id === 'admin-panel') { AdminPanel.render(); }
  }

  function getCurrent() { return current; }

  function init() {
    // Wire nav items
    document.querySelectorAll('.nav-item[data-view]').forEach(el => {
      el.addEventListener('click', () => go(el.dataset.view));
    });

    // Restore last view or default
    const saved = sessionStorage.getItem('st_view') || 'dashboard';
    go(saved);
  }

  return { go, getCurrent, init };
})();

// Convenience alias used in inline onclick handlers
function navigate(id) { Navigation.go(id); }
