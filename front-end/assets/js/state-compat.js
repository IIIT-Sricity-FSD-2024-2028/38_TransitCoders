/**
 * SwiftTrack — State Compatibility Layer
 * Re-implements old schemas via Adapter Pattern on top of state.orders
 */
(function () {
    'use strict';
    var getState  = window.AppState.getState;
    var saveState = window.AppState.saveState;

    // Agent name <-> ID lookup maps dynamically derived
    function getAgentIdToName() {
        var map = {};
        getState().users.forEach(function(u){ if (u.role === 'delivery_agent') map[u.user_id] = u.name; });
        return map;
    }
    function getAgentNameToId() {
        var map = {};
        getState().users.forEach(function(u){ if (u.role === 'delivery_agent') map[u.name] = u.user_id; });
        return map;
    }

    // ADAPTER: CANONICAL -> MERCHANT
    function toMerchantShipment(o) {
        if (!o) return null;
        var st = String(o.status).toLowerCase();
        if (st.indexOf('transit') !== -1 || st.indexOf('delivery') !== -1) st = 'in-transit';
        else if (st.indexOf('deliv') !== -1) st = 'delivered';
        else if (st.indexOf('can') !== -1) st = 'cancelled';
        else st = 'pending';

        return {
            id: o.tracking_id,
            recipient: o.customer_name,
            origin: o.pickup_address,
            dest: o.delivery_address,
            service: o.package_type,
            weight: o.weight + ' kg',
            amount: '₹' + o.amount,
            date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            status: st,
            merchantId: o.merchant_id
        };
    }

    // ADAPTER: CANONICAL -> AGENT
    function toAgentOrder(o) {
        if (!o) return null;
        var st = String(o.status).toLowerCase();
        if (st.indexOf('out for') !== -1) st = 'in-transit';
        else if (st.indexOf('transit') !== -1) st = 'in-transit';
        else if (st === 'delivered') st = 'delivered';
        else if (st === 'assigned' || st === 'picked up') st = 'pending';
        else if (st === 'cancelled') st = 'delivered'; // hide cancelled from agent worklist
        else st = 'pending';

        var pri = o.package_type === 'Express' ? 'High' : 'Medium';
        var numId = parseInt(o.order_id.replace(/\D/g,'')) || 0;
        return {
            id: numId,
            _ref: o.order_id,
            customer: o.customer_name,
            phone: o.customer_phone,
            status: st,
            priority: pri,
            origin: o.pickup_address,
            destination: o.delivery_address,
            destinationFull: o.delivery_address,
            eta: '02:00 PM',
            etaMinutes: 12 + (numId % 35),
            distanceKm: parseFloat((2.4 + ((numId % 28) / 5)).toFixed(1)),
            distance: parseFloat((2.4 + ((numId % 28) / 5)).toFixed(1)) + ' km',
            amount: o.amount,
            weight: o.weight + ' kg',
            volume: (30 + (numId % 50)) + 'x' + (20 + (numId % 40)) + 'x' + (10 + (numId % 30)) + ' cm',
            fragile: o.package_type === 'Express',
            packageId: 4400 + numId,
            paymentMode: numId % 3 === 0 ? 'COD' : 'Prepaid'
        };
    }

    /* Helper: get logged-in agent's user_id from session */
    function _getAgentId() {
        try {
            // 'user' is the canonical session key (st_session was removed in auth.js)
            var raw = sessionStorage.getItem('user') || localStorage.getItem('user') || '{}';
            var sess = JSON.parse(raw);
            return sess.user_id || sess.id || '';
        } catch(e) { return ''; }
    }

    /* 1. window.mockData (Hub Manager proxy) */
    window.mockData = {
        get users() { return getState().users; },
        get orders() { 
            return getState().orders.map(function(o) { 
                var addr = ((o.pickup_address || '') + ' ' + (o.delivery_address || '')).toLowerCase();
                var fallback_hub = (addr.indexOf('bengaluru') !== -1 || addr.indexOf('bangalore') !== -1 || addr.indexOf('banglore') !== -1) ? 'H002' :
                                   addr.indexOf('hyderabad') !== -1 ? 'H003' :
                                   addr.indexOf('karimnagar') !== -1 ? 'H004' :
                                   (addr.indexOf('visakhapatnam') !== -1 || addr.indexOf('vizag') !== -1) ? 'H005' : 'H001';
                
                var current_hub = o.assigned_hub || o.pickup_hub_id;
                // Correct default assignments if user typed a specific destination during testing
                if ((!current_hub || current_hub === 'H001') && fallback_hub !== 'H001') {
                    current_hub = fallback_hub;
                }
                
                return Object.assign({}, o, { 
                    pickup_hub_id: current_hub 
                }); 
            }); 
        },
        get agents() { 
            var state = getState();
            var activeCounts = {};
            state.orders.forEach(function(o) {
                if (o.assigned_agent && o.status !== window.SwiftTrackEnums.OrderStatus.DELIVERED && o.status !== window.SwiftTrackEnums.OrderStatus.CANCELLED) {
                    activeCounts[o.assigned_agent] = (activeCounts[o.assigned_agent] || 0) + 1;
                }
            });
            return state.users.filter(function(u){ return u.role === 'delivery_agent'; }).map(function(u) {
                return {
                    agent_id: u.user_id,
                    user_id: u.user_id,
                    name: u.name,
                    role: 'Delivery Agent',
                    hub_id: u.hub_id,
                    status: u.active ? 'Available' : 'Unavailable',
                    vehicle_type: u.vehicle || 'Van',
                    tasks_count: activeCounts[u.user_id] || 0
                };
            });
        },
        get hubs() {
            return getState().hubs;
        },
        get hubComplaints() { return getState().complaints; },
        get alerts() { return []; },
        get notifications() { return []; }
    };

    /* 2. MockDB (Merchant Portal Proxy) */
    window.MockDB = {
        get shipments() { return getState().orders.map(toMerchantShipment); },
        getShipmentsPaginated: function(page, limit) {
            var all = this.shipments;
            var start = (page - 1) * limit;
            return {
                data: all.slice(start, start + limit),
                total: all.length,
                page: page,
                totalPages: Math.ceil(all.length / limit)
            };
        },
        get tickets()   { return getState().merchantTickets; },
        get users()     { return getState().users; },

        login: function (email, password) {
            var u = getState().users.find(function(u){ return u.email === email && u.password === password; });
            if (u) {
                var d = { user_id: u.user_id, name: u.name, email: u.email, role: u.role, hub_id: u.hub_id, active: true, avatar: u.avatar };
                sessionStorage.setItem('st_session', JSON.stringify(d)); localStorage.setItem('user', JSON.stringify(d));
                return d;
            } return null;
        },
        logout: function () { sessionStorage.removeItem('st_session'); localStorage.removeItem('user'); },
        restoreSession: function () { var s = sessionStorage.getItem('st_session') || localStorage.getItem('user'); return s ? JSON.parse(s) : null; },

        getStats: function (mId) {
            var s = this.shipments;
            if (mId) s = s.filter(function(x){ return x.merchantId === mId; });
            return {
                total: s.length, delivered: s.filter(function(x){ return x.status==='delivered'; }).length,
                inTransit: s.filter(function(x){ return x.status==='in-transit'; }).length,
                pending: s.filter(function(x){ return x.status==='pending'; }).length,
                cancelled: s.filter(function(x){ return x.status==='cancelled'; }).length,
                revenue: s.reduce(function(acc, x){ return acc + parseFloat((x.amount||'0').replace('₹','')); }, 0).toFixed(2)
            };
        },
        getShipment: function (id) { return this.shipments.find(function(s){ return s.id === id; }); },
        getShipments: function (mId) { return mId ? this.shipments.filter(function(s){ return s.merchantId === mId; }) : this.shipments; },
        addShipment: function (d) {
            var sess = JSON.parse(sessionStorage.getItem('st_session') || '{}');
            var s = getState();
            var nId = 'ORD_' + (s.orders.length + 100);
            
            // Map origin to a hub ID
            var addressSearch = ((d.origin || '') + ' ' + (d.dest || '')).toLowerCase();
            var hubId = 'H001'; // Default: Chennai
            if (addressSearch.includes('bengaluru') || addressSearch.includes('bangalore') || addressSearch.includes('banglore')) hubId = 'H002';
            else if (addressSearch.includes('hyderabad')) hubId = 'H003';
            else if (addressSearch.includes('karimnagar')) hubId = 'H004';
            else if (addressSearch.includes('visakhapatnam') || addressSearch.includes('vizag')) hubId = 'H005';

            var o = {
                order_id: nId,
                tracking_id: 'SWT-' + Date.now().toString().slice(-6),
                merchant_id: sess.user_id || 'U_MER_1',
                customer_name: d.recipient,
                customer_phone: '+91 0000 00000',
                delivery_address: d.dest,
                pickup_address: d.origin,
                package_type: d.service,
                weight: parseFloat(d.weight)||1.0,
                amount: parseFloat(d.amount.replace('₹',''))||0,
                status: window.SwiftTrackEnums.OrderStatus.PENDING,
                created_at: new Date().toISOString(),
                assigned_hub: null, 
                assigned_agent: null,
                pickup_hub_id: hubId
            };
            s.orders.unshift(o); saveState(s);
            return toMerchantShipment(o);
        },
        updateShipment: function (id, u) {
            var s = getState();
            var o = s.orders.find(function(x){ return x.tracking_id === id; });
            if (!o) return null;
            if (u.status) o.status = u.status === 'in-transit' ? 'In Transit' : u.status === 'delivered' ? 'Delivered' : u.status === 'cancelled' ? 'Cancelled' : 'Pending';
            saveState(s); return toMerchantShipment(o);
        },
        deleteShipment: function (id) {
            var s = getState();
            var len = s.orders.length;
            s.orders = s.orders.filter(function(x){ return x.tracking_id !== id; });
            if (s.orders.length < len) { saveState(s); return true; } return false;
        },
        addTicket: function (d) {
            var s = getState();
            if (!s.merchantTickets) s.merchantTickets = [];
            var nId = 'TKT-' + (s.merchantTickets.length + 1000);
            var t = {
                id: nId,
                subject: d.subject || 'Support Request',
                tid: d.tid || 'N/A',
                priority: d.priority || 'medium',
                status: 'open',
                date: new Date().toISOString()
            };
            s.merchantTickets.unshift(t); saveState(s);
            return t;
        },
        updateTicket: function (id, u) {
            var s = getState();
            var t = (s.merchantTickets || []).find(function(x){ return x.id === id; });
            if (!t) return null;
            if (u.status) t.status = u.status;
            saveState(s); return t;
        },
        deleteTicket: function (id) {
            var s = getState();
            if (!s.merchantTickets) return false;
            var len = s.merchantTickets.length;
            s.merchantTickets = s.merchantTickets.filter(function(x){ return x.id !== id; });
            if (s.merchantTickets.length < len) { saveState(s); return true; } return false;
        }
    };

    /* 3. DeliveryData (Agent Interface Proxy) — uses session-based agent ID */
    window.DeliveryData = {
        get orders() { var aid = _getAgentId(); return getState().orders.filter(function(o){ return o.assigned_agent === aid; }).map(toAgentOrder); },
        get history() { var aid = _getAgentId(); return getState().orders.filter(function(o){ return o.assigned_agent === aid && o.status === 'Delivered'; }).map(toAgentOrder); },
        
        getOrders: function (f) {
            f = f || 'all';
            var ords = this.orders;
            if (f === 'all') return ords;
            return ords.filter(function (o) { return o.status === f; });
        },
        getOrderCounts: function () {
            var ords = this.orders;
            return {
                all: ords.length, pending: ords.filter(function(o){return o.status==='pending'}).length,
                'in-transit': ords.filter(function(o){return o.status==='in-transit'}).length,
                delivered: ords.filter(function(o){return o.status==='delivered'}).length
            };
        },
        getTotalDeliveriesToday: function () { return this.orders.filter(function(o){ return o.status !== 'delivered'; }).length; },
        getOrderById: function (id) { return this.orders.find(function(o){ return o.id === parseInt(id); }); },
        updateOrderStatus: function (id, ns) {
            var s = getState();
            var o = s.orders.find(function(x){ 
                var oid = parseInt(x.order_id.replace('ORD_','')) || 0;
                return oid === parseInt(id) || x.tracking_id === String(id);
            });
            if (o) {
                var st = String(ns).toLowerCase();
                if (st.indexOf('transit') !== -1) o.status = 'In Transit';
                else if (st.indexOf('delivery') !== -1) o.status = 'Out for Delivery';
                else if (st.indexOf('deliv') !== -1) o.status = 'Delivered';
                else if (st.indexOf('can') !== -1) o.status = 'Cancelled';
                else o.status = 'Pending';
                saveState(s); return true;
            } return false;
        },
        getProfile: function () { 
            var sess = {};
            try { sess = JSON.parse(sessionStorage.getItem('user') || sessionStorage.getItem('st_session') || '{}'); } catch(e) {}
            var uId = sess.user_id || 'U_AGT_102';
            
            var s = getState();
            var realUser = s.users.find(function(u){ return u.user_id === uId; }) || {};
            var hubInfo = s.hubs.find(function(h){ return h.hub_id === realUser.hub_id; }) || { name: 'Swift Hub', hub_id: 'H000' };

            var numericId = (realUser.user_id || '').replace(/\D/g, '') || '000';
            
            var p = {
                name: realUser.name || sess.name || 'Agent',
                agentId: 'DA' + numericId,
                role: 'Delivery Agent',
                phone: realUser.phone || ('+91 98' + numericId.padEnd(8, '456')),
                email: realUser.email || sess.email || 'agent@swifttrack.com',
                licenseNo: 'TN' + numericId.padStart(2, '0') + '2023000' + numericId,
                joinedDate: '12 Jan 2026',
                contractStatus: realUser.active ? 'Active' : 'Inactive',
                currentStatus: (s.agentProfile && s.agentProfile.currentStatus) || 'available',
                performance: { total: 210, completed: 198, failed: 12, rating: 4.6 },
                vehicle: {
                    number: realUser.vehicle || ('TN 09 ' + numericId.padStart(4, '0')),
                    type: realUser.vehicle_type || 'Van',
                    capacity: '30 kg',
                    status: 'Active'
                },
                hub: {
                    name: hubInfo.name || hubInfo.location || 'Central Hub',
                    code: hubInfo.hub_id || 'H000',
                    contact: '+91 44 2345 6789'
                }
            };
            return p;
        },
        updateProfileStatus: function (ns) { var s = getState(); if(s.agentProfile){ s.agentProfile.currentStatus = ns; saveState(s); } },
        getHistory: function (p) { return this.history; },
        submitReport: function (report) {
            var s = getState();
            if (!s.complaints) s.complaints = [];
            s.complaints.push({
                id: 'RPT-' + Date.now().toString().slice(-6),
                order_id: report.orderId || '',
                type: report.issueType || 'other',
                details: report.details || {},
                status: 'Open',
                date: new Date().toISOString()
            });
            saveState(s);
            return true;
        }
    };

    // ADAPTER: CANONICAL -> ADMIN (resolves all agent IDs to display names)
    function toAdminOrder(o) {
        if (!o) return null;
        var pri = o.package_type === 'Express' ? 'High' : 'Medium';
        var agentName = o.assigned_agent;
        if (agentName && getAgentIdToName()[agentName]) agentName = getAgentIdToName()[agentName];
        return {
            id: o.order_id,
            tracking_id: o.tracking_id,
            customerName: o.customer_name,
            assignedAgent: agentName || 'Unassigned',
            pickupHub: o.pickup_address || o.assigned_hub || 'Hub Central',
            deliveryLocation: o.delivery_address,
            status: o.status,
            priority: pri,
            date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
    }

    /* 4. AdminStorage (resolves all agent names to IDs) */
    window.AdminStorage = {
        init: async function(){}, _get: function(k){ return JSON.parse(localStorage.getItem('admin_'+k)||'[]'); },
        _save: function(k, d){ localStorage.setItem('admin_'+k, JSON.stringify(d)); window.AppState.notify(); },
        getOrders: function(){ return getState().orders.map(toAdminOrder); },
        getOrdersPaginated: function(page, limit) {
            var all = this.getOrders();
            var start = (page - 1) * limit;
            return {
                data: all.slice(start, start + limit),
                total: all.length,
                page: page,
                totalPages: Math.ceil(all.length / limit)
            };
        },
        addOrder: function(d) {
            var s = getState();
            var o = {
                order_id: d.id || 'ORD_' + (s.orders.length + 100),
                tracking_id: 'SWT-' + Date.now().toString().slice(-6),
                merchant_id: 'U_MER_1',
                customer_name: d.customerName,
                customer_phone: '+91 0000 00000',
                delivery_address: d.deliveryLocation,
                pickup_address: d.pickupHub,
                package_type: d.priority === 'High' || d.priority === 'Critical' ? 'Express' : 'Standard',
                weight: 1.0, amount: 0,
                status: d.status || 'Pending',
                created_at: new Date().toISOString(),
                assigned_hub: d.pickupHub, 
                assigned_agent: d.assignedAgent === 'Unassigned' ? null : (getAgentNameToId()[d.assignedAgent] || d.assignedAgent)
            };
            s.orders.unshift(o); saveState(s);
        },
        updateOrder: function(id, d){
            var s = getState(); var o = s.orders.find(function(x){ return x.order_id === id; });
            if(o){ 
                if (d.customerName !== undefined) o.customer_name = d.customerName;
                if (d.assignedAgent !== undefined) {
                    var agId = d.assignedAgent === 'Unassigned' ? null : (getAgentNameToId()[d.assignedAgent] || d.assignedAgent);
                    o.assigned_agent = agId;
                }
                if (d.pickupHub !== undefined) { o.assigned_hub = d.pickupHub; o.pickup_address = d.pickupHub; }
                if (d.deliveryLocation !== undefined) o.delivery_address = d.deliveryLocation;
                if (d.status !== undefined) o.status = d.status;
                if (d.priority !== undefined) o.package_type = d.priority === 'High' || d.priority === 'Critical' ? 'Express' : 'Standard';
                saveState(s); 
            }
        },
        deleteOrder: function(id) {
            var s = getState();
            var len = s.orders.length;
            s.orders = s.orders.filter(function(x) { return x.order_id !== id; });
            if (s.orders.length < len) saveState(s);
        },
        getAgents: function(){ 
            return getState().users.filter(function(u){ return u.role === 'delivery_agent'; }).map(function(u){
                return { id: u.user_id, name: u.name, status: u.active ? 'Available' : 'Unavailable', distanceAway: '--', user_id: u.user_id };
            });
        },
        getTransfers: function(){ return getState().transfers; },
        getComplaints: function(){ return getState().complaints; },
        getReports: function(){ return getState().adminReports; }
    };

    /* 5. StorageAPI (Super User Interface Proxy) */
    window.StorageAPI = {
        init: function() { return Promise.resolve(); },
        _save: function(k, d) { var s = getState(); s[k] = d; saveState(s); },
        getUsers: function() { 
            return getState().users.map(function(u){
                var status = u.active ? 'Active' : (u.pending !== false ? 'Pending' : 'Inactive');
                return { id: u.user_id, name: u.name, email: u.email, role: u.role, status: status, lastLogin: u.active ? 'Recent' : 'Never' }; // Password stripped
            });
        },
        addUser: function(u) { 
            var s = getState(); 
            u.user_id = 'USR-' + Math.floor(Math.random()*9000+1000);
            u.active = (u.status === 'Active');
            s.users.push(u); saveState(s);
        },
        updateUser: function(id, d) {
            var s = getState(); var u = s.users.find(function(x){ return x.user_id === id; });
            if(u) { Object.assign(u, d); u.active = (d.status === 'Active'); saveState(s); }
        },
        deleteUser: function(id) {
            var s = getState(); s.users = s.users.filter(function(x){ return x.user_id !== id; }); saveState(s);
        },
        getComplaints: function() { return getState().complaints; },
        getFeedback: function() { return getState().feedback; },
        updateComplaintStatus: function(id, ns) {
            var s = getState(); var c = s.complaints.find(function(x){ return x.id === id; });
            if(c){ c.status = ns; saveState(s); }
        },
        getRoles: function() { return getState().roles || []; },
        updateRolePermissions: function(roleId, perms) {
            var s = getState();
            var r = (s.roles || []).find(function(x) { return x.id === roleId; });
            if (r) { r.permissions = perms; saveState(s); }
        },
        updateFeedbackStatus: function(id, ns) {
            var s = getState(); var f = s.feedback.find(function(x){ return x.id === id; });
            if(f){ f.status = ns; saveState(s); }
        },
        getZones: function() { return getState().zones || []; }
    };

    /* 6. CustomerAPI (Customer Dashboard Proxy) — filters by logged-in user's name */
    window.CustomerAPI = {
        getOrders: function() {
            var sess = null;
            try { sess = JSON.parse(sessionStorage.getItem('user') || sessionStorage.getItem('st_session') || '{}'); } catch(e) {}
            var userName = (sess && sess.name) ? sess.name : '';
            return getState().orders.filter(function(o){
                return o.customer_name === userName;
            }).map(function(o) {
                var newO = Object.assign({}, o);
                if (newO.assigned_agent && getAgentIdToName()[newO.assigned_agent]) {
                    newO.assigned_agent = getAgentIdToName()[newO.assigned_agent];
                }
                return newO;
            });
        },
        addComplaint: function(c) {
            var s = getState();
            c.id = 'CMP-' + Date.now().toString().slice(-4);
            c.date = new Date().toISOString();
            s.complaints.push(c); saveState(s);
        },
        addFeedback: function(f) {
            var s = getState();
            f.id = 'FB-' + Date.now().toString().slice(-4);
            s.feedback.push(f); saveState(s);
        }
    };

    // SYSTEM-WIDE UI INJECTION (Auto-runs on all authenticated portals)
    function populateSessionDataUI() {
        try {
            var userStr = sessionStorage.getItem('user') || sessionStorage.getItem('st_session');
            if (!userStr) return;
            var u = JSON.parse(userStr);
            
            // Inject Names
            document.querySelectorAll('.user-name, #dropdown-name, .hm-user-name, .hm-navbar-user-name, .u-name, #user-name-text, .user-info-name, .user-profile .name').forEach(function(el) {
                el.textContent = u.name;
            });

            // Special handler for profile-name to maintain active badge
            document.querySelectorAll('#profile-name').forEach(function(el) {
                var badge = el.querySelector('.active-badge');
                el.innerHTML = u.name + (badge ? ' <span class="active-badge">' + badge.textContent + '</span>' : '');
            });

            // Inject Roles
            var displayRole = (u.role || '').replace('_', ' ').replace(/\b\w/g, function(l){ return l.toUpperCase() });
            document.querySelectorAll('.user-role, .profile-role, .hm-user-role, .user-profile .role').forEach(function(el) { el.textContent = displayRole; });
            
            // Inject Initials for Avatar
            var initials = (u.name || 'User').split(' ').map(function(n){ return n[0] }).join('').substring(0,2).toUpperCase();
            document.querySelectorAll('.sidebar-avatar, .user-avatar, .profile-avatar, .hm-avatar, .hm-navbar-avatar, .avatar-initials, #user-avatar-text').forEach(function(el) {
                if (el.tagName !== 'IMG') el.textContent = initials;
            });

            // Clean up Welcome Headings
            document.querySelectorAll('h1').forEach(function(h1) {
                if (h1.textContent.trim().startsWith('Welcome, ')) {
                    h1.textContent = 'Welcome, ' + u.name.split(' ')[0];
                }
            });
        } catch (e) {
            console.log('Error populating session UI:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', populateSessionDataUI);
    } else {
        populateSessionDataUI();
    }

})();
