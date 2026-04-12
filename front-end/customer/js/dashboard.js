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

    // LIVE UI REFRESH
    window.addEventListener('appStateChanged', () => {
        renderOrdersTable();
    });
});

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
    const searchInput = document.getElementById('order-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const table = document.getElementById('orders-table');
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const match = text.includes(query);
            row.style.display = match ? '' : 'none';
            if (match) visibleCount++;
        });

        // Show no results message
        let noResults = table.parentElement.querySelector('.no-results');
        if (visibleCount === 0) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.innerHTML = '<i class="fas fa-search"></i><p>No orders match your search.</p>';
                table.parentElement.appendChild(noResults);
            }
            noResults.style.display = 'block';
        } else if (noResults) {
            noResults.style.display = 'none';
        }
    });
}

function filterOrdersTable(status) {
    const table = document.getElementById('orders-table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
            visibleCount++;
            return;
        }

        const badge = row.querySelector('.status-badge');
        if (!badge) return;

        const badgeClasses = badge.className;
        const match = badgeClasses.includes(`status-${status}`);
        row.style.display = match ? '' : 'none';
        if (match) visibleCount++;
    });

    // Show no results message
    let noResults = table.parentElement.querySelector('.no-results');
    if (visibleCount === 0) {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = '<i class="fas fa-filter"></i><p>No orders with this status.</p>';
            table.parentElement.appendChild(noResults);
        }
        noResults.style.display = 'block';
    } else if (noResults) {
        noResults.style.display = 'none';
    }

    // Clear search input when filtering
    const searchInput = document.getElementById('order-search');
    if (searchInput) searchInput.value = '';
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
        feedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Explicit Email Verification
            const emailInput = feedbackForm.querySelector('input[type="email"]');
            if (emailInput && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()))) {
                showToast('Please enter a valid email address', 'error');
                emailInput.style.borderColor = 'red';
                return;
            }
            if (emailInput) emailInput.style.borderColor = '';

            showToast('Feedback submitted successfully!', 'success');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
        });
    }

    const complaintForm = document.getElementById('complaint-form');
    if (complaintForm) {
        complaintForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Explicit Email Verification
            const emailInput = complaintForm.querySelector('input[type="email"]');
            if (emailInput && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()))) {
                showToast('Please enter a valid contact email', 'error');
                emailInput.style.borderColor = 'red';
                return;
            }
            if (emailInput) emailInput.style.borderColor = '';

            showToast('Complaint filed successfully. We will follow up soon.', 'success');
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


