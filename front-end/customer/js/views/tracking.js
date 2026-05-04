/**
 * Tracking View Logic
 */

let allOrders = [];

document.addEventListener("DOMContentLoaded", () => {
  loadAllOrders();
  setupTracking();

  // Auto-track if ID passed in URL
  const urlParams = new URLSearchParams(window.location.search);
  const trackId = urlParams.get('id');
  if (trackId) {
    document.getElementById('tracking-input').value = trackId;
    setTimeout(() => performTrack(trackId), 400);
  }
});

async function loadAllOrders() {
  try {
    allOrders = await window.CustomerAPI.getOrders();
  } catch (err) {
    console.error("Error loading orders for tracking:", err);
  }
}

function setupTracking() {
  const btn = document.getElementById('btn-track');
  const input = document.getElementById('tracking-input');

  btn.addEventListener('click', () => {
    const id = input.value.trim();
    if (!id) {
      window.showToast("Please enter a tracking ID.", "warning");
      return;
    }
    performTrack(id);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btn.click();
    }
  });
}

function performTrack(trackingId) {
  const order = allOrders.find(o =>
    o.tracking_id === trackingId ||
    o.order_id === trackingId ||
    o.tracking_id?.toLowerCase() === trackingId.toLowerCase()
  );

  const resultEl = document.getElementById('tracking-result');
  const emptyEl = document.getElementById('tracking-empty');

  if (!order) {
    resultEl.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  resultEl.style.display = 'block';

  // Populate overview
  document.getElementById('track-id').textContent = order.tracking_id;
  document.getElementById('track-destination').textContent = order.delivery_address || 'N/A';
  document.getElementById('track-origin').textContent = order.pickup_address || order.hub_id || 'Hub';
  document.getElementById('track-package').textContent = order.package_type || 'Standard';
  document.getElementById('track-date').textContent = new Date(order.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  // Badge
  const badge = document.getElementById('track-badge');
  badge.textContent = order.status;
  badge.className = 'badge ' + getBadgeClass(order.status);

  // Progress
  let progress = 10;
  let pClass = 'primary';
  const s = (order.status || '').toLowerCase();
  if (s.includes('assign')) progress = 25;
  if (s.includes('pick')) progress = 45;
  if (s.includes('transit')) progress = 65;
  if (s.includes('out')) progress = 85;
  if (s.includes('deliver')) { progress = 100; pClass = 'success'; }
  if (s.includes('cancel')) { progress = 100; pClass = 'danger'; }

  const fill = document.getElementById('track-progress');
  fill.style.width = `${progress}%`;
  fill.className = `sc-progress-fill ${pClass}`;

  // Agent info
  const agentName = order.agent_name || order.delivery_agent || 'Not Assigned';
  document.getElementById('track-agent-name').textContent = agentName;
  document.getElementById('track-agent-avatar').textContent = agentName !== 'Not Assigned' ? agentName.substring(0, 2).toUpperCase() : '—';
  document.getElementById('track-agent-phone').textContent = order.agent_phone || 'No contact info';

  // Report issue
  document.getElementById('btn-report-issue').onclick = () => {
    window.location.href = `support.html?orderId=${order.tracking_id}`;
  };

  // Render timeline
  renderTimeline(order);
}

function getBadgeClass(status) {
  status = (status || '').toLowerCase();
  if (status.includes('transit') || status.includes('delivery')) return 'intransit';
  if (status === 'assigned') return 'assigned';
  if (status === 'delivered') return 'delivered';
  if (status === 'cancelled') return 'cancelled';
  return 'pending';
}

function renderTimeline(order) {
  const container = document.getElementById('tracking-timeline');
  container.innerHTML = '';

  const states = ['Order Placed', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
  const icons = [
    'fa-solid fa-box',
    'fa-solid fa-user-check',
    'fa-solid fa-people-carry-box',
    'fa-solid fa-truck-fast',
    'fa-solid fa-motorcycle',
    'fa-solid fa-circle-check'
  ];

  const currentStatusStr = (order.status || 'Pending').toLowerCase();

  let currentIndex = 0;
  if (currentStatusStr.includes('assign')) currentIndex = 1;
  else if (currentStatusStr.includes('pick')) currentIndex = 2;
  else if (currentStatusStr.includes('transit')) currentIndex = 3;
  else if (currentStatusStr.includes('out')) currentIndex = 4;
  else if (currentStatusStr.includes('deliver')) currentIndex = 5;

  if (currentStatusStr.includes('cancel')) {
    container.innerHTML = `
      <div class="timeline-step active">
        <div class="tl-icon" style="background: var(--red);"></div>
        <div class="tl-content">
          <div class="tl-title">Order Cancelled</div>
          <div class="tl-time">This order has been cancelled.</div>
        </div>
      </div>
    `;
    return;
  }

  states.forEach((state, index) => {
    let stateClass = '';
    if (index < currentIndex) stateClass = 'completed';
    else if (index === currentIndex) stateClass = 'active';

    let dateHint = '';
    if (index === 0) {
      dateHint = new Date(order.created_at).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } else if (index <= currentIndex) {
      dateHint = 'Completed';
    }

    container.innerHTML += `
      <div class="timeline-step ${stateClass}">
        <div class="tl-icon"></div>
        <div class="tl-content">
          <div class="tl-title"><i class="${icons[index]}" style="margin-right: 8px; font-size: 12px; color: ${stateClass ? 'var(--orange)' : 'var(--light)'};"></i>${state}</div>
          <div class="tl-time">${dateHint}</div>
        </div>
      </div>
    `;
  });
}
