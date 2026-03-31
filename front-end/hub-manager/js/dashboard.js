var currentOrders = [];
var currentAgents = [];
var refreshInterval = null;
var selectedTransferOrder = null;
var selectedAssignOrder = null;
var selectedAgentId = null;
var activeFilter = "all";

function initPage() {
  if (!checkSession()) return;
  initTheme();
  renderSidebar("dashboard.html");
  renderNavbar("Hub Operations Dashboard");
  loadDashboard();
  refreshInterval = setInterval(loadDashboard, 60000);

  // LIVE UI REFRESH
  window.addEventListener('appStateChanged', function() {
    loadDashboard();
  });
}

function loadDashboard() {
  showSkeletonStats();
  showSkeleton("ordersContainer", 8);
  setTimeout(function () {
    currentOrders = filterOrdersByHub(window.mockData.orders || []);
    currentAgents = filterAgentsByHub(window.mockData.agents || []);
    renderStats();
    renderFilterTabs();
    renderOrderCards();
  }, 300);
}

function showSkeletonStats() {
  var g = document.getElementById("statsGrid");
  if (!g) return;
  var h = "";
  for (var i = 0; i < 4; i++) {
    h +=
      '<div class="hm-card hm-stat-card"><div class="hm-skeleton hm-skeleton-row" style="width:48px;height:48px;border-radius:50%"></div><div class="hm-skeleton hm-skeleton-row" style="width:50%;margin-top:12px"></div><div class="hm-skeleton hm-skeleton-row" style="width:30%;height:24px;margin-top:8px"></div></div>';
  }
  g.innerHTML = h;
}

function renderStats() {
  var g = document.getElementById("statsGrid");
  if (!g) return;
  var total = currentOrders.length;
  var pending = currentOrders.filter(function (o) {
    return o.status === "Pending";
  }).length;
  var avail = currentAgents.filter(function (a) {
    return a.availability_status === "Available";
  }).length;
  var delivering = currentAgents.length - avail;
  var delivered = currentOrders.filter(function (o) {
    return o.status === "Delivered";
  }).length;
  var avgTime = total ? Math.max(22, 50 - delivered) : 0;

  var stats = [
    {
      icon: "orange",
      svg: iconBox(),
      label: "Active Orders",
      value: total,
      sub: delivered + " delivered today",
    },
    {
      icon: "orange",
      svg: iconGrid(),
      label: "Pending Orders",
      value: pending,
      sub: pending + " waiting assignment",
    },
    {
      icon: "green",
      svg: iconUserSvg(),
      label: "Available Agents",
      value: avail,
      sub: delivering + " currently delivering",
    },
    {
      icon: "blue",
      svg: iconClock(),
      label: "Avg Delivery Time",
      value: avgTime + " min",
      sub: "derived from current workload",
    },
  ];

  g.innerHTML = stats
    .map(function (s) {
      return (
        '<div class="hm-card hm-stat-card"><div class="hm-stat-icon ' +
        s.icon +
        '">' +
        s.svg +
        '</div><div class="hm-stat-label">' +
        s.label +
        '</div><div class="hm-stat-value">' +
        s.value +
        '</div><div class="hm-stat-sub">' +
        s.sub +
        "</div></div>"
      );
    })
    .join("");
}

function renderFilterTabs() {
  var c = document.getElementById("filterTabs");
  if (!c) return;
  var counts = {
    all: currentOrders.length,
    Pending: 0,
    "In Transit": 0,
    Delivered: 0,
  };
  currentOrders.forEach(function (o) {
    if (counts[o.status] !== undefined) counts[o.status]++;
  });
  var tabs = [
    { key: "all", label: "All Orders", count: counts.all },
    { key: "Pending", label: "Pending", count: counts.Pending },
    { key: "In Transit", label: "In Transit", count: counts["In Transit"] },
    { key: "Delivered", label: "Delivered", count: counts.Delivered },
  ];
  c.innerHTML = tabs
    .map(function (t) {
      return (
        '<button class="hm-filter-tab' +
        (activeFilter === t.key ? " active" : "") +
        '" onclick="setFilter(\'' +
        t.key +
        "')\">" +
        t.label +
        '<span class="hm-filter-count">' +
        t.count +
        "</span></button>"
      );
    })
    .join("");
}

function setFilter(key) {
  activeFilter = key;
  renderFilterTabs();
  renderOrderCards();
}

function getProgressPercent(status) {
  var map = {
    Pending: 5,
    Assigned: 15,
    "Picked Up": 30,
    "In Transit": 55,
    "Out for Delivery": 80,
    Delivered: 100,
    Failed: 50,
  };
  return map[status] || 0;
}

function renderOrderCards() {
  var c = document.getElementById("ordersContainer");
  if (!c) return;
  var filtered =
    activeFilter === "all"
      ? currentOrders
      : currentOrders.filter(function (o) {
          return o.status === activeFilter;
        });
  if (!filtered.length) {
    c.innerHTML =
      '<div class="hm-empty-state"><div class="hm-empty-icon">' +
      iconBox() +
      '</div><div class="hm-empty-title">No Orders Found</div><div class="hm-empty-msg">No orders match the selected filter.</div></div>';
    return;
  }

  var display = filtered.slice(0, 6);
  c.innerHTML =
    '<div class="hm-order-cards">' +
    display
      .map(function (order) {
        var isPending = order.status === "Pending";
        var isInTransit = order.status === "In Transit";
        var progress = getProgressPercent(order.status);
        var meta = deriveOrderMeta(order);
        return (
          '<div class="hm-order-card">' +
          '<div class="hm-order-card-header"><div class="hm-order-card-left"><span class="hm-order-id">' +
          order.order_id +
          "</span>" +
          getStatusBadge(order.status) +
          "</div>" +
          '<div class="hm-order-card-actions">' +
          (isPending
            ? '<button class="hm-btn hm-btn-outline hm-btn-sm" onclick="openAssignModal(\'' +
              order.order_id +
              "')\">Assign Agent</button>"
            : "") +
          '<button class="hm-btn hm-btn-outline hm-btn-sm" ' +
          (isInTransit
            ? "disabled"
            : "onclick=\"openTransferModal('" + order.order_id + "')\"") +
          ">Transfer Hub</button>" +
          '<button class="hm-btn hm-btn-ghost hm-btn-sm" onclick="viewOrder(\'' +
          order.order_id +
          "')\">View</button></div></div>" +
          '<div class="hm-order-card-info"><div class="hm-order-customer">' +
          order.customer_name +
          '</div><div class="hm-order-agent">Assigned Agent: ' +
          getAgentName(order.agent_id) +
          "</div></div>" +
          '<div class="hm-order-progress"><div class="hm-progress-dot"></div><div class="hm-progress-line"><div class="hm-progress-fill" style="width:' +
          progress +
          '%"></div><div class="hm-progress-truck" style="left:' +
          progress +
          '%; margin-left: -11px;">' +
          iconTruckSmall() +
          '</div></div><div class="hm-progress-dot end"></div></div>' +
          '<div class="hm-order-locations" style="display:flex;justify-content:space-between;gap:16px;">' +
          '<div class="hm-loc-left" style="display:flex;flex-direction:column;gap:12px;">' +
          '<div class="hm-loc" style="display:flex;align-items:flex-start;gap:8px;"><div class="hm-loc-icon">' +
          iconMapPin() +
          '</div><div><div class="hm-loc-label" style="font-size:11px;font-weight:600;color:var(--text-caption);text-transform:uppercase;">Pick Up Hub</div><div class="hm-loc-value" style="font-size:13px;color:var(--text-body);max-width:250px;">' +
          getHubName(order.pickup_hub_id) +
          "</div></div></div>" +
          '<div class="hm-loc" style="display:flex;align-items:flex-start;gap:8px;"><div class="hm-loc-icon" style="color:var(--brand-action);">' +
          iconPhone() +
          '</div><div><div class="hm-loc-label" style="font-size:11px;font-weight:600;color:var(--text-caption);text-transform:uppercase;">Customer Phone</div><div class="hm-loc-value" style="font-size:13px;font-weight:600;color:var(--text-title);">' +
          meta.phone +
          "</div></div></div>" +
          '<div class="hm-loc-meta" style="font-size:11px;color:var(--text-subtitle);display:flex;flex-direction:column;gap:4px;"><div>ETA: <span style="font-weight:600;color:var(--text-body);">' +
          meta.etaText +
          '</span></div><div>Order Value: <span style="font-weight:600;color:var(--text-body);">₹' +
          order.amount +
          '</span></div><div>Distance: <span style="font-weight:600;color:var(--text-body);">' +
          meta.distanceKm +
          " km</span></div></div></div>" +
          '<div class="hm-loc-right" style="display:flex;flex-direction:column;align-items:flex-end;"><div class="hm-loc end" style="text-align:right;display:flex;align-items:flex-start;gap:8px;"><div><div class="hm-loc-label" style="font-size:11px;font-weight:600;color:var(--text-caption);text-transform:uppercase;">Delivery Location</div><div class="hm-loc-value" style="font-size:13px;color:var(--text-body);max-width:200px;">' +
          order.delivery_address +
          '</div></div><div class="hm-loc-icon" style="color:var(--brand-action); cursor:pointer;" data-action="expand-map" data-id="' +
          order.order_id +
          '">' +
          iconNavigation() +
          "</div></div></div></div>" +
          "</div>"
        );
      })
      .join("") +
    "</div>";
}

function openTransferModal(orderId) {
  var order = getOrderById(orderId);
  if (!order || order.status !== "Pending") {
    showToast("Only pending orders can be transferred", "error");
    return;
  }
  selectedTransferOrder = order;
  var hubs = (window.mockData.hubs || []).filter(function (h) {
    return h.hub_id !== order.pickup_hub_id && h.status === "Active";
  });
  var body = document.getElementById("transferBody");
  body.innerHTML =
    '<div class="hm-info-row"><span class="hm-info-label">Order</span><span class="hm-info-value">' +
    order.order_id +
    "</span></div>" +
    '<div class="hm-info-row"><span class="hm-info-label">From Hub</span><span class="hm-info-value">' +
    getHubName(order.pickup_hub_id) +
    "</span></div>" +
    '<div class="hm-form-group" style="margin-top:var(--space-16)"><label class="hm-label">Transfer To Hub <span class="required">*</span></label><select id="transferHubSelect" class="hm-form-select"><option value="">Select destination hub</option>' +
    hubs
      .map(function (h) {
        return '<option value="' + h.hub_id + '">' + h.name + "</option>";
      })
      .join("") +
    '</select><span class="hm-field-error" id="transferHubError"></span></div>' +
    '<div class="hm-form-group"><label class="hm-label">Reason</label><select id="transferReason" class="hm-form-select"><option value="closer">Closer to delivery</option><option value="capacity">Hub at capacity</option><option value="route">Route optimization</option></select></div>';
  openModal("approveTransferModal");
}

function confirmTransfer() {
  if (!selectedTransferOrder) return;
  var sel = document.getElementById("transferHubSelect");
  if (!sel.value) {
    sel.classList.add("input-error");
    var err = document.getElementById("transferHubError");
    if (err) err.textContent = "Select a hub";
    sel.focus();
    return;
  }
  sel.classList.remove("input-error");
  setOrderHub(selectedTransferOrder.order_id, sel.value);
  closeModal("approveTransferModal");
  showSuccessTick("Transfer updated");
  showToast("Order transferred to " + getHubName(sel.value), "success");
  selectedTransferOrder = null;
  loadDashboard();
}

function openAssignModal(orderId) {
  var order = getOrderById(orderId);
  if (!order || order.status !== "Pending") {
    showToast("Only pending orders can be assigned", "error");
    return;
  }
  selectedAssignOrder = order;
  selectedAgentId = null;
  var agents = filterAgentsByHub(window.mockData.agents || []);
  var body = document.getElementById("assignAgentBody");
  console.log("Agents found:", agents.length, agents); // Debug
  body.innerHTML =
    '<div class="modal-info-card" style="margin-top:0;"><div><div class="modal-info-label">ORDER ID</div><div class="modal-info-val">' +
    order.order_id +
    '</div></div><div><div class="modal-info-label">DELIVERY LOCATION</div><div class="modal-info-val" style="font-size:12px;">' +
    order.delivery_address +
    "</div></div></div>" +
    '<div class="modal-section-label">Available Delivery Agents (' +
    agents.length +
    ")</div>" +
    (agents.length
      ? agents
          .map(function (a) {
            var taskClass = (a.tasks_count || 0) <= 1 ? "green" : "orange";
            return (
              '<div class="modal-agent-card" data-agent="' +
              a.agent_id +
              '" onclick="selectAgent(this,\'' +
              a.agent_id +
              '\')"><div class="modal-agent-info"><div class="modal-agent-name">' +
              a.name +
              '</div><div class="modal-agent-meta"><div class="modal-meta-item">' +
              a.vehicle_type +
              '</div><div class="modal-agent-tasks ' +
              taskClass +
              '">' +
              (a.tasks_count || 0) +
              ' active tasks</div></div></div><button class="hm-btn-small" onclick="event.stopPropagation();selectAgent(this.parentElement,\'' +
              a.agent_id +
              "')\">Select</button></div>"
            );
          })
          .join("")
      : '<div style="text-align:center;padding:32px;color:var(--text-subtitle);"><div style="font-size:48px;margin-bottom:16px;">👥</div><div style="font-size:14px;font-weight:500;margin-bottom:8px;">No agents available</div><div style="font-size:12px;">All agents are busy or offline</div></div>');
  openModal("assignAgentModal");
}

function selectAgent(el, agentId) {
  document
    .querySelectorAll("#assignAgentBody .modal-agent-card")
    .forEach(function (li) {
      li.classList.remove("selected");
    });
  el.classList.add("selected");
  selectedAgentId = agentId;
}

function confirmAssign() {
  if (!selectedAssignOrder || !selectedAgentId) {
    showToast("Select an agent first", "error");
    return;
  }
  setOrderAssignment(selectedAssignOrder.order_id, selectedAgentId, "Assigned");
  closeModal("assignAgentModal");
  showSuccessTick("Agent assigned");
  showToast("Agent assigned to " + selectedAssignOrder.order_id, "success");
  selectedAssignOrder = null;
  selectedAgentId = null;
  loadDashboard();
}

function viewOrder(orderId) {
  var order = getOrderById(orderId);
  if (!order) return;
  var meta = deriveOrderMeta(order);
  var body = document.getElementById("viewOrderBody");
  body.innerHTML =
    '<div class="modal-header-strip"><div class="modal-header-l"><div style="font-size:20px;font-weight:700;color:var(--text-title);display:flex;align-items:center;gap:12px;">Order #' +
    order.order_id.replace("ORD_", "") +
    " " +
    getStatusBadge(order.status) +
    '</div><div style="font-size:13px;color:var(--text-subtitle);">' +
    order.package_type +
    " · Priority: " +
    calculatePriority(order) +
    '</div></div><div class="modal-header-r"><div style="font-size:11px;color:var(--text-subtitle);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">ETA</div><div style="font-size:13px;color:var(--brand-action);font-weight:600;">' +
    meta.etaText +
    "</div></div></div>" +
    '<div class="modal-map-banner"><img src="assets/delivery-route-map.png" alt="Route Map" /></div>' +
    '<div class="modal-2col"><div><div class="modal-info-block-title">' +
    iconUserSvg() +
    ' Customer Details</div><div class="modal-info-block"><div class="hm-info-row"><span class="hm-info-label">Name</span><span class="hm-info-value" style="font-size:13px;">' +
    order.customer_name +
    '</span></div><div class="hm-info-row"><span class="hm-info-label">Phone</span><span class="hm-info-value" style="font-size:13px;">' +
    meta.phone +
    '</span></div><div class="hm-info-row"><span class="hm-info-label">Address</span><span class="hm-info-value" style="font-size:13px;max-width:160px;text-align:right;">' +
    order.delivery_address +
    '</span></div><div class="hm-info-row" style="border-bottom:none;padding-bottom:0;"><span class="hm-info-label">Payment</span><span class="hm-info-value"><span style="background:var(--success-surface);color:var(--success-fill);padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;">' +
    meta.paymentMode +
    '</span></span></div></div></div><div><div class="modal-info-block-title">' +
    iconMapPin() +
    ' Shipment Details</div><div class="modal-info-block"><div class="hm-info-row"><span class="hm-info-label">Order Value</span><span class="hm-info-value" style="font-size:13px;">₹' +
    order.amount +
    '</span></div><div class="hm-info-row"><span class="hm-info-label">Weight</span><span class="hm-info-value" style="font-size:13px;">' +
    order.weight +
    ' kg</span></div><div class="hm-info-row"><span class="hm-info-label">Distance</span><span class="hm-info-value" style="font-size:13px;">' +
    meta.distanceKm +
    ' km</span></div><div class="hm-info-row" style="border-bottom:none;padding-bottom:0;"><span class="hm-info-label">Assigned Agent</span><span class="hm-info-value" style="font-size:13px;">' +
    getAgentName(order.agent_id) +
    "</span></div></div></div></div>";
  var modalContent = document
    .getElementById("viewOrderModal")
    .querySelector(".hm-modal");
  if (modalContent) modalContent.classList.add("hm-modal-wide");
  var title = document
    .getElementById("viewOrderModal")
    .querySelector(".hm-modal-title");
  if (title) title.style.display = "none";
  var footer = document
    .getElementById("viewOrderModal")
    .querySelector(".hm-modal-footer");
  if (footer) {
    footer.innerHTML =
      '<button class="hm-btn hm-btn-ghost" data-action="change-destination" data-id="' +
      order.order_id +
      '">Change Destination Hub</button>' +
      '<button class="hm-btn hm-btn-ghost" data-action="expand-map" data-id="' +
      order.order_id +
      '">Track Live Map</button>' +
      "<button class=\"hm-btn hm-btn-ghost\" onclick=\"closeModal('viewOrderModal'); openTransferModal('" +
      order.order_id +
      "')\">Transfer Hub</button>" +
      '<button class="hm-btn hm-btn-primary" onclick="closeModal(\'viewOrderModal\')">Close</button>';
  }
  openModal("viewOrderModal");
}

function iconUserSvg() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
}
function iconClock() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
}
function iconMapPin() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
}
function iconNavigation() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>';
}
function iconTruckSmall() {
  return '<svg viewBox="0 0 24 24" fill="var(--text-subtitle)"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>';
}
function iconPhone() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
}

function calculatePriority(order) {
  if (order.status === "Pending") {
    var created = new Date(order.created_at);
    if ((Date.now() - created.getTime()) / 3600000 > 2) return "HIGH";
  }
  if (order.status === "Assigned" || order.status === "In Transit")
    return "MEDIUM";
  return "LOW";
}


// React to centralized state changes
window.addEventListener('appStateChanged', populateDashboardData);