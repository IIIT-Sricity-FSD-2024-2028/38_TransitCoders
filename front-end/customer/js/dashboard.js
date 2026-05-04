/**
 * Dashboard & Navigation Logic
 * Customer Flow — Interactive Features
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initDashboard();
    initForms();
    initDropdowns();
    initOrdersPage();
    renderOrdersTable();
    renderDashboardHero();
    renderRecentActivity();

    // LIVE UI REFRESH
    window.addEventListener('appStateChanged', () => {
        renderOrdersTable();
        renderDashboardHero();
        renderRecentActivity();
        renderNotifications();
    });

    renderNotifications();
});

/* =========================================================================
   DASHBOARD HERO & ACTIVITY RENDERING
   ========================================================================= */

function renderDashboardHero() {
    const hero = document.querySelector('.tracking-hero');
    if (!hero) return; // Only on dashboard page

    const orders = window.CustomerAPI.getOrders();
    // Get the most recently created order that is not delivered/cancelled, or just the most recent one
    let activeOrder = orders.find(o => !['DELIVERED', 'CANCELLED'].includes(String(o.status).toUpperCase()));
    if (!activeOrder && orders.length > 0) activeOrder = orders[0];

    if (!activeOrder) {
        hero.innerHTML = `
            <div class="hero-status-tag" style="background: var(--surface-default); color: var(--text-subtitle);">
                <i></i> NO ACTIVE ORDERS
            </div>
            <h2 class="hero-title" style="margin-top:16px;">Welcome to SwiftTrack</h2>
            <p class="hero-route" style="margin-bottom:32px;">You don't have any recent shipments to track.</p>
            <a href="tracking.html" class="btn btn-primary" style="border-radius: 50px; padding: 12px 32px;">
                Track by ID <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
            </a>
        `;
        return;
    }

    const st = String(activeOrder.status).toUpperCase();
    const isLive = ['IN TRANSIT', 'OUT FOR DELIVERY'].includes(st);
    
    // Create a generic progress bar based on status
    let progressSteps = ['Origin', 'Transit', 'Destination'];
    let fillWidth = '10%';
    if (st === 'PENDING') fillWidth = '10%';
    else if (st === 'IN TRANSIT') fillWidth = '50%';
    else if (st === 'OUT FOR DELIVERY') fillWidth = '80%';
    else if (st === 'DELIVERED') fillWidth = '100%';

    hero.innerHTML = `
        <div class="hero-status-tag" style="${!isLive ? 'background: var(--surface-default); color: var(--text-subtitle);' : ''}">
            <i></i>
            ${isLive ? 'LIVE TRACKING' : st}
        </div>
        <h2 class="hero-title">Order #${activeOrder.tracking_id || activeOrder.order_id}</h2>
        <p class="hero-route">${activeOrder.pickup_address ? activeOrder.pickup_address.split(',')[0] : 'Origin'} → ${activeOrder.delivery_address || 'Destination'}</p>
        
        <div class="hero-stats">
            <div class="hero-stat-item">
                <span class="label">STATUS</span>
                <div class="value" style="font-size:18px;">${st}</div>
            </div>
            <div class="hero-stat-item">
                <span class="label">AGENT</span>
                <div class="value text-brand" style="font-size:18px;">${activeOrder.assigned_agent ? (activeOrder.assigned_agent === 'U_AGT_102' ? 'Karthik' : 'Assigned') : 'Unassigned'}</div>
            </div>
            <div class="hero-stat-item">
                <span class="label">DATE</span>
                <div class="value" style="font-size:18px;">${new Date(activeOrder.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            </div>
        </div>

        <div class="tracking-progress-container">
            <div class="progress-labels">
                ${progressSteps.map(s => `<span>${s}</span>`).join('')}
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${fillWidth};"></div>
            </div>
        </div>

        <div style="margin-top: 32px;">
            <a href="tracking.html?id=${activeOrder.tracking_id}" class="btn btn-primary" style="border-radius: 50px; padding: 12px 32px;">
                Track Now <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>
            </a>
        </div>
    `;
}

function renderRecentActivity() {
    const container = document.querySelector('.activity-list');
    if (!container) return; // Only on dashboard page

    const orders = window.CustomerAPI.getOrders();
    let activeOrder = orders.find(o => !['DELIVERED', 'CANCELLED'].includes(String(o.status).toUpperCase()));
    if (!activeOrder && orders.length > 0) activeOrder = orders[0];

    if (!activeOrder) {
        container.innerHTML = '<div style="padding: 24px; color: var(--text-subtitle); text-align: center;">No recent activity to display.</div>';
        return;
    }

    // Generate timeline from status history
    let history = activeOrder.status_history || [];
    if (history.length === 0) {
        history = [
            { status: 'Order Created', location: activeOrder.pickup_address || 'System', timestamp: activeOrder.created_at, note: 'Shipment request received.' }
        ];
    }

    // Sort newest first
    const sorted = [...history].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 4);

    container.innerHTML = sorted.map((h, i) => {
        let dotClass = 'dot-white';
        if (i === 0) dotClass = 'dot-orange'; // Latest is orange
        if (String(h.status).toUpperCase() === 'DELIVERED') dotClass = 'dot-green';

        const timeStr = new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });

        return `
            <div class="activity-item">
                <div class="activity-content">
                    <div class="dot ${dotClass}"></div>
                    <div class="activity-details">
                        <h4>${h.status} - ${h.location || 'Hub'}</h4>
                        <p>${h.note || 'Package processed'}</p>
                    </div>
                </div>
                <span class="activity-time">${timeStr}</span>
            </div>
        `;
    }).join('');
}

/* =========================================================================
   NOTIFICATIONS RENDERING (OTP)
   ========================================================================= */

function renderNotifications() {
    // Retry if global UI hasn't injected the panel yet
    const listContainer = document.querySelector('#notif-panel .dropdown-list');
    const badge = document.querySelector('#btn-notif');
    if (!listContainer || !badge) {
        setTimeout(renderNotifications, 100);
        return;
    }

    const state = window.AppState ? window.AppState.getState() : { notifications: [] };
    const notifications = state.notifications || [];
    
    let user = null;
    try { user = JSON.parse(sessionStorage.getItem('user')); } catch(e) {}
    if (!user) try { user = JSON.parse(sessionStorage.getItem('st_session')); } catch(e) {}
    if (!user) return;

    // Filter notifications belonging to the current customer
    const myNotifs = notifications.filter(n => n.customer_name === user.name && n.type === 'otp');

    const unreadCount = myNotifs.filter(n => n.unread).length;

    // Update unread indicator on the bell icon
    let dot = badge.querySelector('.notif-dot');
    if (unreadCount > 0) {
        if (!dot) {
            dot = document.createElement('div');
            dot.className = 'notif-dot';
            dot.style.cssText = 'position:absolute;top:6px;right:6px;width:8px;height:8px;background:var(--danger);border-radius:50%;border:2px solid var(--surface-default);';
            badge.style.position = 'relative';
            badge.appendChild(dot);
        }
    } else {
        if (dot) dot.remove();
    }

    if (myNotifs.length === 0) {
        listContainer.innerHTML = '<div style="padding: 16px; color: var(--text-subtitle); text-align: center; font-size: 13px;">No new notifications</div>';
        return;
    }

    listContainer.innerHTML = myNotifs.map(n => {
        const timeStr = new Date(n.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });
        
        // ── TOAST NOTIFICATION LOGIC ──
        if (n.unread && !n.toastShown) {
            n.toastShown = true;
            if (window.AppState) window.AppState.saveState(state); // Persist toast state
            showGlobalOTPToast(n);
        }

        return `
            <div class="notif-item">
              <div class="notif-icon n-blue" style="background:var(--primary);color:#fff"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
              <div class="notif-content">
                <div class="notif-title-row">
                  <div class="notif-title">${n.title}</div>
                  <div class="notif-time">${timeStr} ${n.unread ? '<div class="notif-unread-dot" style="background:var(--primary)"></div>' : ''}</div>
                </div>
                <div class="notif-desc">${n.message}</div>
              </div>
            </div>
        `;
    }).join('');
}

function showGlobalOTPToast(notification) {
    let container = document.getElementById('global-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'global-toast-container';
        container.style.cssText = 'position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #ffffff;
        border-left: 4px solid var(--primary);
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        border-radius: 8px;
        padding: 16px 20px;
        width: 320px;
        display: flex;
        gap: 16px;
        align-items: flex-start;
        transform: translateX(120%);
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        cursor: pointer;
    `;

    toast.innerHTML = `
        <div style="background: rgba(var(--primary-rgb), 0.1); color: var(--primary); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div style="flex: 1;">
            <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: var(--text-title);">${notification.title}</h4>
            <p style="margin: 0; font-size: 13px; color: var(--text-subtitle); line-height: 1.4;">${notification.message}</p>
        </div>
        <div class="toast-close" style="color: var(--mid); cursor: pointer;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
    `;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => { toast.style.transform = 'translateX(0)'; }, 50);

    // Dismiss logic
    const dismiss = () => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
    };

    toast.querySelector('.toast-close').addEventListener('click', (e) => { e.stopPropagation(); dismiss(); });
    
    // Auto dismiss after 15 seconds
    setTimeout(dismiss, 15000);
}

function renderOrdersTable() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;

    const orders = window.CustomerAPI.getOrders();
    updateStats(orders);

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-subtitle)">You have no active orders.</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => {
        const st = String(order.status).toUpperCase();
        const stClass = st.toLowerCase().replace(/ /g, '-');
        const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        return `
            <tr>
                <td style="font-weight: 700;">${order.tracking_id || order.id}</td>
                <td>${date}</td>
                <td>
                    <div style="font-weight: 500;">${order.pickup_address || 'Origin'}</div>
                    <div style="font-size: 11px; color: var(--text-subtitle);">to ${order.delivery_address}</div>
                </td>
                <td>
                    <span class="status-badge status-${stClass}">${st}</span>
                </td>
                <td>${order.assigned_agent === 'U_AGT_102' ? 'Karthik' : (order.assigned_agent || 'Unassigned')}</td>
                <td>
                    <div class="action-menu-wrapper">
                        <span class="action-menu-btn" onclick="toggleActionMenu(this, event)">⋮</span>
                        <div class="action-context-menu">
                            <div class="action-context-item" onclick="showToast('Viewing order details...', 'info')">
                                <i class="fas fa-eye"></i> View Details
                            </div>
                            <div class="action-context-item" onclick="window.location.href='tracking.html?id=${order.tracking_id}'">
                                <i class="fas fa-location-dot"></i> Track Order
                            </div>
                            <div class="action-context-item" onclick="showToast('Invoice downloaded!', 'success')">
                                <i class="fas fa-download"></i> Download Invoice
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function toggleActionMenu(btn, e) {
    e.stopPropagation();
    const menu = btn.nextElementSibling;
    const isShowing = menu.classList.contains('show');
    document.querySelectorAll('.action-context-menu').forEach(m => m.classList.remove('show'));
    if (!isShowing) menu.classList.add('show');
}

function updateStats(orders) {
    const stats = {
        total: orders.length,
        inTransit: orders.filter(o => ['IN TRANSIT', 'OUT FOR DELIVERY'].includes(String(o.status).toUpperCase())).length,
        delivered: orders.filter(o => String(o.status).toUpperCase() === 'DELIVERED').length,
        pending: orders.filter(o => String(o.status).toUpperCase() === 'PENDING').length
    };

    const cards = document.querySelectorAll('.stat-card .stat-value');
    if (cards.length >= 4) {
        cards[0].textContent = stats.total;
        cards[1].textContent = stats.inTransit;
        cards[2].textContent = stats.delivered;
        cards[3].textContent = stats.pending;
    }
}

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'customer') {
        window.location.href = '../auth/login.html';
    }
}

function initDashboard() {
    // Handle Navigation Toggle (Sidebar Active State)
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    navLinks.forEach(link => {
        if (link.getAttribute('href').includes(currentPage)) {
            link.classList.add('active');
        }
    });



    // Handle Logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('st_session');
            localStorage.removeItem('userRole');
            window.location.href = '../index.html';
        });
    }


}

/* =========================================================================
   DROPDOWN SYSTEM — Notifications, Profile, Filter, Action Menus
   ========================================================================= */

function initDropdowns() {
    // --- Notification Bell ---
    const notifWrapper = document.querySelector('.notification-wrapper');
    if (notifWrapper) {
        const bell = notifWrapper.querySelector('.notification-bell');
        const dropdown = notifWrapper.querySelector('.notification-dropdown');
        const badge = notifWrapper.querySelector('.notification-badge');

        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            dropdown.classList.toggle('show');
        });

        // Mark all read
        const markRead = notifWrapper.querySelector('.mark-read');
        if (markRead) {
            markRead.addEventListener('click', (e) => {
                e.stopPropagation();
                if (badge) badge.style.display = 'none';
                showToast('All notifications marked as read', 'success');
            });
        }
    }

    // --- Profile Avatar ---
    const profileWrapper = document.querySelector('.profile-wrapper');
    if (profileWrapper) {
        const avatar = profileWrapper.querySelector('.avatar-initials');
        const dropdown = profileWrapper.querySelector('.profile-dropdown');

        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            dropdown.classList.toggle('show');
        });
    }

    // --- Filter Button ---
    const filterBtn = document.getElementById('filter-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    if (filterBtn && filterDropdown) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            filterDropdown.classList.toggle('show');
        });

        // Filter option clicks
        const filterOptions = filterDropdown.querySelectorAll('.filter-option');
        filterOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                filterOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                filterDropdown.classList.remove('show');
                const filterValue = option.dataset.filter;
                filterOrdersTable(filterValue);
            });
        });
    }

    // --- Action Menu Buttons (⋮) ---
    const actionBtns = document.querySelectorAll('.action-menu-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            const menu = btn.nextElementSibling;
            if (menu && menu.classList.contains('action-context-menu')) {
                menu.classList.toggle('show');
            }
        });
    });

    // --- Close all dropdowns on click outside ---
    document.addEventListener('click', () => {
        closeAllDropdowns();
    });

    // Prevent dropdown content from closing when clicking inside
    document.querySelectorAll('.notification-dropdown, .profile-dropdown, .filter-dropdown, .action-context-menu').forEach(dd => {
        dd.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
}

function closeAllDropdowns() {
    document.querySelectorAll('.notification-dropdown, .profile-dropdown, .filter-dropdown, .action-context-menu').forEach(dd => {
        dd.classList.remove('show');
    });
}

/* =========================================================================
   ORDERS PAGE — Search & Filter
   ========================================================================= */

function initOrdersPage() {
    const searchInput = document.getElementById('orders-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        filterOrdersTable();
    });
}

// Global filter state
window.currentOrderStatusFilter = 'all';

window.setOrdersFilter = function(status, btn) {
    window.currentOrderStatusFilter = status;
    
    // Update active button
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    filterOrdersTable();
};

window.filterOrdersTable = function() {
    const table = document.getElementById('orders-table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    let visibleCount = 0;
    const status = window.currentOrderStatusFilter || 'all';
    const searchInput = document.getElementById('orders-search');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    rows.forEach(row => {
        // Match status
        let statusMatch = true;
        if (status !== 'all') {
            const badge = row.querySelector('.status-badge');
            if (!badge) {
                statusMatch = false;
            } else {
                const text = badge.textContent.toLowerCase();
                statusMatch = text.includes(status.replace('-', ' '));
                if (status === 'in-transit') statusMatch = text.includes('transit');
            }
        }

        // Match text query
        let textMatch = true;
        if (query) {
            textMatch = row.textContent.toLowerCase().includes(query);
        }

        const match = statusMatch && textMatch;
        row.style.display = match ? '' : 'none';
        if (match) visibleCount++;
    });

    // Show no results message
    let noResults = table.parentElement.querySelector('.no-results');
    if (visibleCount === 0) {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = '<i class="fas fa-filter"></i><p style="margin-top:8px;">No orders found.</p>';
            noResults.style.textAlign = 'center';
            noResults.style.padding = '40px 20px';
            noResults.style.color = 'var(--mid)';
            table.parentElement.appendChild(noResults);
        }
        noResults.style.display = 'block';
    } else if (noResults) {
        noResults.style.display = 'none';
    }
}

/* =========================================================================
   FORMS — Star Rating, Feedback/Complaint Submission
   ========================================================================= */

function initForms() {
    // Star Rating logic
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });

        // Hover effect
        star.addEventListener('mouseenter', () => {
            stars.forEach((s, i) => {
                s.style.color = i <= index ? '#f59e0b' : '';
            });
        });

        star.addEventListener('mouseleave', () => {
            stars.forEach(s => {
                s.style.color = s.classList.contains('active') ? '#f59e0b' : '';
            });
        });
    });

    // Form Submissions
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = feedbackForm.querySelector('input[type="email"]');
            if (emailInput && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()))) {
                showToast('Please enter a valid email address', 'error');
                emailInput.style.borderColor = 'red';
                return;
            }
            if (emailInput) emailInput.style.borderColor = '';

            const stars = feedbackForm.querySelectorAll('.star-btn.active');
            const rating = stars.length || 3;
            const comments = feedbackForm.querySelector('textarea')?.value.trim() || '';
            const orderId = feedbackForm.querySelector('[name="orderId"]')?.value.trim() || undefined;

            try {
                await window.API.feedback.create({ rating, comments, ...(orderId ? { orderId } : {}) });
                showToast('Feedback submitted!', 'success');
            } catch (_) {
                showToast('Feedback submitted (offline)!', 'success');
            }
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
        });
    }

    const complaintForm = document.getElementById('complaint-form');
    if (complaintForm) {
        complaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = complaintForm.querySelector('input[type="email"]');
            if (emailInput && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()))) {
                showToast('Please enter a valid contact email', 'error');
                emailInput.style.borderColor = 'red';
                return;
            }
            if (emailInput) emailInput.style.borderColor = '';

            const description = complaintForm.querySelector('textarea')?.value.trim() || '';
            const orderId = complaintForm.querySelector('[name="orderId"]')?.value.trim() || undefined;

            try {
                await window.API.complaints.create({ description, ...(orderId ? { orderId } : {}) });
                showToast('Complaint filed. We will follow up soon.', 'success');
            } catch (_) {
                showToast('Complaint filed (offline)!', 'success');
            }
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
        });
    }
}

/* =========================================================================
   TOAST NOTIFICATION
   ========================================================================= */

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                padding: 12px 24px;
                border-radius: 8px;
                color: white;
                font-family: 'Poppins', sans-serif;
                font-size: 14px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .toast-info { background: #3b82f6; }
            .toast-success { background: #10b981; }
            .toast-error { background: #ef4444; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* =========================================================================
   THEME SYSTEM
   ========================================================================= */


