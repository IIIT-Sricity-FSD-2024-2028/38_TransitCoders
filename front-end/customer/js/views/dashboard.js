/**
 * Dashboard View Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData();
});

async function loadDashboardData() {
  try {
    const orders = await window.CustomerAPI.getOrders();
    const complaints = await window.CustomerAPI.getComplaints();

    updateStatistics(orders, complaints);
    renderRecentOrders(orders);

  } catch (err) {
    console.error("Error loading dashboard data:", err);
    window.showToast("Failed to load dashboard data.", "danger");
  }
}

function updateStatistics(orders, complaints) {
  const activeOrders = orders.filter(o => 
    o.status !== 'Delivered' && o.status !== 'Cancelled'
  ).length;

  const completedOrders = orders.filter(o => o.status === 'Delivered').length;

  document.getElementById("stat-active-orders").textContent = activeOrders;
  document.getElementById("stat-completed-orders").textContent = completedOrders;

  // Support tickets count
  const ticketEl = document.getElementById("stat-tickets");
  if (ticketEl && complaints) ticketEl.textContent = complaints.length;
}

function renderRecentOrders(orders) {
  const listContainer = document.getElementById("bento-recent-list");
  listContainer.innerHTML = '';

  if (!orders || orders.length === 0) {
    listContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--light); font-size: 13px;">No recent shipments.</div>`;
    return;
  }

  // Populate active shipment card
  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  if (activeOrders.length > 0) {
    const featured = activeOrders[0];
    document.getElementById("bento-tracking-id").textContent = `Order #${featured.tracking_id}`;
    document.getElementById("bento-destination").textContent = featured.delivery_address || 'N/A';
    document.getElementById("bento-status").textContent = featured.status;
    
    const dateEl = document.getElementById("bento-date");
    if (dateEl) {
      dateEl.textContent = new Date(featured.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Calculate progress
    let progress = 10;
    const statLower = featured.status.toLowerCase();
    if (statLower.includes('assign')) progress = 30;
    if (statLower.includes('pick')) progress = 50;
    if (statLower.includes('transit')) progress = 75;
    if (statLower.includes('out')) progress = 90;
    
    const fill = document.getElementById("bento-progress");
    fill.style.width = `${progress}%`;
    
    // Route to details
    document.getElementById("bento-active-shipment").onclick = () => {
      window.location.href = `tracking.html?id=${featured.tracking_id}`;
    };
  } else {
    document.getElementById("bento-tracking-id").textContent = "All Delivered ✓";
    document.getElementById("bento-destination").textContent = "No active deliveries right now.";
    document.getElementById("bento-progress").style.width = '100%';
    document.getElementById("bento-progress").classList.add('success');
  }

  // Populate recent list
  const recentOrders = orders.slice(0, 5);
  recentOrders.forEach(order => {
    const div = document.createElement("div");
    div.className = "table-row";
    div.style.cssText = "padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.15s;";
    div.onmouseenter = () => div.style.backgroundColor = 'var(--bg)';
    div.onmouseleave = () => div.style.backgroundColor = 'transparent';
    div.onclick = () => window.location.href = `orders.html?id=${order.order_id}`;
    
    const dateStr = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Badge class
    let badgeClass = 'pending';
    const s = (order.status || '').toLowerCase();
    if (s.includes('transit') || s.includes('delivery')) badgeClass = 'intransit';
    if (s === 'assigned') badgeClass = 'assigned';
    if (s === 'delivered') badgeClass = 'delivered';
    if (s === 'cancelled') badgeClass = 'cancelled';
    
    div.innerHTML = `
      <div>
        <div style="font-weight: 600; color: var(--orange); font-size: 13px; margin-bottom: 2px;">${order.tracking_id}</div>
        <div style="font-size: 11px; color: var(--mid);">${dateStr} · ${order.delivery_address || 'N/A'}</div>
      </div>
      <span class="badge ${badgeClass}">${order.status}</span>
    `;
    listContainer.appendChild(div);
  });
}
