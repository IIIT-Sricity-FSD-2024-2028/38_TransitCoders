/**
 * SwiftTrack — Centralized State Management (BACKEND-BACKED)
 *
 * The previous implementation persisted everything in localStorage — that is
 * NOT durable persistence and it silently diverged from the real backend.
 *
 * This version makes the NestJS backend (localhost:3001) the single source
 * of truth:
 *   - AppState.hydrate()  — async: fetches users/orders/hubs/agents/
 *                           complaints/feedback/roles/tickets from the API
 *                           and builds the in-memory cache.
 *   - AppState.getState() — synchronous read of the hydrated cache (same
 *                           shape the UI always consumed).
 *   - AppState.saveState()— kept for compatibility: it NO LONGER writes
 *                           entity data to localStorage. It simply triggers
 *                           a backend refresh so any stale local mutation is
 *                           overwritten by authoritative data.
 *   - AppState.refresh()  — re-fetch from the backend + notify listeners.
 *
 * Only non-entity UI preferences (theme) remain in localStorage.
 */
(function () {
    'use strict';

    // Global Enums (unchanged — UI depends on these)
    window.SwiftTrackEnums = {
        OrderStatus: {
            PENDING: 'Pending',
            ASSIGNED: 'Assigned',
            IN_TRANSIT: 'In Transit',
            OUT_FOR_DELIVERY: 'Out for Delivery',
            DELIVERED: 'Delivered',
            FAILED: 'Failed',
            CANCELLED: 'Cancelled'
        },
        UserStatus: {
            ACTIVE: 'Active',
            PENDING: 'Pending',
            INACTIVE: 'Inactive',
            SUSPENDED: 'Suspended'
        },
        ComplaintStatus: {
            OPEN: 'Open',
            IN_PROGRESS: 'In Progress',
            RESOLVED: 'Resolved',
            ESCALATED: 'Escalated'
        },
        TicketStatus: {
            OPEN: 'open',
            RESOLVED: 'resolved'
        },
        FeedbackStatus: {
            PENDING: 'Pending',
            REVIEWED: 'Reviewed'
        }
    };

    var STORAGE_KEY = 'swifttrack_central_state'; // kept only for theme/legacy prefs

    // ── Backend → frontend canonical mappers ─────────────────────────────────
    function mapStatusToUi(s) {
        switch (String(s || '')) {
            case 'InTransit': return 'In Transit';
            case 'OutForDelivery': return 'Out for Delivery';
            case 'PickedUp': return 'Picked Up';
            case 'Pending': return 'Pending';
            case 'Assigned': return 'Assigned';
            case 'Delivered': return 'Delivered';
            case 'Cancelled': return 'Cancelled';
            case 'Returned': return 'Returned';
            case 'Failed': return 'Failed';
            default: return s || 'Pending';
        }
    }

    function mapOrder(o) {
        if (!o) return null;
        return {
            id: o.id,
            order_id: o.orderId,
            tracking_id: o.trackingId,
            merchant_id: o.merchantId,
            customer_id: o.customerId,
            customer_name: o.customerName || '',
            customer_phone: o.customerPhone || '',
            pickup_address: o.pickupAddress || '',
            delivery_address: o.deliveryAddress || '',
            pickup_hub_id: o.pickupHubId || null,
            delivery_hub_id: o.deliveryHubId || null,
            assigned_hub: o.pickupHubId || null,
            assigned_agent: o.assignedAgentId || null,
            package_type: o.packageType || 'Standard',
            service_level: o.serviceLevel || 'standard',
            weight: o.weight || 0,
            amount: o.amount || 0,
            payment_mode: o.paymentMode || 'Prepaid',
            payment_status: o.paymentStatus || 'pending',
            priority: o.priority || 'Medium',
            status: mapStatusToUi(o.status),
            estimated_delivery: o.estimatedDelivery || null,
            pickup_scheduled_at: o.pickupScheduledAt || null,
            timeline: o.statusHistory || [],
            created_at: o.createdAt,
            updated_at: o.updatedAt
        };
    }

    function mapUser(u) {
        if (!u) return null;
        return {
            user_id: u.id,
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            hub_id: u.hubId || null,
            hubId: u.hubId || null,
            phone: u.phone || '',
            company: u.company || '',
            active: u.isActive !== false,
            isActive: u.isActive !== false,
            createdAt: u.createdAt
        };
    }

    function mapHub(h) {
        if (!h) return null;
        return {
            id: h.id,
            hub_id: h.hubId,
            name: h.name,
            location: h.city || h.name,
            address: h.address || '',
            city: h.city || '',
            status: (h.status || 'active').charAt(0).toUpperCase() + (h.status || 'active').slice(1),
            capacity: h.capacity || 0,
            currentLoad: h.currentLoad || 0,
            phone: h.phone || '',
            email: h.email || ''
        };
    }

    function mapAgent(a) {
        if (!a) return null;
        return {
            id: a.id,
            agent_id: a.userId,
            user_id: a.userId,
            name: a.name || '',
            phone: a.phone || '',
            hub_id: a.hubId || '',
            availability_status: a.availabilityStatus || 'Available',
            status: a.availabilityStatus || 'Available',
            vehicle_type: a.vehicleType || 'Van',
            tasks_count: a.currentTasksCount || 0,
            currentTasksCount: a.currentTasksCount || 0
        };
    }

    function mapComplaint(c) {
        if (!c) return null;
        return {
            id: c.id,
            customer_id: c.userId,
            userId: c.userId,
            order_id: c.orderId || '',
            description: c.description || '',
            details: c.description || '',
            status: c.status || 'Open',
            created_at: c.createdAt,
            date: (c.createdAt || '').slice(0, 10)
        };
    }

    function mapFeedback(f) {
        if (!f) return null;
        return {
            id: f.id,
            customer_id: f.userId,
            userId: f.userId,
            order_id: f.orderId || '',
            rating: f.rating,
            comment: f.comments || '',
            comments: f.comments || '',
            status: f.status || 'New',
            created_at: f.createdAt,
            date: (f.createdAt || '').slice(0, 10)
        };
    }

    function mapRole(r) {
        if (!r) return null;
        return {
            id: r.roleId || r.id,
            roleId: r.roleId || r.id,
            name: r.name,
            description: r.description || '',
            isSystem: !!r.isSystem,
            permissions: r.permissions || {}
        };
    }

    function mapTicket(t) {
        if (!t) return null;
        return {
            id: t.ticketId || t.id,
            merchantId: t.merchantId,
            merchant_id: t.merchantId,
            subject: t.subject,
            tid: t.trackingId || 'N/A',
            trackingId: t.trackingId || '',
            priority: t.priority || 'med',
            status: t.status || 'open',
            created_at: t.createdAt,
            date: (t.createdAt || '').slice(0, 10)
        };
    }

    // ── Cache ────────────────────────────────────────────────────────────────
    var cache = {
        users: [], hubs: [], agents: [],
        orders: [],
        complaints: [], feedback: [], roles: [],
        merchantTickets: [],
        notifications: [],
        hydrated: false,
        hydrating: null
    };

    function notify() {
        try { window.dispatchEvent(new CustomEvent('appStateChanged')); } catch (e) { }
    }

    /** Fetch everything the logged-in role is allowed to see. */
    function hydrate() {
        if (cache.hydrating) return cache.hydrating;
        cache.hydrating = (async function () {
            var token = null;
            try { token = localStorage.getItem('x-auth-token'); } catch (e) { }

            var hasStoredUser = false;
            try {
                hasStoredUser = !!(sessionStorage.getItem('user') || localStorage.getItem('user'));
            } catch (e) { }

            if (!token || !hasStoredUser || /\/auth\/login\.html$/.test(window.location.pathname) || /\/auth\/register\.html$/.test(window.location.pathname)) {
                cache.hydrated = true;
                cache.hydrating = null;
                if (!token && !hasStoredUser) {
                    try {
                        localStorage.removeItem('x-auth-token');
                        sessionStorage.removeItem('st_session');
                    } catch (e) { }
                }
                return cache;
            }

            var H = { 'Content-Type': 'application/json' };
            if (token) H['x-auth-token'] = token;
            var BASE = window.SWIFTTRACK_API_BASE || 'http://localhost:3001';

            async function get(path) {
                try {
                    var res = await fetch(BASE + path, { headers: H });
                    if (!res.ok) {
                        if (res.status === 401) {
                            try {
                                localStorage.removeItem('x-auth-token');
                                localStorage.removeItem('user');
                                sessionStorage.removeItem('user');
                                sessionStorage.removeItem('st_session');
                            } catch (e) { }
                        }
                        return null;
                    }
                    var j = await res.json();
                    return j.data !== undefined ? j.data : j;
                } catch (e) { return null; }
            }

            var results = await Promise.all([
                get('/orders'), get('/users'), get('/hubs'), get('/agents'),
                get('/complaints'), get('/feedback'), get('/roles'), get('/tickets'),
                get('/notifications')
            ]);

            if (results[0]) cache.orders = results[0].map(mapOrder).filter(Boolean);
            if (results[1]) cache.users = results[1].map(mapUser).filter(Boolean);
            if (results[2]) cache.hubs = results[2].map(mapHub).filter(Boolean);
            if (results[3]) cache.agents = results[3].map(mapAgent).filter(Boolean);
            if (results[4]) cache.complaints = results[4].map(mapComplaint).filter(Boolean);
            if (results[5]) cache.feedback = results[5].map(mapFeedback).filter(Boolean);
            if (results[6]) cache.roles = results[6].map(mapRole).filter(Boolean);
            if (results[7]) cache.merchantTickets = results[7].map(mapTicket).filter(Boolean);
            if (results[8]) cache.notifications = results[8];

            cache.hydrated = true;
            cache.hydrating = null;
            notify();
            return cache;
        })();
        return cache.hydrating;
    }

    function getState() {
        return cache;
    }

    /**
     * Compatibility shim: the old code mutated the state object and called
     * saveState() to persist to localStorage. Entity data is now owned by
     * the backend, so saveState() simply schedules a refresh — authoritative
     * data replaces any local mutation on the next tick.
     */
    function saveState() {
        setTimeout(function () { refresh(); }, 0);
    }

    function refresh() {
        cache.hydrated = false;
        return hydrate();
    }

    // Auto-hydrate on load (fires notify when done)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { hydrate(); });
    } else {
        hydrate();
    }

    window.AppState = {
        getState: getState,
        saveState: saveState,
        refresh: refresh,
        hydrate: hydrate,
        notify: notify,
        STORAGE_KEY: STORAGE_KEY,
        mapOrder: mapOrder,
        mapStatusToUi: mapStatusToUi
    };
    window.getState = getState;
    window.saveState = saveState;

    // Cross-tab refresh signal (entity data lives on the server now)
    window.addEventListener('storage', function (e) {
        if (e.key === 'x-auth-token') refresh();
    });
})();