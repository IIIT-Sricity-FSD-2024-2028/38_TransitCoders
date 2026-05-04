/**
 * Customer Tracking Page — Dynamic order tracking from centralized state
 * Reads ?id= URL parameter and populates tracking details from state.orders[]
 */

(function () {
    'use strict';

    function getUrlParam(key) {
        var params = new URLSearchParams(window.location.search);
        return params.get(key);
    }

    function getStatusStep(status) {
        var st = String(status).toLowerCase();
        if (st === 'pending') return 1;
        if (st === 'assigned' || st === 'picked up') return 2;
        if (st.indexOf('transit') !== -1) return 3;
        if (st.indexOf('out for') !== -1) return 4;
        if (st === 'delivered') return 5;
        if (st === 'cancelled') return 0;
        return 1;
    }

    function getStatusColor(status) {
        var st = String(status).toLowerCase();
        if (st === 'delivered') return '#22c55e';
        if (st.indexOf('transit') !== -1 || st.indexOf('out for') !== -1) return '#f97316';
        if (st === 'cancelled') return '#ef4444';
        return '#3b82f6';
    }

    function formatTime(isoStr) {
        if (!isoStr) return '--';
        try {
            var d = new Date(isoStr);
            return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) { return '--'; }
    }

    function formatDate(isoStr) {
        if (!isoStr) return '--';
        try {
            var d = new Date(isoStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) { return '--'; }
    }

    function getAgentName(agentId) {
        if (!agentId) return null;
        var state = window.AppState.getState();
        var agent = state.users.find(function (u) { return u.user_id === agentId; });
        return agent ? agent.name : agentId;
    }

    function generatePIN(orderId) {
        // Derive a deterministic 4-digit PIN from the order ID
        var hash = 0;
        var str = String(orderId);
        for (var i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return String(Math.abs(hash) % 10000).padStart(4, '0');
    }

    window.doTrackCustomer = function() {
        var input = document.getElementById('track-input');
        var error = document.getElementById('track-error');
        if (!input || !input.value.trim()) {
            if (error) {
                error.textContent = 'Please enter a tracking ID.';
                error.style.display = 'block';
            }
            return;
        }
        
        // Simply redirect to trigger loadTracking
        window.location.href = '?id=' + encodeURIComponent(input.value.trim());
    };

    function loadTracking() {
        var trackingId = getUrlParam('id');
        var grid = document.getElementById('customer-tracking-grid');
        var resultWrapper = document.getElementById('track-result');
        var trackInput = document.getElementById('track-input');
        var error = document.getElementById('track-error');
        
        if (trackInput && trackingId) {
            trackInput.value = trackingId;
        }

        if (!trackingId || !grid) return;

        if (resultWrapper) resultWrapper.style.display = 'block';

        // Find order by tracking_id or order_id
        var state = window.AppState.getState();
        var order = state.orders.find(function (o) {
            return o.tracking_id === trackingId || o.order_id === trackingId;
        });

        if (!order) {
            grid.innerHTML =
                '<div style="grid-column: 1 / -1; text-align:center; padding:60px 20px;">' +
                    '<div style="font-size:50px;margin-bottom:16px;">📦</div>' +
                    '<div style="font-weight:700; font-size:20px; color:var(--dark); margin-bottom:8px;">Shipment Not Found</div>' +
                    '<div style="font-size:14px;color:var(--mid);">We couldn\'t locate tracking ID <strong>' + trackingId + '</strong> in our system.</div>' +
                '</div>';
            return;
        }

        var step = getStatusStep(order.status);
        var color = getStatusColor(order.status);
        
        // ── Update Map Info Cards ──
        var tidEl = document.getElementById('track-tid');
        var badgeEl = document.getElementById('track-status-badge');
        var fromEl = document.getElementById('track-from');
        var toEl = document.getElementById('track-to');
        var recvEl = document.getElementById('track-recv');
        var svcEl = document.getElementById('track-svc');

        if (tidEl) tidEl.textContent = order.tracking_id || order.order_id;
        if (badgeEl) badgeEl.innerHTML = '<span class="badge" style="background:' + color + '22; color:' + color + ';">' + order.status + '</span>';
        if (fromEl) fromEl.textContent = (order.pickup_address || 'Origin').split(',')[0];
        if (toEl) toEl.textContent = (order.delivery_address || 'Destination').split(',')[0];
        
        if (recvEl) recvEl.textContent = order.customer_name || order.recipient_name || 'Customer';
        if (svcEl) svcEl.textContent = order.package_type || 'Standard Delivery';

        // ── Agent Profile Card ──
        var agentCard = document.getElementById('agent-profile-card');
        var agentNameEl = document.getElementById('agent-name');
        var agentVehicleEl = document.getElementById('agent-vehicle');
        var agentAvatarEl = document.getElementById('agent-avatar-text');
        
        if (order.status === 'Out for Delivery' || order.status === 'In Transit' || order.assigned_agent) {
            if (agentCard) agentCard.style.display = 'flex';
            // Find agent details if available in mock data
            var agent = state.users ? state.users.find(u => u.user_id === order.assigned_agent) : null;
            var agentName = agent ? agent.name : (order.assigned_agent || 'Delivery Executive');
            var initials = agentName.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
            
            if (agentNameEl) agentNameEl.textContent = agentName;
            if (agentAvatarEl) agentAvatarEl.textContent = initials;
            if (agentVehicleEl) agentVehicleEl.textContent = agent ? (agent.vehicle || 'TN-01-XY-9876') : 'TN-01-XY-9876';
        } else {
            if (agentCard) agentCard.style.display = 'none';
        }

        // ── Update Map Pins ──
        // In the new layout: .origin, .dest, .current
        var originPin = document.querySelector('.map-pin.origin');
        var destPin = document.querySelector('.map-pin.dest');
        var currentPin = document.querySelector('.map-pin.current');
        var animatedRoute = document.querySelector('.map-route-svg path[stroke="var(--orange)"]');

        if (originPin && destPin && currentPin) {
            // Position pins based on step
            if (step <= 1) {
                currentPin.style.display = 'none';
                if (animatedRoute) animatedRoute.style.display = 'none';
            } else if (step >= 5) {
                currentPin.style.display = 'none';
                destPin.querySelector('.map-pin-inner').style.background = '#22c55e'; // turn green
                if (animatedRoute) animatedRoute.style.display = 'none';
            } else {
                currentPin.style.display = 'flex';
                if (animatedRoute) animatedRoute.style.display = 'block';
                // Move current pin to middle for Transit
                currentPin.style.top = '53%';
                currentPin.style.left = '58%';
            }
        }

        // ── Build timeline steps dynamically ──
        var history = order.status_history || [];
        if (history.length === 0) {
            history = [{ status: 'Order Created', location: order.pickup_address, timestamp: order.created_at, note: 'Shipment request received.' }];
        }
        
        var baseSteps = [
            { id: 1, label: 'Order Placed', match: ['pending', 'created'] },
            { id: 2, label: 'Picked Up', match: ['assigned', 'picked up'] },
            { id: 3, label: 'In Transit', match: ['transit'] },
            { id: 4, label: 'Out for Delivery', match: ['out for'] },
            { id: 5, label: 'Delivered', match: ['delivered'] }
        ];

        var timelineHtml = baseSteps.map(function(bs) {
            var matchingHist = history.find(function(h) {
                return bs.match.some(function(m) { return String(h.status).toLowerCase().includes(m); });
            });
            
            var isCompleted = !!matchingHist || step > bs.id;
            var isCurrent = step === bs.id;
            var isFuture = step < bs.id;
            
            // Map merchant styling dots: done-dot, active-dot, future-dot
            var dotClass = isFuture ? 'future-dot' : (isCurrent ? 'active-dot' : 'done-dot');
            // Connectors
            var lineHtml = bs.id < 5 ? '<div class="tl-line-v ' + (!isFuture && !isCurrent ? 'done-line' : '') + '"></div>' : '';
            
            var timeStr = matchingHist ? formatTime(matchingHist.timestamp) : 'Pending';
            var dateStr = matchingHist ? formatDate(matchingHist.timestamp) : '';
            var descStr = matchingHist ? (matchingHist.note || matchingHist.location) : '';
            
            if (bs.id === 1 && !matchingHist) { timeStr = formatTime(order.created_at); dateStr = formatDate(order.created_at); }

            var fullTime = isFuture ? '<span style="color:var(--light)">Expected Soon</span>' : dateStr + ' &middot; ' + timeStr;

            var titleColor = isFuture ? 'color:var(--mid)' : 'color:var(--dark)';

            return '<div class="tl-item">' +
                '<div class="tl-left">' +
                    '<div class="tl-dot ' + dotClass + '"></div>' +
                    lineHtml +
                '</div>' +
                '<div class="tl-content">' +
                    '<div class="tl-title" style="' + titleColor + '">' + bs.label + (descStr ? ' &ndash; ' + descStr : '') + '</div>' +
                    '<div class="tl-time">' + fullTime + '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        var trackContainer = document.getElementById('dynamic-timeline-track');
        if (trackContainer) {
            trackContainer.innerHTML = timelineHtml;
        }
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        loadTracking();
        // Wire up topbar search box
        var searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                    window.location.href = 'tracking.html?id=' + encodeURIComponent(searchInput.value.trim());
                }
            });
        }
    }

    // Re-render when state changes (agent updates status in another tab)
    window.addEventListener('appStateChanged', loadTracking);
    window.addEventListener('storage', function (e) {
        if (e.key === window.AppState.STORAGE_KEY) loadTracking();
    });
})();
