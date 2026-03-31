var currentUser = null;
var allOrders = [];
var filteredOrders = [];
var currentPage = 1;
var itemsPerPage = 5;
var currentSort = "desc";
var selectedTransferOrder = null;

function initPage() {
  initTheme();
  currentUser = checkSession();
  if (!currentUser) return;
  renderSidebar("order-queue.html");
  renderNavbar("Orders Queue");
  showSkeletonBlock("ordersGrid");
  setTimeout(loadQueue, 450);

  // LIVE UI REFRESH
  window.addEventListener('appStateChanged', function() {
    loadQueue();
  });
}

function loadQueue() {
  allOrders = (window.mockData.orders || []).filter(function (o) {
    return o.pickup_hub_id === currentUser.hub_id;
  });
  filterAndRender();
}

function calculatePriority(order) {
  if (order.status === "Pending") {
    var created = new Date(order.created_at);
    if ((Date.now() - created.getTime()) / 3600000 > 2) return "HIGH";
  }
  if (order.status === "Assigned" || order.status === "In Transit") return "MEDIUM";
  return "LOW";
}

function filterAndRender() {
  var query = document.getElementById("queueSearch").value.toLowerCase();
  var priorityFilter = document.getElementById("priorityFilter").value;
  var statusFilter = document.getElementById("statusFilter").value;

  filteredOrders = allOrders.filter(function (o) {
    var matchesSearch = o.order_id.toLowerCase().includes(query) || o.customer_name.toLowerCase().includes(query);
    var priority = calculatePriority(o);
    var matchesPriority = priorityFilter === "all" || priority === priorityFilter;
    var matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  filteredOrders.sort(function (a, b) {
    return currentSort === "desc" ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at);
  });

  currentPage = 1;
  renderOrdersGrid();
}

function toggleSort() {
  currentSort = currentSort === "desc" ? "asc" : "desc";
  document.getElementById("sortBtn").textContent = currentSort === "desc" ? "Sort ↓" : "Sort ↑";
  filterAndRender();
}

function getProgressPercent(status) {
  var map = { Pending: 5, Assigned: 15, "Picked Up": 30, "In Transit": 55, "Out for Delivery": 80, Delivered: 100, Failed: 50 };
  return map[status] || 0;
}

function renderOrdersGrid() {
  var grid = document.getElementById("ordersGrid");
  if (!filteredOrders.length) {
    grid.innerHTML = '<div style="padding:48px;text-align:center;color:var(--text-subtitle);">No orders found matching criteria.</div>';
    document.getElementById("paginationContainer").innerHTML = "";
    return;
  }

  var start = (currentPage - 1) * itemsPerPage;
  var list = filteredOrders.slice(start, start + itemsPerPage);

  grid.innerHTML = list.map(function (order) {
    var priority = calculatePriority(order);
    var pClass = priority === "HIGH" ? "hm-badge-high" : priority === "MEDIUM" ? "hm-badge-medium" : "hm-badge-low";
    var progress = getProgressPercent(order.status);
    var canTransfer = order.status !== "In Transit";
    var meta = deriveOrderMeta(order);

    return (
      '<div class="hm-order-card">' +
      '<div class="hm-order-card-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
      '<div class="hm-order-card-left" style="display:flex;align-items:center;gap:12px;">' +
      '<span class="hm-order-id" style="font-weight:700;color:var(--brand-action);">' + order.order_id + "</span>" +
      getStatusBadge(order.status) +
      '<span class="hm-badge ' + pClass + '">' + priority + "</span>" +
      "</div>" +
      '<div class="hm-order-card-actions" style="display:flex;gap:12px;">' +
      (order.status === "Pending" ? '<button class="hm-btn hm-btn-outline hm-btn-sm" onclick="openAgentModal(\'' + order.order_id + '\')">Assign Agent</button>' : "") +
      '<button class="hm-btn hm-btn-outline hm-btn-sm" ' + (canTransfer ? 'onclick="openTransferModal(\'' + order.order_id + '\')"' : "disabled") + '>Transfer Hub</button>' +
      '<button class="hm-btn hm-btn-ghost hm-btn-sm" onclick="viewOrder(\'' + order.order_id + '\')">View</button>' +
      "</div></div>" +
      '<div class="hm-order-card-info" style="margin-bottom:16px;"><div class="hm-order-customer" style="font-size:15px;font-weight:600;color:var(--text-title);">' + order.customer_name + '</div><div class="hm-order-agent" style="font-size:13px;color:var(--text-subtitle);">Assigned Agent: ' + getAgentName(order.agent_id) + "</div></div>" +
      '<div class="hm-order-progress" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:4px 0;"><div class="hm-progress-dot" style="width:10px;height:10px;border-radius:50%;background:var(--brand-action);"></div><div class="hm-progress-line" style="flex:1;height:2px;background:var(--surface-disabled);position:relative;"><div class="hm-progress-fill" style="width:' + progress + '%;height:100%;background:var(--brand-action);"></div><div class="hm-progress-truck" style="position:absolute;top:50%;transform:translateY(-50%);left:' + progress + '%;margin-left:-11px;width:22px;height:22px;z-index:5;">' + iconTruckSmall() + '</div></div><div class="hm-progress-dot end" style="width:10px;height:10px;border-radius:50%;border:2px solid var(--border-strong);"></div></div>' +
      '<div class="hm-order-locations" style="display:flex;justify-content:space-between;gap:16px;"><div class="hm-loc-left" style="display:flex;flex-direction:column;gap:12px;">' +
      '<div class="hm-loc" style="display:flex;align-items:flex-start;gap:8px;"><div class="hm-loc-icon">' + iconMapPin() + '</div><div><div class="hm-loc-label" style="font-size:11px;font-weight:600;color:var(--text-caption);text-transform:uppercase;">Pick Up Hub</div><div class="hm-loc-value" style="font-size:13px;color:var(--text-body);max-width:250px;">' + getHubName(order.pickup_hub_id) + "</div></div></div>" +
      '<div class="hm-loc" style="display:flex;align-items:flex-start;gap:8px;"><div class="hm-loc-icon" style="color:var(--brand-action);">' + iconPhone() + '</div><div><div class="hm-loc-label" style="font-size:11px;font-weight:600;color:var(--text-caption);text-transform:uppercase;">Customer Phone</div><div class="hm-loc-value" style="font-size:13px;font-weight:600;color:var(--text-title);">' + meta.phone + '</div></div></div>' +
      '<div class="hm-loc-meta" style="font-size:11px;color:var(--text-subtitle);display:flex;flex-direction:column;gap:4px;margin-top:2px;"><div>ETA: <span style="font-weight:600;color:var(--text-body);">' + meta.etaText + '</span></div><div>Order Value: <span style="font-weight:600;color:var(--text-body);">₹' + order.amount + '</span></div><div>Distance: <span style="font-weight:600;color:var(--text-body);">' + meta.distanceKm + ' km</span></div></div></div>' +
      '<div class="hm-loc-right" style="display:flex;flex-direction:column;align-items:flex-end;"><div class="hm-loc end" style="text-align:right;display:flex;align-items:flex-start;gap:8px;"><div><div class="hm-loc-label" style="font-size:11px;font-weight:600;color:var(--text-caption);text-transform:uppercase;">Delivery Location</div><div class="hm-loc-value" style="font-size:13px;color:var(--text-body);max-width:200px;">' + order.delivery_address + '</div></div><div class="hm-loc-icon" style="color:var(--brand-action);">' + iconNavigation() + "</div></div></div></div>" +
      "</div>"
    );
  }).join("");

  renderPagination();
}

function renderPagination() {
  var totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  var container = document.getElementById("paginationContainer");
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  var nav = "";
  for (var p = 1; p <= totalPages; p++) nav += '<button class="' + (p === currentPage ? "active" : "") + '" onclick="goToPage(' + p + ')">' + p + "</button>";
  container.innerHTML =
    "<span>Showing " + ((currentPage - 1) * itemsPerPage + 1) + "-" + Math.min(currentPage * itemsPerPage, filteredOrders.length) + " of " + filteredOrders.length + " orders</span>" +
    '<div class="hm-page-nav"><button onclick="goToPage(' + (currentPage - 1) + ')" ' + (currentPage === 1 ? 'disabled style="opacity:0.5"' : "") + '>&lt;</button>' + nav + '<button onclick="goToPage(' + (currentPage + 1) + ')" ' + (currentPage === totalPages ? 'disabled style="opacity:0.5"' : "") + '>&gt;</button></div>';
}

function goToPage(page) {
  var totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderOrdersGrid();
}

function openAgentModal(orderId) {
  var order = getOrderById(orderId);
  if (!order || order.status !== "Pending") {
    showToast("Only pending orders can be assigned", "error");
    return;
  }
  var body = document.getElementById("agentModalBody");
  var agents = filterAgentsByHub(window.mockData.agents || []);
  body.innerHTML = agents.map(function (a) {
    return '<div class="modal-agent-card" style="margin-bottom:8px;"><div class="modal-agent-info"><div class="modal-agent-name">' + a.name + '</div><div class="modal-agent-meta"><div class="modal-meta-item">' + a.vehicle_type + '</div><div class="modal-agent-tasks ' + ((a.tasks_count || 0) <= 1 ? "green" : "orange") + '">' + (a.tasks_count || 0) + ' active tasks</div></div></div><button class="hm-btn-small" onclick="assignAgentDirect(\'' + order.order_id + "','" + a.agent_id + '\')">Assign</button></div>';
  }).join("");
  openModal("agentModal");
}

function assignAgentDirect(orderId, agentId) {
  if (!setOrderAssignment(orderId, agentId, "Assigned")) return;
  closeModal("agentModal");
  showSuccessTick("Agent assigned");
  showToast("Agent assigned to " + orderId, "success");
  loadQueue();
}

function openTransferModal(orderId) {
  selectedTransferOrder = getOrderById(orderId);
  if (!selectedTransferOrder) return;
  var body = document.getElementById("transferBody");
  var hubs = (window.mockData.hubs || []).filter(function (h) {
    return h.hub_id !== selectedTransferOrder.pickup_hub_id && h.status === "Active";
  });
  body.innerHTML =
    '<div class="hm-info-row"><span class="hm-info-label">Order</span><span class="hm-info-value">' + selectedTransferOrder.order_id + '</span></div>' +
    '<div class="hm-info-row"><span class="hm-info-label">From Hub</span><span class="hm-info-value">' + getHubName(selectedTransferOrder.pickup_hub_id) + '</span></div>' +
    '<div class="hm-form-group" style="margin-top:var(--space-16)"><label class="hm-label">Transfer To Hub <span class="required">*</span></label><select id="transferHubSelect" class="hm-form-select"><option value="">Select destination hub</option>' +
    hubs.map(function (h) { return '<option value="' + h.hub_id + '">' + h.name + "</option>"; }).join("") +
    "</select></div>";
  openModal("approveTransferModal");
}

function confirmTransfer() {
  if (!selectedTransferOrder) return;
  var select = document.getElementById("transferHubSelect");
  if (!select || !select.value) {
    showToast("Select destination hub", "error");
    return;
  }
  setOrderHub(selectedTransferOrder.order_id, select.value);
  closeModal("approveTransferModal");
  showSuccessTick("Transfer updated");
  showToast("Order transferred to " + getHubName(select.value), "success");
  selectedTransferOrder = null;
  loadQueue();
}

function viewOrder(orderId) {
  var order = getOrderById(orderId);
  if (!order) return;
  var body = document.getElementById("viewOrderBody");
  var meta = deriveOrderMeta(order);
  body.innerHTML =
    '<div class="modal-header-strip"><div class="modal-header-l"><div style="font-size:20px;font-weight:700;color:var(--text-title);display:flex;align-items:center;gap:12px;">Order #' + order.order_id.replace("ORD_", "") + " " + getStatusBadge(order.status) + '</div><div style="font-size:13px;color:var(--text-subtitle);">' + order.package_type + " · Priority: " + calculatePriority(order) + '</div></div></div>' +
    '<div class="modal-map-banner"><img src="assets/delivery-route-map.png" alt="Route Map" /></div>' +
    '<div class="modal-2col"><div><div class="modal-info-block"><div class="hm-info-row"><span class="hm-info-label">Customer</span><span class="hm-info-value">' + order.customer_name + '</span></div><div class="hm-info-row"><span class="hm-info-label">Phone</span><span class="hm-info-value">' + meta.phone + '</span></div><div class="hm-info-row"><span class="hm-info-label">Address</span><span class="hm-info-value" style="max-width:170px;text-align:right;">' + order.delivery_address + '</span></div></div></div><div><div class="modal-info-block"><div class="hm-info-row"><span class="hm-info-label">Order Value</span><span class="hm-info-value">₹' + order.amount + '</span></div><div class="hm-info-row"><span class="hm-info-label">Weight</span><span class="hm-info-value">' + order.weight + ' kg</span></div><div class="hm-info-row"><span class="hm-info-label">Distance</span><span class="hm-info-value">' + meta.distanceKm + " km</span></div></div></div></div>";
  var modal = document.getElementById("viewOrderModal").querySelector(".hm-modal");
  if (modal) modal.classList.add("hm-modal-wide");
  var footer = document.getElementById("viewOrderModal").querySelector(".hm-modal-footer");
  footer.innerHTML =
    '<button class="hm-btn hm-btn-ghost" data-action="change-destination" data-id="' + order.order_id + '">Change Destination Hub</button>' +
    '<button class="hm-btn hm-btn-ghost" data-action="expand-map" data-id="' + order.order_id + '">Track Live Map</button>' +
    '<button class="hm-btn hm-btn-ghost" onclick="closeModal(\'viewOrderModal\'); openAgentModal(\'' + order.order_id + '\')">Assign Agent</button>' +
    '<button class="hm-btn hm-btn-primary" onclick="closeModal(\'viewOrderModal\')">Close</button>';
  openModal("viewOrderModal");
}

function iconMapPin() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>'; }
function iconNavigation() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>'; }
function iconPhone() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>'; }
function iconTruckSmall() { return '<svg viewBox="0 0 24 24" fill="var(--text-subtitle)"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>'; }
