/**
 * SwiftTrack Interactions & Role Simulation
 */

document.addEventListener('DOMContentLoaded', () => {
    // 0. Initialize Theme
    initTheme();

    // 1. Initialize Interactivity
    initSmoothScroll();
    initStatsStrip();
    initTracking();
    initScrollReveal();
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
    const statsContainer = document.querySelector('.marquee');
    if (!statsContainer) return;
    
    // Duplicate content for seamless loop
    const clone = statsContainer.cloneNode(true);
    statsContainer.parentElement.appendChild(clone);
}

/**
 * Modern Tracking Simulation
 */
function initTracking() {
    const mockData = {
        "ST-20481": { id: "ST-20481", status: "In Transit", hub: "Bengaluru Hub", eta: "2h 15m", step: 3, color: "#f97316" },
        "ST-30291": { id: "ST-30291", status: "Processing", hub: "Chennai Hub", eta: "5h 40m", step: 1, color: "#2563eb" },
        "ST-10042": { id: "ST-10042", status: "Delivered", hub: "Destination Branch", eta: "Completed", step: 4, color: "#059669" }
    };

    const trackBtn = document.getElementById('track-btn');
    const trackInput = document.getElementById('tracking-input');
    const trackResult = document.getElementById('tracking-result');
    const trackError = document.getElementById('tracking-error');
    const trackLine = document.getElementById('trk-progress-line');

    if (!trackBtn || !trackInput) return;

    const handleTrack = () => {
        const id = trackInput.value.trim().toUpperCase();
        if (mockData[id]) {
            const data = mockData[id];
            trackError.style.display = 'none';
            trackResult.style.display = 'block';
            
            // Reset state
            if (trackLine) trackLine.style.width = '0%';
            for (let i = 1; i <= 4; i++) {
                const step = document.getElementById(`step-${i}`);
                if (step) {
                    step.classList.remove('active', 'current');
                }
            }
            
            // Re-populate text
            document.getElementById('res-id').innerText = data.id;
            document.getElementById('res-hub').innerText = data.hub;
            document.getElementById('res-eta').innerText = data.eta;
            
            const badge = document.getElementById('res-status-badge');
            badge.innerText = data.status;
            badge.style.backgroundColor = `${data.color}22`;
            badge.style.color = data.color;

            // Trigger animations after a tiny delay for aesthetic effect
            setTimeout(() => {
                if (trackLine) {
                    const percentage = ((data.step - 1) / 3) * 100;
                    trackLine.style.width = `${percentage}%`;
                }

                for (let i = 1; i <= 4; i++) {
                    const step = document.getElementById(`step-${i}`);
                    if (step) {
                        if (i <= data.step) step.classList.add('active');
                        if (i === data.step) step.classList.add('current');
                    }
                }
            }, 50);

        } else if (id) {
            trackResult.style.display = 'none';
            trackError.style.display = 'block';
        }
    };

    trackBtn.addEventListener('click', handleTrack);
    trackInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleTrack();
    });
}

/**
 * Scroll Reveal Animation (AI Workflow)
 */
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.wf-step-alt').forEach(el => observer.observe(el));
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
