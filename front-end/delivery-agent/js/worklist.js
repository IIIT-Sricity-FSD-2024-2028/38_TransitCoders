/**
 * Worklist Page — Order rendering, filtering, navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    initCommon();
    initWorklist();
});

let currentFilter = 'all';
let visibleCount = 4; // show 4 initially like the Figma

function initWorklist() {
    updateCounts();
    renderOrders();
    bindFilters();
    bindViewAll();
    updateDeliveryCountText();

    // LIVE UI REFRESH
    window.addEventListener('appStateChanged', () => {
        updateCounts();
        renderOrders();
        updateDeliveryCountText();
    });
    window.addEventListener('storage', (e) => {
        if (e.key === 'swifttrack_central_state') {
            updateCounts();
            renderOrders();
            updateDeliveryCountText();
        }
    });
}

function updateCounts() {
    const counts = DeliveryData.getOrderCounts();
    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-pending').textContent = counts.pending;
    document.getElementById('count-transit').textContent = counts['in-transit'];
    document.getElementById('count-delivered').textContent = counts.delivered;
}

function updateDeliveryCountText() {
    const pending = DeliveryData.getOrderCounts().pending + DeliveryData.getOrderCounts()['in-transit'];
    document.getElementById('delivery-count-text').textContent =
        `You have ${pending} deliveries pending for today.`;
}

function renderOrders() {
    const list = document.getElementById('orders-list');
    const orders = DeliveryData.getOrders(currentFilter);
    const toShow = orders.slice(0, visibleCount);

    list.innerHTML = toShow.map(order => createOrderCard(order)).join('');

    // Show/hide View All button
    const wrapper = document.getElementById('view-all-wrapper');
    if (orders.length > visibleCount) {
        wrapper.style.display = 'block';
    } else {
        wrapper.style.display = 'none';
    }

    // Animate cards
    list.querySelectorAll('.order-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        setTimeout(() => {
            card.style.transition = 'all 0.35s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, i * 80);
    });
}

function createOrderCard(order) {
    const statusLabel = {
        'in-transit': 'In Transit',
        'pending': 'Pending',
        'delivered': 'Delivered'
    }[order.status];

    const statusClass = `badge-${order.status}`;
    const priorityClass = `priority-${order.priority.toLowerCase()}`;

    // Progress line - adjust based on status
    let progressHTML = '';
    if (order.status === 'delivered') {
        progressHTML = `
            <div class="progress-dot"></div>
            <div class="progress-line-solid" style="flex:2"></div>
            <i class="fas fa-truck progress-truck"></i>
            <div class="progress-dot-end"></div>`;
    } else if (order.status === 'in-transit') {
        progressHTML = `
            <div class="progress-dot"></div>
            <div class="progress-line-solid"></div>
            <i class="fas fa-truck progress-truck"></i>
            <div class="progress-line-dashed"></div>
            <div class="progress-dot-end"></div>`;
    } else {
        progressHTML = `
            <div class="progress-dot"></div>
            <i class="fas fa-truck progress-truck"></i>
            <div class="progress-line-dashed" style="flex:2"></div>
            <div class="progress-dot-end"></div>`;
    }

    return `
    <div class="order-card" data-id="${order.id}" onclick="navigateToOrder(${order.id})">
        <div class="order-card-header">
            <span class="order-id">${order.id}</span>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
            ${order.status !== 'delivered' ? `<span class="priority-badge ${priorityClass}">${order.priority}</span>` : ''}
        </div>
        <div class="order-customer">${order.customer}</div>
        <div class="order-progress">${progressHTML}</div>
        <div class="order-route">
            <span class="route-origin">${order.origin}</span>
            <span class="route-dest">${order.destination}</span>
        </div>
        <div class="order-phone">
            <i class="fas fa-phone"></i>
            <span>${order.phone}</span>
        </div>
        <div class="order-meta">
            <div class="order-meta-item">
                <i class="far fa-clock"></i>
                <span>ETA <strong>${order.eta}</strong></span>
            </div>
            <div class="order-meta-item">
                <i class="fas fa-indian-rupee-sign"></i>
                <span><strong>${order.amount}</strong></span>
            </div>
            <div class="order-meta-item">
                <span><strong>${order.distance}</strong></span>
            </div>
        </div>
    </div>`;
}

function bindFilters() {
    document.getElementById('filter-tabs').addEventListener('click', e => {
        const tab = e.target.closest('.filter-tab');
        if (!tab) return;

        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        currentFilter = tab.dataset.filter;
        visibleCount = 4;
        renderOrders();
    });
}

function bindViewAll() {
    document.getElementById('view-all-btn').addEventListener('click', () => {
        visibleCount = 999;
        renderOrders();
    });
}

function navigateToOrder(id) {
    const order = DeliveryData.getOrderById(id);
    if (!order) return;

    if (order.status === 'pending') {
        window.location.href = `delivery-acceptance.html?id=${id}`;
    } else if (order.status === 'in-transit') {
        window.location.href = `verification.html?id=${id}`;
    } else {
        window.location.href = `delivery-confirmation.html?id=${id}`;
    }
}


// React to centralized state changes
window.addEventListener('appStateChanged', initWorklist);