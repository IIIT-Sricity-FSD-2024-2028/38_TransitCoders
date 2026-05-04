var currentOrders = [];
var transferCandidates = [];
var activeTransferOrderId = null;

function initPage() {
    if (!checkSession()) return;

    renderSidebar("inter-hub-transfer.html");
    renderNavbar("Inter-Hub Transfer");
    loadTransferData();

    // Live reactivity
    window.addEventListener('appStateChanged', loadTransferData);
}

function loadTransferData() {
    currentOrders = filterOrdersByHub(window.mockData.orders || []);
    transferCandidates = currentOrders
        .filter(function (o) { return o.status !== window.SwiftTrackEnums.OrderStatus.DELIVERED; })
        .sort(function (a, b) { return new Date(b.updated_at) - new Date(a.updated_at); });
    renderTransferStats();
    renderTransferList();
}

function renderTransferStats() {
    var pending = transferCandidates.filter(function (o) { return o.status === window.SwiftTrackEnums.OrderStatus.PENDING; }).length;
    var inTransit = transferCandidates.filter(function (o) { return o.status === window.SwiftTrackEnums.OrderStatus.IN_TRANSIT || o.status === window.SwiftTrackEnums.OrderStatus.OUT_FOR_DELIVERY; }).length;
    var delivered = currentOrders.filter(function (o) { return o.status === window.SwiftTrackEnums.OrderStatus.DELIVERED; }).length;

    var el = document.getElementById("statPending");
    if (el) el.textContent = pending < 10 ? "0" + pending : String(pending);
    el = document.getElementById("statTransit");
    if (el) el.textContent = inTransit < 10 ? "0" + inTransit : String(inTransit);
    el = document.getElementById("statCompleted");
    if (el) el.textContent = delivered < 10 ? "0" + delivered : String(delivered);
}

function renderTransferList() {
    var container = document.querySelector(".hm-ih-layout > div:first-child");
    if (!container || !transferCandidates.length) return;
    var header = container.querySelector(".hm-ih-section-header");
    var sectionTitle = header ? header.outerHTML : "";

    var mainOrder = transferCandidates[0];
    var meta = deriveOrderMeta(mainOrder);
    var otherHub = (window.mockData.hubs || []).find(function (h) {
        return h.hub_id !== mainOrder.pickup_hub_id && h.status === "Active";
    });

    var html = sectionTitle;
    html +=
        '<div class="hm-ih-card">' +
            '<div class="hm-ih-card-header">' +
                '<div class="hm-ih-id-row">' +
                    '<span class="hm-ih-id">#' + mainOrder.order_id + "</span>" +
                    '<span class="hm-pill-sm hm-pill-warn">• ' + mainOrder.status + "</span>" +
                "</div>" +
                '<div style="text-align:right;color:var(--text-caption);font-size:12px;">' +
                    '<div style="font-weight:600;">' + meta.distanceKm + " km</div>" +
                    "<div>Est. Distance</div>" +
                "</div>" +
            "</div>" +
            '<div class="hm-ih-requested">Updated ' + getTimeAgo(mainOrder.updated_at) + " • " + mainOrder.package_type + "</div>" +
            '<div class="hm-ih-route">' +
                '<div class="hm-ih-node hm-node-orange"><div class="hm-ih-node-title">Current Hub</div><div class="hm-ih-node-sub">' + getHubName(mainOrder.pickup_hub_id) + "</div></div>" +
                '<div class="hm-ih-node hm-node-green"><div class="hm-ih-node-title">Destination Hub</div><div class="hm-ih-node-sub">' + (otherHub ? otherHub.name : "Available Hub") + "</div></div>" +
            "</div>" +
            '<div class="hm-ih-actions">' +
                '<button class="hm-btn-rounded primary" onclick="approveTransfer(\'' + mainOrder.order_id + '\')">Approve Transfer</button>' +
                '<button class="hm-btn-rounded gray" onclick="openChangeDestinationModal(\'' + mainOrder.order_id + '\')">Change Destination</button>' +
                '<a href="javascript:void(0)" class="hm-ih-view-link" onclick="openDeliveryMap(\'' + mainOrder.order_id + '\')">View Map →</a>' +
            "</div>" +
        "</div>";

    transferCandidates.slice(1, 3).forEach(function (o) {
        html +=
            '<div class="hm-ih-condensed">' +
                "<div>" +
                    '<div class="hm-ih-id-row" style="margin-bottom:4px;"><span class="hm-ih-id" style="font-size:15px;">#' + o.order_id + "</span><span class=\"hm-pill-sm hm-pill-muted\">• " + o.status + "</span></div>" +
                    '<div class="hm-ih-requested" style="margin-bottom:0;">' + o.package_type + " • " + getTimeAgo(o.updated_at) + "</div>" +
                "</div>" +
                '<div class="hm-ih-condensed-actions">' +
                    '<button class="hm-btn-rounded primary" style="padding:6px 16px;" onclick="quickApprove(\'' + o.order_id + '\')">Quick Approve</button>' +
                    '<button class="hm-dots-btn" onclick="openChangeDestinationModal(\'' + o.order_id + '\')"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/></svg></button>' +
                "</div>" +
            "</div>";
    });

    container.innerHTML = html;
}

function approveTransfer(id) {
    var order = getOrderById(id);
    if (!order) return;
    activeTransferOrderId = id;
    var meta = deriveOrderMeta(order);

    document.getElementById("at-shipment-id").textContent = order.order_id;
    document.getElementById("at-cargo-type").textContent = (order.package_type || "General") + " Package";
    document.getElementById("at-priority").textContent = order.status === window.SwiftTrackEnums.OrderStatus.PENDING ? "High" : "Medium";
    document.getElementById("at-transit-time").textContent = meta.etaText;
    openModal("approveTransferModal");
}

function confirmTransferAction() {
    if (!activeTransferOrderId) return;
    var btn = document.querySelector("#approveTransferModal .hm-btn-primary");
    setActionLoading(btn, true, "Confirming...");
    setTimeout(function () {
        setActionLoading(btn, false);
        if (window.AppState) {
            var state = window.AppState.getState();
            var canonical = state.orders.find(function(o) { return o.order_id === activeTransferOrderId; });
            if (canonical) {
                canonical.status = window.SwiftTrackEnums.OrderStatus.IN_TRANSIT;
                canonical.updated_at = new Date().toISOString();
            }
            window.AppState.saveState(state);
        }
        closeModal("approveTransferModal");
        showSuccessTick("Transfer approved");
        showToast("Transfer request approved and scheduled", "success");
        loadTransferData();
        activeTransferOrderId = null;
    }, 650);
}

function quickApprove(id) {
    if (window.AppState) {
        var state = window.AppState.getState();
        var canonical = state.orders.find(function(o) { return o.order_id === id; });
        if (!canonical) return;
        canonical.status = window.SwiftTrackEnums.OrderStatus.IN_TRANSIT;
        canonical.updated_at = new Date().toISOString();
        window.AppState.saveState(state);
    }
    showSuccessTick("Quick approved");
    showToast("Transfer " + id + " quick-approved", "success");
    loadTransferData();
}

function openTransferRequestsModal(e) {
    if (e) e.preventDefault();
    var body = document.getElementById("allTransferRequestsBody");
    if (!body) return;
    if (!transferCandidates.length) {
        body.innerHTML = '<div class="hm-empty-msg">No transfer requests available.</div>';
        openModal("allTransferRequestsModal");
        return;
    }
    body.innerHTML =
        '<div class="hm-transfer-list">' +
        transferCandidates.map(function (o) {
            var meta = deriveOrderMeta(o);
            return (
                '<div class="hm-transfer-row">' +
                    '<div><div class="hm-transfer-id">' + o.order_id + '</div><div class="hm-transfer-sub">' + o.package_type + ' · ' + getHubName(o.pickup_hub_id) + "</div></div>" +
                    '<div><span class="hm-badge ' + (o.status === window.SwiftTrackEnums.OrderStatus.PENDING ? "hm-badge-pending" : "hm-badge-in-transit") + '">' + o.status + "</span></div>" +
                    '<div class="hm-transfer-sub">' + meta.distanceKm + " km</div>" +
                    '<div class="hm-transfer-sub">' + meta.etaText + "</div>" +
                    '<div style="display:flex;gap:8px;"><button class="hm-btn hm-btn-ghost hm-btn-sm" onclick="openChangeDestinationModal(\'' + o.order_id + '\')">Change</button><button class="hm-btn hm-btn-primary hm-btn-sm" onclick="approveTransfer(\'' + o.order_id + '\');closeModal(\'allTransferRequestsModal\')">Approve</button></div>' +
                "</div>"
            );
        }).join("") +
        "</div>";
    openModal("allTransferRequestsModal");
}
