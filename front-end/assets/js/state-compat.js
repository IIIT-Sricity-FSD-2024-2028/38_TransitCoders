/**
 * SwiftTrack — State Compatibility Layer
 * Re-implements old schemas via Adapter Pattern on top of state.orders
 */
(function () {
    'use strict';
    var getState  = window.AppState.getState;
    var saveState = window.AppState.saveState;

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
        if (st.indexOf('transit') !== -1 || st.indexOf('delivery') !== -1) st = 'in-transit';
        else if (st.indexOf('deliv') !== -1) st = 'delivered';
        else st = 'pending';

        var pri = o.package_type === 'Express' ? 'High' : 'Medium';
        return {
            id: parseInt(o.order_id.replace('ORD_','')) || 0,
            _ref: o.order_id,
            customer: o.customer_name,
            phone: o.customer_phone,
            status: st,
            priority: pri,
            origin: o.pickup_address,
            destination: o.delivery_address,
            destinationFull: o.delivery_address,
            eta: '02:00 PM',
            etaMinutes: 20,
            distance: '5 km',
            amount: o.amount,
            weight: o.weight + ' kg'
        };
    }

    /* 1. window.mockData (Hub Manager proxy) */
    window.mockData = {
        get users() { return getState().users; },
        get orders() { 
            return getState().orders.map(function(o) { 
                var fallback_hub = o.pickup_address && o.pickup_address.toLowerCase().indexOf('bangalore') !== -1 ? 'H002' : 
                                   o.pickup_address && o.pickup_address.toLowerCase().indexOf('hyderabad') !== -1 ? 'H003' : 'H001';
                return Object.assign({}, o, { 
                    pickup_hub_id: o.assigned_hub || o.pickup_hub_id || fallback_hub 
                }); 
            }); 
        },
        get agents() { 
            return [{
                agent_id: 'U_AGT_102',
                user_id: 'U_AGT_102',
                name: 'Mukesh',
                role: 'Delivery Agent',
                hub_id: 'H001',
                status: 'Available',
                vehicle_type: 'Van',
                tasks_count: getState().orders.filter(function(o){ return o.assigned_agent === 'U_AGT_102' }).length
            }];
        },
        get hubs() {
            return [
                { hub_id: 'H001', name: 'Hub Central', location: 'Chennai HQ', status: 'Active' },
                { hub_id: 'H002', name: 'Hub North', location: 'Bangalore Center', status: 'Active' },
                { hub_id: 'H003', name: 'Hub South', location: 'Delhi Metro', status: 'Active' }
            ];
        },
        get hubComplaints() { return getState().complaints; },
        get alerts() { return []; },
        get notifications() { return []; }
    };

    /* 2. MockDB (Merchant Portal Proxy) */
    window.MockDB = {
        get shipments() { return getState().orders.map(toMerchantShipment); },
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
                status: 'Pending',
                created_at: new Date().toISOString(),
                assigned_hub: null, assigned_agent: null
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
        }
    };

    /* 3. DeliveryData (Agent Interface Proxy) */
    window.DeliveryData = {
        get orders() { return getState().orders.filter(function(o){ return o.assigned_agent === 'U_AGT_102' }).map(toAgentOrder); },
        get history() { return getState().orders.filter(function(o){ return o.assigned_agent === 'U_AGT_102' && o.status === 'Delivered' }).map(toAgentOrder); },
        
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
        getProfile: function () { return getState().agentProfile; },
        updateProfileStatus: function (ns) { var s = getState(); if(s.agentProfile){ s.agentProfile.currentStatus = ns; saveState(s); } },
        getHistory: function (p) { return this.history; }
    };

    // ADAPTER: CANONICAL -> ADMIN
    function toAdminOrder(o) {
        if (!o) return null;
        var pri = o.package_type === 'Express' ? 'High' : 'Medium';
        var agentName = o.assigned_agent;
        if (agentName === 'U_AGT_102') agentName = 'Mukesh';
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

    /* 4. AdminStorage */
    window.AdminStorage = {
        init: async function(){}, _get: function(k){ return JSON.parse(localStorage.getItem('admin_'+k)||'[]'); },
        _save: function(k, d){ localStorage.setItem('admin_'+k, JSON.stringify(d)); window.AppState.notify(); },
        getOrders: function(){ return getState().orders.map(toAdminOrder); },
        addOrder: function(d) {
            var s = getState();
            var o = {
                order_id: d.id || 'ORD_' + (s.orders.length + 100),
                tracking_id: 'SWT-' + Date.now().toString().slice(-6),
                merchant_id: 'U_MER_1', // default for manual admin
                customer_name: d.customerName,
                customer_phone: '+91 0000 00000',
                delivery_address: d.deliveryLocation,
                pickup_address: d.pickupHub,
                package_type: d.priority === 'High' || d.priority === 'Critical' ? 'Express' : 'Standard',
                weight: 1.0, amount: 0,
                status: d.status || 'Pending',
                created_at: new Date().toISOString(),
                assigned_hub: d.pickupHub, 
                assigned_agent: d.assignedAgent === 'Unassigned' ? null : (d.assignedAgent === 'Mukesh' ? 'U_AGT_102' : d.assignedAgent)
            };
            s.orders.unshift(o); saveState(s);
        },
        updateOrder: function(id, d){
            var s = getState(); var o = s.orders.find(function(x){ return x.order_id === id; });
            if(o){ 
                if (d.customerName !== undefined) o.customer_name = d.customerName;
                if (d.assignedAgent !== undefined) {
                    var agId = d.assignedAgent === 'Unassigned' ? null : (d.assignedAgent === 'Mukesh' ? 'U_AGT_102' : d.assignedAgent);
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
        getAgents: function(){ return getState().adminAgents && getState().adminAgents.length ? getState().adminAgents : [{id:'A1', name:'Mukesh', status:'Available', distanceAway:'2.5 km', user_id:'U_AGT_102'}]; },
        getTransfers: function(){ return getState().transfers; },
        getComplaints: function(){ return getState().complaints; },
        getReports: function(){ return getState().adminReports; }
    };

    /* 5. StorageAPI (Super-User) */
    window.StorageAPI = {
        init: async function(){},
        _save: function(k,d){ window.AppState.saveState(getState()); },
        getUsers: function(){ return getState().users; },
        addUser: function(d){ var s=getState(); s.users.push(d); saveState(s); },
        updateUser: function(id, d){ var s=getState(); var u=s.users.find(function(x){return x.user_id===id;}); if(u){Object.assign(u,d);saveState(s);} },
        deleteUser: function(id){ var s=getState(); s.users=s.users.filter(function(x){return x.user_id!==id;}); saveState(s); },
        getComplaints: function(){ return getState().suComplaints; },
        getRoles: function(){ return getState().roles; }
    };
    /* 5. StorageAPI (Super User Interface Proxy) */
    window.StorageAPI = {
        init: function() { return Promise.resolve(); },
        _save: function(k, d) { var s = getState(); s[k] = d; saveState(s); },
        getUsers: function() { 
            return getState().users.map(function(u){
                return { id: u.user_id, name: u.name, email: u.email, role: u.role, status: u.active ? 'Active' : 'Inactive', lastLogin: 'Recent' };
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
        getZones: function() { return getState().zones || []; }
    };

    /* 6. CustomerAPI (Customer Dashboard Proxy) */
    window.CustomerAPI = {
        getOrders: function() { return getState().orders.filter(function(o){ return o.customer_email === 'customer@swifttrack.com' || o.customer_id === 'U_CUS_1'; }); },
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

})();
