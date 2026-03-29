/**
 * Authentication Module Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initTheme();
});

function initAuth() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const themeToggle = document.querySelector('.theme-switch');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin(loginForm);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleRegister(registerForm);
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

async function handleLogin(form) {
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;

    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    showToast('Signing in...', 'info');

    setTimeout(() => {
        // Dynamic lookup from mockData — works for ANY user added to mockData.users
        const users = (window.mockData && window.mockData.users) || [];
        const matchedUser = users.find(u => u.email === email && u.password === password && u.active);

        if (!matchedUser) {
            showToast('Invalid credentials', 'error');
            return;
        }

        showToast('Login successful!', 'success');

        // Build user session data
        const userData = {
            user_id: matchedUser.user_id,
            name: matchedUser.name,
            email: matchedUser.email,
            role: matchedUser.role,
            hub_id: matchedUser.hub_id || null,
            active: matchedUser.active
        };

        // Store in both localStorage and sessionStorage
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('user', JSON.stringify(userData));

        // Route based on role — add new roles here as needed
        const routeMap = {
            'super_user':  '../index.html',
            'hub_manager': '../hub-manager/dashboard.html',
            'merchant':    '../merchant/dashboard.html',
            'customer':    '../customer/dashboard.html',
            'agent':       '../agent/dashboard.html'
        };

        const destination = routeMap[matchedUser.role] || '../index.html';
        setTimeout(() => window.location.href = destination, 1500);
    }, 1000);
}

async function handleRegister(form) {
    const firstName = form.querySelector('#first-name').value;
    const lastName = form.querySelector('#last-name').value;
    const email = form.querySelector('#email').value;
    const password = form.querySelector('#password').value;
    const terms = form.querySelector('#terms')?.checked;

    if (!firstName || !lastName || !email || !password) {
        showToast('Please fill in required fields', 'error');
        return;
    }

    if (terms === false) {
        showToast('Please agree to terms & conditions', 'error');
        return;
    }

    showToast('Creating account...', 'info');
    
    setTimeout(() => {
        showToast('Account created! Please sign in.', 'success');
        setTimeout(() => window.location.href = 'login.html', 1500);
    }, 1000);
}

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

function initTheme() {
    const body = document.body;
    const savedTheme = localStorage.getItem('theme');
    const themeLabels = document.querySelectorAll('.theme-switch span');
    const sunIcons = document.querySelectorAll('.icon-light');
    const moonIcons = document.querySelectorAll('.icon-dark');
    
    if (savedTheme === 'dark') {
        body.classList.add('dark');
        themeLabels.forEach(label => label.textContent = 'Dark');
        sunIcons.forEach(icon => icon.style.display = 'none');
        moonIcons.forEach(icon => icon.style.display = 'inline-block');
    } else {
        body.classList.remove('dark');
        themeLabels.forEach(label => label.textContent = 'Light');
        sunIcons.forEach(icon => icon.style.display = 'inline-block');
        moonIcons.forEach(icon => icon.style.display = 'none');
    }
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('dark');
    const themeLabels = document.querySelectorAll('.theme-switch span');
    const sunIcons = document.querySelectorAll('.icon-light');
    const moonIcons = document.querySelectorAll('.icon-dark');
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeLabels.forEach(label => label.textContent = isDark ? 'Dark' : 'Light');
    
    sunIcons.forEach(icon => icon.style.display = isDark ? 'none' : 'inline-block');
    moonIcons.forEach(icon => icon.style.display = isDark ? 'inline-block' : 'none');
}
