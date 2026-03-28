/**
 * Dashboard & Navigation Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initDashboard();
    initForms();
    initTheme();
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
    const themeToggle = document.querySelector('.theme-switch');
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

function showToast(message, type = 'info') {
    // Reusing the toast logic from auth.js if needed, or implement local version
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

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
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
