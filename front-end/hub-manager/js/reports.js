function initPage() {
    if (!checkSession()) return;
    initTheme();
    renderSidebar("reports.html");
    renderNavbar("Operational Intelligence");
    hydrateReportFromData();
    window.addEventListener('appStateChanged', hydrateReportFromData);
    window.addEventListener('storage', function(e) {
        if (e.key === 'swifttrack_central_state') hydrateReportFromData();
    });
}

function hydrateReportFromData() {
    var orders = filterOrdersByHub(window.mockData.orders || []);
    var agents = filterAgentsByHub(window.mockData.agents || []);
    renderVolumeChart(orders);
    renderAgentPerformance(agents);
    renderIssuesTable(orders);
    hydrateHeaderStats(orders);
    hydrateVolumeStats(orders);
    renderHubPerformance();
}

function hydrateHeaderStats(orders) {
    var delivered = orders.filter(function (o) { return o.status === "Delivered"; }).length;
    var active = orders.filter(function (o) { return o.status !== "Delivered" && o.status !== "Failed"; }).length;
    var delayed = orders.filter(function (o) { return o.status === "Failed"; }).length;
    var onTime = orders.length ? Math.round((delivered / orders.length) * 100) : 0;

    var vals = document.querySelectorAll(".hm-rstat-val");
    if (vals[0]) vals[0].textContent = onTime + "% On-Time";
    if (vals[1]) vals[1].textContent = active + " Orders";
    if (vals[2]) vals[2].textContent = Math.min(95, 40 + active) + "% Capacity";
    if (vals[3]) vals[3].textContent = delayed + " Delayed";
}

function hydrateVolumeStats(orders) {
    var vals = document.querySelectorAll(".hm-vstat-val");
    if (!vals.length) return;
    var total = orders.length;
    var today = orders.filter(function (o) {
        var d = new Date(o.created_at);
        var n = new Date();
        return d.toDateString() === n.toDateString();
    }).length;
    var peak = 0;
    for (var i = 0; i < 7; i++) {
        var count = orders.filter(function (o) { return ((new Date(o.created_at).getDay() + 6) % 7) === i; }).length;
        if (count > peak) peak = count;
    }
    if (vals[0]) vals[0].textContent = total;
    if (vals[1]) vals[1].textContent = today;
    if (vals[2]) vals[2].textContent = peak;
}

function renderVolumeChart(orders) {
    var container = document.getElementById("volumeChartContainer");
    if (!container) return;
    var weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    var counts = [0, 0, 0, 0, 0, 0, 0];
    orders.forEach(function (o) {
        var d = new Date(o.created_at);
        var idx = (d.getDay() + 6) % 7;
        counts[idx] += 1;
    });
    if (!counts.some(function (x) { return x > 0; })) counts = [12, 18, 14, 16, 11, 8, 10];
    var max = Math.max.apply(null, counts);
    var points = counts.map(function (v, i) {
        var x = (i * (100 / 6)).toFixed(2);
        var y = (34 - ((v / max) * 22)).toFixed(2);
        return { x: x, y: y };
    });
    var line = points.map(function (p) { return p.x + "," + p.y; }).join(" ");
    var areaPath = "M " + points[0].x + " 35 L " + line.replace(/,/g, " ").replace(/ /g, " ") + " L " + points[points.length - 1].x + " 35 Z";

    container.innerHTML =
        '<svg class="hm-svg-chart" viewBox="0 0 100 45" preserveAspectRatio="none">' +
        '<defs><linearGradient id="hmVolumeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--brand-action)" stop-opacity="0.35"/><stop offset="100%" stop-color="var(--brand-action)" stop-opacity="0.04"/></linearGradient></defs>' +
        '<line x1="0" y1="9" x2="100" y2="9" stroke="var(--border-default)" stroke-width="0.3" stroke-dasharray="1 1"/>' +
        '<line x1="0" y1="17" x2="100" y2="17" stroke="var(--border-default)" stroke-width="0.3" stroke-dasharray="1 1"/>' +
        '<line x1="0" y1="25" x2="100" y2="25" stroke="var(--border-default)" stroke-width="0.3" stroke-dasharray="1 1"/>' +
        '<line x1="0" y1="33" x2="100" y2="33" stroke="var(--border-default)" stroke-width="0.3" />' +
        '<path d="' + areaPath + '" fill="url(#hmVolumeGrad)" />' +
        '<polyline points="' + line + '" fill="none" stroke="var(--brand-action)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />' +
        '<line x1="50" y1="0" x2="50" y2="34" stroke="var(--warning-fill)" stroke-width="0.4" stroke-dasharray="1.3 1.3"/>' +
        points.map(function (p) {
            return '<circle cx="' + p.x + '" cy="' + p.y + '" r="1.4" fill="var(--surface-default)" stroke="var(--brand-action)" stroke-width="0.8"/>';
        }).join("") +
        weekdays.map(function (d, i) {
            var x = (i * (100 / 6)).toFixed(2);
            return '<text x="' + x + '" y="42" font-size="3" text-anchor="middle" fill="var(--text-caption)" font-weight="600">' + d + "</text>";
        }).join("") +
        "</svg>";
}

function openReportsMapModal(e) {
    if (e) e.preventDefault();
    openModal("reportsMapModal");
}

function renderAgentPerformance(agents) {
    var rows = document.querySelectorAll(".hm-agent-row");
    if (!rows.length || !agents.length) return;
    var sorted = agents.slice().sort(function (a, b) { return (b.tasks_count || 0) - (a.tasks_count || 0); });
    rows.forEach(function (row, idx) {
        var agent = sorted[idx];
        if (!agent) return;
        var score = Math.max(60, 100 - (agent.tasks_count || 0) * 7);
        var name = row.querySelector(".hm-agent-name");
        var fill = row.querySelector(".hm-agent-bar-fill");
        var pct = row.querySelector(".hm-agent-pct");
        if (name) name.textContent = agent.name;
        if (fill) fill.style.width = score + "%";
        if (pct) pct.textContent = score + "%";
    });
}

function renderIssuesTable(orders) {
    var tbody = document.querySelector(".hm-itable tbody");
    if (!tbody) return;
    var problematic = orders.filter(function (o) { return o.status === "Failed" || o.status === "Pending"; }).slice(0, 4);
    if (!problematic.length) return;
    tbody.innerHTML = problematic.map(function (o) {
        var cls = o.status === "Failed" ? "ibadge-err" : "ibadge-warn";
        var txt = o.status === "Failed" ? "Delayed" : "Attention";
        return (
            "<tr>" +
                "<td>" + o.order_id + "</td>" +
                "<td>Order needs operational review at " + getHubName(o.pickup_hub_id) + "</td>" +
                "<td>" + (getAgentName(o.agent_id) || "Unassigned") + "</td>" +
                '<td><span class="hm-ibadge ' + cls + '">' + txt + "</span></td>" +
            "</tr>"
        );
    }).join("");
}

function renderHubPerformance() {
    var grid = document.querySelector(".hm-hub-grid");
    if (!grid) return;
    var hubs = (window.mockData.hubs || []).slice(0, 3);
    var orders = window.mockData.orders || [];
    grid.innerHTML = hubs.map(function (hub) {
        var hubOrders = orders.filter(function (o) { return o.pickup_hub_id === hub.hub_id; });
        var delivered = hubOrders.filter(function (o) { return o.status === "Delivered"; }).length;
        var active = hubOrders.length - delivered;
        var capacity = Math.min(95, 35 + hubOrders.length * 3);
        return (
            '<div class="hm-hub-block">' +
                '<div class="hm-hub-bheader"><span class="hm-hub-btitle">' + hub.name.replace(" Logistics", "").replace(" Distribution Center", "") + '</span><span class="hm-badge-status ' + (capacity > 80 ? "status-busy" : "status-active") + '">' + (capacity > 80 ? "Busy" : "Active") + '</span></div>' +
                '<div class="hm-hub-metrics"><div class="hm-hmetric"><div class="hm-hmetric-label">Deliveries Today</div><div class="hm-hmetric-val">' + delivered + '</div></div><div class="hm-hmetric"><div class="hm-hmetric-label">Active Orders</div><div class="hm-hmetric-val">' + active + "</div></div></div>" +
                '<div class="hm-hub-cap-area"><div class="hm-hub-cap-label">Capacity</div><div class="hm-agent-bar" style="height:4px;"><div class="hm-agent-bar-fill" style="width:' + capacity + '%"></div></div><div class="hm-hub-cap-pct">' + capacity + "%</div></div>" +
            "</div>"
        );
    }).join("");
}

function exportReport() {
    var data = filterOrdersByHub(window.mockData.orders || []);
    exportCSV(data, "hub_report");
    showSuccessTick("Report exported");
    showToast("Report exported as CSV", "success");
}
