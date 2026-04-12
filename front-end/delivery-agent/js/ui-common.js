/**
 * Delivery Agent Module — Shared UI Utilities
 * Theme toggle, toast, auth check, sidebar, logout, modals
 */

/* ── Auth Check ─────────────────────────────────────────── */
function checkAgentAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'delivery_agent') {
        window.location.href = '../auth/login.html';
    }
    return user;
}

/* ── Theme Management ───────────────────────────────────── */


/* ── Sidebar Active State ───────────────────────────────── */
function initSidebar() {
    const currentPage = window.location.pathname.split('/').pop() || 'worklist.html';
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPage.includes(href.replace('.html', '').replace('./', ''))) {
            link.classList.add('active');
        } else if (href === 'worklist.html' && (currentPage === '' || currentPage === 'index.html')) {
            link.classList.add('active');
        }
    });
}

/* ── Logout ─────────────────────────────────────────────── */
function initLogout() {
    const btn = document.querySelector('.logout-btn');
    if (btn) {
        btn.addEventListener('click', e => {
            e.preventDefault();
            if (typeof Auth !== 'undefined') {
                Auth.logout();
            } else {
                localStorage.removeItem('user');
                window.location.href = '../auth/login.html';
            }
        });
    }
}

/* ── Toast Notification ─────────────────────────────────── */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `da-toast da-toast-${type}`;
    toast.textContent = message;

    if (!document.getElementById('da-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'da-toast-styles';
        style.textContent = `
            .da-toast {
                position: fixed; bottom: 24px; right: 24px;
                padding: 14px 28px; border-radius: 10px;
                color: #fff; font-family: 'Poppins', sans-serif;
                font-size: 14px; font-weight: 500;
                z-index: 10000; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
                animation: daSlideIn 0.35s cubic-bezier(.4,0,.2,1);
            }
            .da-toast-info    { background: #3b82f6; }
            .da-toast-success { background: #10b981; }
            .da-toast-error   { background: #ef4444; }
            .da-toast-warning { background: #f59e0b; }
            @keyframes daSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to   { transform: translateX(0);    opacity: 1; }
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

/* ── Modal Utilities ────────────────────────────────────── */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/* ── URL Params ─────────────────────────────────────────── */
function getUrlParam(key) {
    return new URLSearchParams(window.location.search).get(key);
}

/* ── Common Init ────────────────────────────────────────── */
function initCommon() {
    checkAgentAuth();

    initSidebar();
    initLogout();


}
