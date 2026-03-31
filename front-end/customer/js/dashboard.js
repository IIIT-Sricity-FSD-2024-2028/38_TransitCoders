/**
 * Dashboard & Navigation Logic
 * Customer Flow — Interactive Features
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initDashboard();
    initForms();
    initTheme();
    initDropdowns();
    initOrdersPage();
});

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

    // Handle Theme Toggle
    const themeToggle = document.querySelector('.theme-switch-wrapper');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            toggleTheme();
            updateDashboardThemeIcons();
        });
    }

    // Handle Logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = '../auth/login.html';
        });
    }

    updateDashboardThemeIcons();
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
            showToast('Feedback submitted successfully!', 'success');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
        });
    }

    const complaintForm = document.getElementById('complaint-form');
    if (complaintForm) {
        complaintForm.addEventListener('submit', (e) => {
            e.preventDefault();
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

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
    updateDashboardThemeIcons();
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function updateDashboardThemeIcons() {
    const isDark = document.body.classList.contains('dark');
    const themeLabel = document.querySelector('.theme-status');
    const sunIcon = document.querySelector('.icon-light');
    const moonIcon = document.querySelector('.icon-dark');

    if (themeLabel) themeLabel.textContent = isDark ? 'Dark' : 'Light';
    if (sunIcon) sunIcon.style.display = isDark ? 'none' : 'inline-block';
    if (moonIcon) moonIcon.style.display = isDark ? 'inline-block' : 'none';
}
