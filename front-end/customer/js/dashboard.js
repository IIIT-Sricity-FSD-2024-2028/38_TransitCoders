/**
 * Dashboard & Navigation Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initDashboard();
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
