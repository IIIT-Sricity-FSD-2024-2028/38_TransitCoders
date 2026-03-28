/**
 * SwiftTrack Interactions & Role Simulation
 */

document.addEventListener('DOMContentLoaded', () => {
    // 0. Initialize Theme
    initTheme();

    // 1. Initialize Interactivity
    initSmoothScroll();
    initStatsStrip();
    initSearchForm();
    initMockCRUD();

    // 2. Mock Data for "Recent Delivery Issues"
    const mockIssues = [
        { id: '#2034', desc: 'Route blocked by traffic accident', agent: 'Rahul K.', status: 'Delayed', statusClass: 'status-delayed' },
        { id: '#2041', desc: 'Recipient not available at address', agent: 'Kavya S.', status: 'Attention', statusClass: 'status-attention' },
        { id: '#2052', desc: 'Incomplete delivery document', agent: 'Imran K.', status: 'Review', statusClass: 'status-review' },
        { id: '#2060', desc: 'Weather delay on main highway', agent: 'Arun P.', status: 'Delayed', statusClass: 'status-delayed' }
    ];

    renderIssues(mockIssues);
});

/**
 * Theme Toggle Logic
 */
function initTheme() {
    const themeSwitch = document.querySelector('.theme-switch');
    const body = document.body;

    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark');
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('click', () => {
            body.classList.toggle('dark');
            const isDark = body.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            // Optional: Update text
            const themeText = themeSwitch.querySelector('span');
            if (themeText) {
                themeText.textContent = isDark ? 'Dark' : 'Light';
            }
        });
    }
}

/**
 * Smooth Scrolling for Anchor Links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Stats Strip Marquee Logic (Simulated)
 */
function initStatsStrip() {
    const statsContainer = document.querySelector('.marquee-content');
    if (!statsContainer) return;
    
    // Duplicate content for seamless loop
    const clone = statsContainer.cloneNode(true);
    statsContainer.parentElement.appendChild(clone);
}

/**
 * Tracking Search Simulation
 */
function initSearchForm() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('tracking-id');
    
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            
            if (!query) {
                showToast('Please enter a valid Tracking ID', 'error');
                return;
            }
            
            // Simulation of Search
            console.log(`Searching for ID: ${query}`);
            showToast(`Searching for shipment ${query}...`, 'info');
            
            // Redirect simulation (in a real app, this would route to a detail page)
            setTimeout(() => {
                alert(`Shipment found! Redirecting to tracking details for ${query}...`);
            }, 1000);
        });
    }
}

/**
 * Table Simulation & CRUD
 */
function renderIssues(issues) {
    const tableBody = document.querySelector('.issues-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    issues.forEach(issue => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div class="table-cell id">${issue.id}</div>
            <div class="table-cell desc">${issue.desc}</div>
            <div class="table-cell agent">${issue.agent}</div>
            <div class="table-cell status">
                <span class="status-badge ${issue.statusClass}">${issue.status}</span>
            </div>
        `;
        tableBody.appendChild(row);
    });
}

function initMockCRUD() {
    // This is where "Delete" or "Add" logic would live for the prototype
    console.log('CRUD simulation initialized.');
}

/**
 * Simple Toast Utility
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
