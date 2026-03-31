/* js/app.js – Main Application Entry Point */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Auth System (restores session)
  Auth.init();

  // 2. Initialize Navigation (wires menu, restores last view)
  Navigation.init();

  // 3. Initialize Modules that need setup
  if (typeof BookShipment !== 'undefined' && BookShipment.init) {
    BookShipment.init();
  }

  // 4. Attach live validation to the login form
  const loginForm = document.getElementById('login-form');
  if (loginForm && typeof Validator !== 'undefined') {
    Validator.attachLiveValidation(loginForm);
  }

  // 5. Global click listener for closing dropdowns
  document.addEventListener('click', (e) => {
    const isDropdownClick = e.target.closest('.dropdown-panel');
    const isBtnClick = e.target.closest('.icon-btn, .user-profile-btn');
    if (!isDropdownClick && !isBtnClick) {
      document.querySelectorAll('.dropdown-panel').forEach(panel => {
        panel.classList.remove('open');
      });
    }
  });

  // 6. Global App State Toggle
  const user = Auth.currentUser();
  if (user) {
    Auth.applyRoleUI();
  } else {
    // Redirect unauthenticated users
    window.location.replace('auth/login.html');
  }
});

/* ── LOGOUT LOGIC ── */
window.handleLogout = function() {
  Auth.logout();
  if (typeof showToast !== 'undefined') {
    showToast('You have been logged out.');
  }
};

/* ── GLOBAL SEARCH ── */
window.handleGlobalSearch = function() {
  if (typeof Navigation === 'undefined') return;
  const currentView = Navigation.getCurrent();
  const searchInput = document.getElementById('global-search');
  if (!searchInput) return;
  const q = searchInput.value.toLowerCase();
  
  if (currentView === 'orders') {
    const orderSearch = document.getElementById('orders-search');
    if (orderSearch) orderSearch.value = q;
    if (typeof filterTableBySearch !== 'undefined') {
      filterTableBySearch('orders-search', 'orders-table');
    }
  } else if (currentView === 'dashboard') {
    if (typeof filterTableBySearch !== 'undefined') {
      filterTableBySearch('global-search', 'dash-table');
    }
  } else {
    // Navigate to orders and search there if not on a searchable page
    if (q.length > 2 && typeof navigate !== 'undefined') {
      navigate('orders');
      setTimeout(() => {
        const orderSearch = document.getElementById('orders-search');
        if (orderSearch) {
          orderSearch.value = q;
          if (typeof filterTableBySearch !== 'undefined') {
            filterTableBySearch('orders-search', 'orders-table');
          }
        }
      }, 100);
    }
  }
};

/* ── DROPDOWN PANELS ── */
window.toggleDropdown = function(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  
  // Close others first
  document.querySelectorAll('.dropdown-panel').forEach(p => {
    if (p.id !== panelId) p.classList.remove('open');
  });

  // Toggle the requested one
  panel.classList.toggle('open');
};

/* ── INTERACTIVE LIVE CHAT (DUMMY) ── */
window.Chat = {
  send: function() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;

    const history = document.getElementById('chat-history');
    if (!history) return;

    // Clear "Connecting" message
    if (history.innerHTML.includes('Connecting')) {
      history.innerHTML = '';
      history.style.alignItems = 'flex-start';
      history.style.justifyContent = 'flex-start';
      history.style.flexDirection = 'column';
      history.style.padding = '12px';
      history.style.overflowY = 'auto';
    }

    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'align-self: flex-end; background: var(--blue); color: white; padding: 8px 12px; border-radius: 12px 12px 0 12px; max-width: 80%; margin-bottom: 8px; font-size: 13px; line-height: 1.4;';
    userMsg.textContent = msg;
    history.appendChild(userMsg);
    
    input.value = '';
    history.scrollTop = history.scrollHeight;

    // Agent Typing / Auto Response Mock
    setTimeout(() => {
      const agentMsg = document.createElement('div');
      agentMsg.style.cssText = 'align-self: flex-start; background: var(--bg); border: 1px solid var(--border); color: var(--dark); padding: 8px 12px; border-radius: 12px 12px 12px 0; max-width: 80%; margin-bottom: 8px; font-size: 13px; line-height: 1.4;';
      agentMsg.textContent = "Thanks for reaching out! Agent Suresh is reviewing your request and will be with you shortly.";
      history.appendChild(agentMsg);
      history.scrollTop = history.scrollHeight;
    }, 1500);
  },
  
  handleEnter: function(e) {
    if (e.key === 'Enter') {
      this.send();
    }
  }
};
