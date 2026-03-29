/**
 * Merchant Flow Logic
 * Handles multi-step form transitions, data persistence, and validation.
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initNavbar();
    initWizard();
    initThemeSwitch();
});

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'merchant') {
        window.location.href = '../auth/login.html';
    }
    // Set merchant name in UI if element exists
    const merchantNameElem = document.querySelector('.merchant-name');
    if (merchantNameElem) merchantNameElem.textContent = user.name || 'Merchant';
}

function initNavbar() {
    // Handle Active Link based on URL
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;
    
    navLinks.forEach(link => {
        if (currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        }
    });

    // Handle Logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = '../auth/login.html';
        });
    }
}

function initWizard() {
    let currentStep = 1;
    const totalSteps = 6;
    const shipmentData = {};

    const nextBtns = document.querySelectorAll('.btn-next');
    const backBtns = document.querySelectorAll('.btn-back');
    const resetBtns = document.querySelectorAll('.btn-reset');
    const stepItems = document.querySelectorAll('.step-item');
    const stepPanes = document.querySelectorAll('.step-pane');

    // Update UI for current step
    function updateWizardUI() {
        // Update Step Indicators
        stepItems.forEach((item, index) => {
            const stepNum = index + 1;
            item.classList.remove('active', 'completed');
            
            if (stepNum === currentStep) {
                item.classList.add('active');
            } else if (stepNum < currentStep) {
                item.classList.add('completed');
            }
        });

        // Update Step Panes
        stepPanes.forEach((pane, index) => {
            pane.classList.toggle('active', (index + 1) === currentStep);
        });

        // Update Buttons
        const backBtn = document.querySelector('.btn-back');
        const nextBtn = document.querySelector('.btn-next');
        const resetBtn = document.querySelector('.btn-reset');
        
        if (backBtn) backBtn.style.display = currentStep === 1 ? 'none' : 'flex';
        if (nextBtn) {
            const nextText = nextBtn.querySelector('span');
            const nextIcon = nextBtn.querySelector('i');
            if (currentStep === totalSteps) {
                if (nextText) nextText.textContent = 'Done';
                if (nextIcon) nextIcon.classList.replace('fa-arrow-right', 'fa-check');
            } else {
                if (nextText) nextText.textContent = 'Next';
                if (nextIcon) nextIcon.classList.replace('fa-check', 'fa-arrow-right');
            }
        }
        if (resetBtn) resetBtn.style.display = currentStep === totalSteps ? 'none' : 'flex';

        // Scroll to top of card
        const card = document.querySelector('.form-wizard-card');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Handle Next Button
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                saveStepData(currentStep);
                if (currentStep < totalSteps) {
                    currentStep++;
                    updateWizardUI();
                    if (currentStep === 6) generateTrackingID();
                } else {
                    // Final Submit Logic
                    showToast('Shipment Created Successfully!', 'success');
                    setTimeout(() => window.location.href = 'dashboard.html', 2000);
                }
            }
        });
    });

    // Handle Back Button
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateWizardUI();
            }
        });
    });

    // Handle Reset Button
    resetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all data in this step?')) {
                const currentPane = document.querySelector(`.step-pane[data-step="${currentStep}"]`);
                const inputs = currentPane.querySelectorAll('input, select, textarea');
                inputs.forEach(input => input.value = '');
            }
        });
    });

    // Volume Calculation logic for Step 3
    const lInput = document.getElementById('pkg-length');
    const bInput = document.getElementById('pkg-breadth');
    const hInput = document.getElementById('pkg-height');
    const volInput = document.getElementById('pkg-volume');

    if (lInput && bInput && hInput) {
        [lInput, bInput, hInput].forEach(inp => {
            inp.addEventListener('input', () => {
                const l = parseFloat(lInput.value) || 0;
                const b = parseFloat(bInput.value) || 0;
                const h = parseFloat(hInput.value) || 0;
                if (l && b && h) {
                    volInput.value = `${l} * ${b} * ${h} = ${l * b * h} cm³`;
                } else {
                    volInput.value = '';
                }
            });
        });
    }

    function validateStep(step) {
        const pane = document.querySelector(`.step-pane[data-step="${step}"]`);
        const requiredFields = pane.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = '#ef4444';
                isValid = false;
            } else {
                field.style.borderColor = '';
            }
        });

        if (!isValid) showToast('Please fill in all required fields', 'error');
        return isValid;
    }

    function saveStepData(step) {
        const pane = document.querySelector(`.step-pane[data-step="${step}"]`);
        const inputs = pane.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            shipmentData[input.id] = input.value;
        });
        localStorage.setItem('tempShipment', JSON.stringify(shipmentData));
    }

    function generateTrackingID() {
        const idElem = document.getElementById('final-tracking-id-inp');
        if (idElem) {
            const randomID = 'TRK' + Math.floor(10000000 + Math.random() * 90000000);
            idElem.value = randomID;
        }
    }
}

// Interactive logic for Orders and Tracking pages
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initTrackSearch();
});

function initFilters() {
    const searchInput = document.getElementById('order-search');
    const statusFilter = document.getElementById('status-filter');
    const ordersTable = document.getElementById('orders-tbody');

    if (!ordersTable || !searchInput || !statusFilter) return;

    function performFilter() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value.toLowerCase();
        const rows = ordersTable.getElementsByTagName('tr');

        Array.from(rows).forEach(row => {
            const orderId = row.cells[0].textContent.toLowerCase();
            const receiver = row.cells[2].textContent.toLowerCase();
            const statusCell = row.cells[3].textContent.toLowerCase();
            
            const matchesSearch = orderId.includes(searchTerm) || receiver.includes(searchTerm);
            const matchesStatus = statusValue === 'all' || statusCell.includes(statusValue.replace('-', ' '));

            row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
        });
    }

    searchInput.addEventListener('input', performFilter);
    statusFilter.addEventListener('change', performFilter);
}

function initTrackSearch() {
    const trackInput = document.getElementById('track-id-input');
    const trackBtn = document.querySelector('.btn-next'); // Used as 'Track' in this page

    if (trackInput && trackBtn && window.location.pathname.includes('tracking.html')) {
        trackBtn.addEventListener('click', () => {
            const id = trackInput.value.trim();
            if (id) {
                showToast(`Searching for shipment ${id}...`, 'info');
                // Simulate loading
                trackBtn.disabled = true;
                trackBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tracking...';
                
                setTimeout(() => {
                    showToast('Shipment record found!', 'success');
                    trackBtn.disabled = false;
                    trackBtn.innerHTML = 'Track Order';
                    // In a real app, update the timeline here
                }, 1500);
            } else {
                showToast('Please enter a valid Tracking ID', 'error');
            }
        });
    }
}

function initThemeSwitch() {
    const themeToggle = document.querySelector('.theme-switch');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeUI();
        });
    }
    updateThemeUI();
}

function updateThemeUI() {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) document.body.classList.add('dark');
    
    const themeLabel = document.querySelector('.theme-switch span');
    const sunIcon = document.querySelector('.icon-light');
    const moonIcon = document.querySelector('.icon-dark');

    if (themeLabel) themeLabel.textContent = isDark ? 'Dark' : 'Light';
    if (sunIcon) sunIcon.style.display = isDark ? 'none' : 'inline-block';
    if (moonIcon) moonIcon.style.display = isDark ? 'inline-block' : 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
