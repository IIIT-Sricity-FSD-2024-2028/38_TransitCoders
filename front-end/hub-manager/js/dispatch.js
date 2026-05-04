var currentOrders = [];
var currentAgents = [];

function initPage() {
  if (!checkSession()) return;

  renderSidebar("dispatch.html");
  renderNavbar("Dispatch & Assignment Control");
  loadDispatchData();

  // Live reactivity
  window.addEventListener('appStateChanged', loadDispatchData);
}

function loadDispatchData() {
  currentOrders = filterOrdersByHub(window.mockData.orders || []);
  currentAgents = filterAgentsByHub(window.mockData.agents || []);
  renderDispatchStats();
  renderAttentionCard();
}

function renderDispatchStats() {
  var g = document.getElementById("dispatchStats");
  if (!g) return;
  var total = currentOrders.length;
  var pending = currentOrders.filter(function (o) { return o.status === window.SwiftTrackEnums.OrderStatus.PENDING; }).length;
  var highPriority = currentOrders.filter(function (o) { return calculatePriority(o) === "HIGH"; }).length;
  var autoAssigned = total - pending;

  var stats = [
    { icon: "blue", label: "Auto Assigned Orders", value: autoAssigned, sub: "System assigned successfully", svg: iconRefresh() },
    { icon: "orange", label: "Pending Assignments", value: pending, sub: "Require manual review", svg: iconClipboard() },
    { icon: "red", label: "High Priority Orders", value: highPriority, sub: "Immediate dispatch needed", svg: iconAlert() }
  ];
  g.innerHTML = stats.map(function (s) {
    return '<div class="hm-dstat-card"><div class="hm-dstat-icon ' + s.icon + '">' + s.svg + '</div><div class="hm-dstat-title">' + s.label + '</div><div class="hm-dstat-val">' + s.value + '</div><div class="hm-dstat-sub">' + s.sub + "</div></div>";
  }).join("");
}

function renderAttentionCard() {
  var c = document.getElementById("attentionContainer");
  if (!c) return;
  var order = currentOrders.find(function (o) { return o.status === window.SwiftTrackEnums.OrderStatus.PENDING; });
  if (!order) {
    c.innerHTML = '<div class="hm-empty-state"><div class="hm-empty-title">No Pending Orders</div><div class="hm-empty-msg">All orders have been assigned.</div></div>';
    return;
  }
  var meta = deriveOrderMeta(order);
  c.innerHTML =
    '<div class="hm-attn-card">' +
      '<div class="hm-attn-header"><span class="hm-attn-id">' + order.order_id + '</span><span class="hm-pill hm-pill-pending">• ' + order.status.toUpperCase() + '</span><span class="hm-pill hm-pill-high">' + calculatePriority(order) + "</span></div>" +
      '<div class="hm-attn-details">Customer: ' + order.customer_name + '<br><span>Assigned Agent: ' + getAgentName(order.assigned_agent) + " · " + meta.etaText + "</span></div>" +
      '<div class="hm-timeline">' +
        '<div class="hm-tl-row"><div class="hm-tl-icon">' + iconMapPin() + '</div><div><div class="hm-tl-label">Pick Up Hub</div><div class="hm-tl-value">' + getHubName(order.pickup_hub_id) + "</div></div></div>" +
        '<div class="hm-tl-row"><div class="hm-tl-icon">' + iconNavigation() + '</div><div><div class="hm-tl-label">Delivery Location</div><div class="hm-tl-value">' + order.delivery_address + "</div></div></div>" +
        '<div class="hm-tl-row"><div class="hm-tl-icon">' + iconPhone() + '</div><div><div class="hm-tl-label">Customer Phone</div><div class="hm-tl-value">' + meta.phone + "</div></div></div>" +
      "</div>" +
      '<div class="hm-attn-actions"><button class="hm-btn-rounded primary" onclick="openOverrideModal(\'' + order.order_id + '\')">Override Assignment</button><button class="hm-btn-rounded outline" onclick="viewOrderDetail(\'' + order.order_id + '\')">View Details</button></div>' +
    "</div>";
}

function calculatePriority(order) {
  if (order.status === window.SwiftTrackEnums.OrderStatus.PENDING) return "HIGH";
  if (order.status === window.SwiftTrackEnums.OrderStatus.ASSIGNED || order.status === window.SwiftTrackEnums.OrderStatus.IN_TRANSIT) return "MEDIUM";
  return "LOW";
}

function openOverrideModal(orderId) {
  var order = getOrderById(orderId);
  if (!order) return;
  window._overrideOrderId = orderId;
  window._overrideAgentId = null;
  var agents = filterAgentsByHub(window.mockData.agents || []);
  var body = document.getElementById("overrideModalBody");
  body.innerHTML =
    '<p style="margin-bottom:16px;color:var(--text-subtitle);font-size:13px;">Hub manager can manually override auto assignment when needed.</p>' +
    '<div class="modal-info-card"><div><div class="modal-info-label">ORDER ID</div><div class="modal-info-val">' + order.order_id + '</div></div><div><div class="modal-info-label">DELIVERY LOCATION</div><div class="modal-info-val" style="font-size:12px;">' + order.delivery_address + "</div></div></div>" +
    '<div class="modal-section-label">Available Delivery Agents</div>' +
    agents.map(function (a) {
      return '<div class="modal-agent-card" onclick="selectOverrideAgent(this,\'' + a.agent_id + '\')" style="margin-bottom:8px;"><div class="modal-agent-info"><div class="modal-agent-name">' + a.name + '</div><div class="modal-agent-meta"><div class="modal-meta-item">' + a.vehicle_type + '</div><div class="modal-agent-tasks ' + ((a.tasks_count || 0) <= 1 ? "green" : "orange") + '">' + (a.tasks_count || 0) + " active tasks</div></div></div><button class=\"hm-btn-small\">Assign</button></div>";
    }).join("");
  openModal("overrideModal");
}

function selectOverrideAgent(el, agentId) {
  document.querySelectorAll("#overrideModalBody .modal-agent-card").forEach(function (card) { card.classList.remove("selected"); });
  el.classList.add("selected");
  window._overrideAgentId = agentId;
}

function confirmOverride() {
  if (!window._overrideOrderId || !window._overrideAgentId) {
    showToast("Select an agent first", "error");
    return;
  }
  setOrderAssignment(window._overrideOrderId, window._overrideAgentId, "Assigned");
  closeModal("overrideModal");
  showSuccessTick("Assignment overridden");
  showToast("Agent overridden for " + window._overrideOrderId, "success");
  loadDispatchData();
}

function viewOrderDetail(orderId) {
  var order = getOrderById(orderId);
  if (!order) return;
  var body = document.getElementById("viewDetailBody");
  var meta = deriveOrderMeta(order);
  body.innerHTML =
    '<div class="modal-header-strip"><div class="modal-header-l"><div style="font-size:20px;font-weight:700;color:var(--text-title);display:flex;align-items:center;gap:12px;">Order #' + order.order_id.replace("ORD_", "") + " " + getStatusBadge(order.status) + '</div><div style="font-size:13px;color:var(--text-subtitle);">' + order.package_type + " · " + calculatePriority(order) + '</div></div></div>' +
    '<div class="modal-map-banner"><img src="assets/delivery-route-map.png" alt="Route Map" /></div>' +
    '<div class="modal-2col"><div><div class="modal-info-block"><div class="hm-info-row"><span class="hm-info-label">Customer</span><span class="hm-info-value">' + order.customer_name + '</span></div><div class="hm-info-row"><span class="hm-info-label">Phone</span><span class="hm-info-value">' + meta.phone + '</span></div><div class="hm-info-row"><span class="hm-info-label">Address</span><span class="hm-info-value" style="max-width:170px;text-align:right;">' + order.delivery_address + '</span></div></div></div><div><div class="modal-info-block"><div class="hm-info-row"><span class="hm-info-label">Order Value</span><span class="hm-info-value">₹' + order.amount + '</span></div><div class="hm-info-row"><span class="hm-info-label">Weight</span><span class="hm-info-value">' + order.weight + ' kg</span></div><div class="hm-info-row"><span class="hm-info-label">Distance</span><span class="hm-info-value">' + meta.distanceKm + " km</span></div></div></div></div>";
  var modal = document.getElementById("viewDetailModal").querySelector(".hm-modal");
  if (modal) modal.classList.add("hm-modal-wide");
  var footer = document.getElementById("viewDetailModal").querySelector(".hm-modal-footer");
  footer.innerHTML =
    '<button class="hm-btn hm-btn-ghost" data-action="change-destination" data-id="' + order.order_id + '">Change Destination Hub</button>' +
    '<button class="hm-btn hm-btn-ghost" data-action="expand-map" data-id="' + order.order_id + '">Track Live Map</button>' +
    '<button class="hm-btn hm-btn-ghost" onclick="closeModal(\'viewDetailModal\'); openOverrideModal(\'' + order.order_id + '\')">Override Agent</button>' +
    '<button class="hm-btn hm-btn-primary" onclick="closeModal(\'viewDetailModal\')">Close</button>';
  openModal("viewDetailModal");
}

function iconRefresh() { return '<svg viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
function iconClipboard() { return '<svg viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
function iconAlert() { return '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'; }
function iconMapPin() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>'; }
function iconNavigation() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>'; }
function iconPhone() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke-linejoin="round"/></svg>'; }
