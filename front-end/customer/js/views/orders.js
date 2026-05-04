/**
 * Orders & Tracking View Logic
 */

let allOrders = [];

document.addEventListener("DOMContentLoaded", () => {
  loadOrders();
  setupEventListeners();

  // Check if an order ID is passed in the URL (e.g. from Dashboard click)
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');
  if (orderId) {
    // Wait a bit for data to load
    setTimeout(() => { openTrackingPanelById(orderId); }, 300);
  }
});

function setupEventListeners() {
  document.getElementById('search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allOrders.filter(o => 
      o.tracking_id.toLowerCase().includes(term) || 
      (o.delivery_address && o.delivery_address.toLowerCase().includes(term))
    );
    renderOrdersGrid(filtered);
  });

  document.getElementById('close-panel-btn').addEventListener('click', closeTrackingPanel);
  document.getElementById('tracking-overlay').addEventListener('click', closeTrackingPanel);
}

async function loadOrders() {
  try {
    allOrders = await window.CustomerAPI.getOrders();
    renderOrdersGrid(allOrders);
  } catch (err) {
    console.error("Error loading orders:", err);
    document.getElementById("orders-grid").innerHTML = 
      `<div style="text-align: center; grid-column: 1 / -1; color: var(--red); font-size: 13px;">Failed to load orders.</div>`;
  }
}

function getBadgeClass(status) {
  status = (status || '').toLowerCase();
  if (status.includes('transit') || status.includes('delivery')) return 'intransit';
  if (status === 'assigned') return 'assigned';
  if (status === 'delivered') return 'delivered';
  if (status === 'cancelled') return 'cancelled';
  return 'pending';
}

function renderOrdersGrid(orders) {
  const container = document.getElementById("orders-grid");
  container.innerHTML = '';

  if (!orders || orders.length === 0) {
    container.innerHTML = `<div style="text-align: center; grid-column: 1 / -1; color: var(--light); padding: 40px; font-size: 13px;">No orders found.</div>`;
    return;
  }

  orders.forEach(order => {
    const card = document.createElement("div");
    card.className = "shipment-card";
    card.onclick = () => openTrackingPanel(order);
    
    const badgeClass = getBadgeClass(order.status);
    const dateStr = new Date(order.created_at).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });

    // Calculate progress
    let progress = 10;
    let pClass = 'primary';
    const statLower = (order.status || '').toLowerCase();
    if (statLower.includes('assign')) progress = 30;
    if (statLower.includes('pick')) progress = 50;
    if (statLower.includes('transit')) progress = 75;
    if (statLower.includes('out')) progress = 90;
    if (statLower.includes('deliver')) { progress = 100; pClass = 'success'; }
    if (statLower.includes('cancel')) { progress = 100; pClass = 'danger'; }

    card.innerHTML = `
      <div class="sc-header">
        <div class="sc-id">${order.tracking_id}</div>
        <span class="badge ${badgeClass}">${order.status}</span>
      </div>
      <div class="sc-body">
        <div class="sc-route">
          <i class="fa-solid fa-location-dot"></i>
          <div class="sc-address">
            <span style="display: block; font-weight: 500; color: var(--dark); margin-bottom: 2px;">Destination</span>
            ${order.delivery_address || 'N/A'}
          </div>
        </div>
        <div style="font-size: 0.8rem; color: var(--light); margin-top: 12px; padding-left: 24px;">
          Ordered on ${dateStr} &bull; ${order.package_type || 'Standard'}
        </div>
      </div>
      <div class="sc-progress-wrapper">
        <div class="sc-progress-bar">
          <div class="sc-progress-fill ${pClass}" style="width: ${progress}%;"></div>
        </div>
        <div class="sc-progress-labels">
          <span>Processing</span>
          <span>Delivered</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function openTrackingPanelById(orderId) {
  const order = allOrders.find(o => o.order_id === orderId || o.tracking_id === orderId);
  if (order) openTrackingPanel(order);
}

function openTrackingPanel(order) {
  document.getElementById('detail-tracking-id').textContent = order.tracking_id;
  document.getElementById('detail-destination').textContent = order.delivery_address || 'N/A';
  
  const badge = document.getElementById('detail-badge');
  badge.className = `badge ${getBadgeClass(order.status)}`;
  badge.textContent = order.status;

  renderTimeline(order);

  // Setup report issue button
  const reportBtn = document.getElementById('btn-raise-issue');
  reportBtn.onclick = () => {
    window.location.href = `support.html?orderId=${order.tracking_id}`;
  };

  document.getElementById('tracking-panel').classList.add('open');
  document.getElementById('tracking-overlay').classList.add('active');
}

function closeTrackingPanel() {
  document.getElementById('tracking-panel').classList.remove('open');
  document.getElementById('tracking-overlay').classList.remove('active');
}

function renderTimeline(order) {
  const container = document.getElementById('tracking-timeline');
  container.innerHTML = '';

  // Standard states progression
  const states = ['Pending', 'Assigned', 'PickedUp', 'In Transit', 'Out for Delivery', 'Delivered'];
  
  // Normalize current status
  let currentStatusStr = (order.status || 'Pending').toLowerCase().replace(/\s/g, '');
  if (currentStatusStr === 'outfordelivery') currentStatusStr = 'out for delivery';
  if (currentStatusStr === 'intransit') currentStatusStr = 'in transit';
  if (currentStatusStr === 'pickedup') currentStatusStr = 'pickedup'; // just for matching
  
  // Custom matching index
  let currentIndex = 0;
  if (currentStatusStr.includes('assign')) currentIndex = 1;
  else if (currentStatusStr.includes('pick')) currentIndex = 2;
  else if (currentStatusStr.includes('transit')) currentIndex = 3;
  else if (currentStatusStr.includes('out')) currentIndex = 4;
  else if (currentStatusStr.includes('deliver')) currentIndex = 5;

  if (currentStatusStr.includes('cancel')) {
    // Special case for cancelled
    container.innerHTML = `
      <div class="timeline-item active">
        <div class="timeline-marker"><i class="fa-solid fa-xmark"></i></div>
        <div class="timeline-content">
          <h4>Cancelled</h4>
          <p>This order has been cancelled.</p>
        </div>
      </div>
    `;
    return;
  }

  const icons = [
    'fa-solid fa-box',
    'fa-solid fa-user-check',
    'fa-solid fa-people-carry-box',
    'fa-solid fa-truck-fast',
    'fa-solid fa-motorcycle',
    'fa-solid fa-box-check'
  ];

  states.forEach((state, index) => {
    // Don't show future states beyond "In Transit" if it's still assigned to avoid clutter? 
    // Actually, showing grayed out future states is good for UX.
    
    let stateClass = '';
    if (index < currentIndex) stateClass = 'completed';
    else if (index === currentIndex) stateClass = 'active';

    let dateHint = '';
    if (index === 0) {
      dateHint = new Date(order.created_at).toLocaleDateString();
    } else if (index === currentIndex && index === 5) {
      dateHint = 'Today';
    }

    const html = `
      <div class="timeline-item ${stateClass}">
        <div class="timeline-marker"><i class="${icons[index]}"></i></div>
        <div class="timeline-content">
          <h4>${state}</h4>
          <p>${dateHint}</p>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
  });
}
