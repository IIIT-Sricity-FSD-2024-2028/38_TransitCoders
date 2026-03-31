/**
 * SwiftTrack — State Compatibility Layer
 * Re-implements old schemas via Adapter Pattern on top of state.orders
 */
(function () {
    'use strict';
    var getState  = window.AppState.getState;
    var saveState = window.AppState.saveState;

    // Seed complaints, feedback, zones into central state if empty
    (function seedSuperUserData() {
        var s = getState();
        var changed = false;

        if (!s.complaints || s.complaints.length === 0) {
            s.complaints = [
                { id: "CMP-901", customer: "John Doe", date: "2026-03-29", type: "Delayed Delivery", priority: "High", status: "Open" },
                { id: "CMP-902", customer: "Alice Smith", date: "2026-03-28", type: "Damaged Package", priority: "Critical", status: "Escalated" },
                { id: "CMP-903", customer: "Bob Brown", date: "2026-03-27", type: "Rude Behavior", priority: "Medium", status: "Resolved" },
                { id: "CMP-904", customer: "Eve White", date: "2026-03-27", type: "Missing Item", priority: "Low", status: "Resolved" }
            ];
            changed = true;
        }

        if (!s.feedback || s.feedback.length === 0) {
            s.feedback = [
                { id: "FB-001", customer: "Zane Tech", date: "2026-03-29", rating: 5, comment: "Great speed and friendly driver!", status: "Reviewed" },
                { id: "FB-002", customer: "Mark M.", date: "2026-03-28", rating: 2, comment: "Box was crushed on one side.", status: "Pending" },
                { id: "FB-003", customer: "Lucy K.", date: "2026-03-27", rating: 4, comment: "Good tracking UI but slightly delayed.", status: "Pending" },
                { id: "FB-004", customer: "Tim H.", date: "2026-03-26", rating: 1, comment: "Driver tossed it over the fence.", status: "Reviewed" }
            ];
            changed = true;
        }

        if (!s.zones || s.zones.length === 0) {
            s.zones = [
                { id: "ZON-1", name: "North Hub", region: "Greater North", boundaries: "ZIP 1000-1999" },
                { id: "ZON-2", name: "East Coast Ops", region: "East Metro", boundaries: "ZIP 2000-2999" },
                { id: "ZON-3", name: "Central District", region: "Downtown", boundaries: "ZIP 3000-3500" }
            ];
            changed = true;
        }

        if (!s.roles || s.roles.length === 0) {
            s.roles = [
                { name: 'Super User', permissions: { manageUsers: true, manageComplaints: true, viewReports: true, configureSystem: true, manageDatabase: true } },
                { name: 'Admin', permissions: { manageUsers: true, manageComplaints: true, viewReports: true, configureSystem: false, manageDatabase: false } },
                { name: 'Merchant', permissions: { manageUsers: false, manageComplaints: true, viewReports: false, configureSystem: false, manageDatabase: false } },
                { name: 'Delivery Agent', permissions: { manageUsers: false, manageComplaints: false, viewReports: false, configureSystem: false, manageDatabase: false } },
                { name: 'Customer', permissions: { manageUsers: false, manageComplaints: false, viewReports: false, configureSystem: false, manageDatabase: false } }
            ];
            changed = true;
        }

        // Seed security logs into central state
        if (!s.securityLogs || s.securityLogs.length === 0) {
            s.securityLogs = [
                { time: "2026-03-29 14:12:00", user: "alice@swifttrack.com", action: "User Login", ip: "192.168.1.100", status: "Success" },
                { time: "2026-03-29 13:45:12", user: "system", action: "Database Backup", ip: "localhost", status: "Success" },
                { time: "2026-03-29 12:30:45", user: "unknown", action: "Failed Login", ip: "203.0.113.44", status: "Failed" },
                { time: "2026-03-28 22:15:20", user: "bob@swifttrack.com", action: "Deleted Zone ZON-3", ip: "10.0.0.5", status: "Success" },
                { time: "2026-03-28 15:40:02", user: "admin@swifttrack.com", action: "Exported Reports", ip: "192.168.1.201", status: "Success" },
                { time: "2026-03-28 10:22:33", user: "hm_chennai@swifttrack.com", action: "Order ORD_1 dispatched", ip: "10.0.0.12", status: "Success" },
                { time: "2026-03-27 21:14:05", user: "karthik@swifttrack.com", action: "Delivery Completed ORD_5", ip: "10.0.0.30", status: "Success" },
                { time: "2026-03-27 09:05:18", user: "merchant@swifttrack.com", action: "New Order Created", ip: "192.168.1.55", status: "Success" }
            ];
            changed = true;
        }

        if (changed) saveState(s);
    })();

    // Massive Localized Data Generation
    (function seedMassiveLocalizedData() {
        var s = getState();
        var changed = false;

        // Ensure 5 specific hubs exist
        var hubNames = ['Chennai Central Hub', 'Karimnagar City Hub', 'Bangalore Logistics Park', 'Visakhapatnam Port Hub', 'Hyderabad Logistics Hub'];
        var locs = ['Chennai', 'Karimnagar', 'Bangalore', 'Visakhapatnam', 'Hyderabad'];
        if (!s.hubs || s.hubs.length < 5 || s.hubs[1].name !== 'Bangalore Logistics Hub') {
            s.hubs = hubNames.map(function(n, i) {
                return { hub_id: 'hub_0' + (i + 1), name: n, location: locs[i], status: 'Active' };
            });
            changed = true;
        }

        // Generate Agents & Customers if lacking
        var agentsCount = s.users.filter(function(u){ return u.role === 'delivery_agent'; }).length;
        if (agentsCount < 25) {
            // Remove existing mocked agents/customers except hub managers and super admins
            s.users = s.users.filter(function(u) { return u.role !== 'delivery_agent' && u.role !== 'customer'; });
            
            var agentNames = ['Ramesh', 'Suresh', 'Karthik', 'Vijay', 'Ajith', 'Pawan', 'Mahesh', 'Prabhas', 'Allu', 'Ram', 'NTR', 'Gautham', 'Vikram', 'Dhanush', 'Siva', 'Surya', 'Karthi', 'Kamal', 'Rajini', 'Ravi', 'Jiiva', 'Arya', 'Vishal', 'Jayam', 'Madhavan'];
            var plates = ['TN-09', 'KA-01', 'TS-02', 'AP-31', 'TS-09'];
            
            s.hubs.forEach(function(h, idx) {
                var prefix = plates[idx % plates.length];
                for (var i = 0; i < 5; i++) {
                    var aName = agentNames[idx * 5 + i];
                    var ag = {
                        user_id: 'U_AGT_' + h.hub_id + '_' + i,
                        name: aName + ' (Agent)',
                        email: aName.toLowerCase() + '_' + i + '@swifttrack.com',
                        password: 'password123',
                        role: 'delivery_agent',
                        hub_id: h.hub_id,
                        active: true,
                        vehicle: prefix + ' ' + (1000 + Math.floor(Math.random()*9000))
                    };
                    s.users.push(ag);
                }
            });

            var custNames = ['Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Diya', 'Aditya', 'Aryan', 'Kavya', 'Sai', 'Arjun', 'Siddharth', 'Riya', 'Aadhya', 'Krishna', 'Ishaan', 'Shaurya', 'Ayaan', 'Navya', 'Dhruv', 'Kabir', 'Ritika', 'Anushka', 'Rudra', 'Anika', 'Prisha', 'Atharv', 'Ojas', 'Zara', 'Meera', 'Rohan', 'Neha', 'Maya', 'Rahul', 'Sneha', 'Varun', 'Kiran', 'Nisha', 'Ravi', 'Pooja', 'Anjali', 'Kunal', 'Shruti', 'Vikram', 'Priya', 'Mohit', 'Swati', 'Sanjay', 'Divya', 'Suresh', 'Lakshmi'];
            for (var c = 0; c < 50; c++) {
                var cu = {
                    user_id: 'U_CUS_' + c,
                    name: custNames[c],
                    email: custNames[c].toLowerCase() + c + '@mail.com',
                    password: 'password',
                    role: 'customer',
                    active: true
                };
                s.users.push(cu);
            }
            changed = true;
        }

        // Generate massive orders if lacking
        if (!s.orders || s.orders.length < 100) {
            s.orders = [];
            var orderStatuses = ['Pending', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed'];
            var localStreets = [
                ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'Mylapore'], // Chennai
                ['Indiranagar', 'Koramangala', 'Whitefield', 'Jayanagar', 'Malleswaram'], // Bangalore
                ['Civil Lines', 'Mankammathota', 'Mukarampura', 'Vidyanagar', 'Jyothi Nagar'], // Karimnagar
                ['MVP Colony', 'Gajuwaka', 'Dwaraka Nagar', 'Rushikonda', 'Madhurawada'], // Visakhapatnam
                ['Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kukatpally', 'Gachibowli'] // Hyderabad
            ];
            
            var generatedAgents = s.users.filter(function(u){ return u.role === 'delivery_agent'; });
            var generatedCustomers = s.users.filter(function(u){ return u.role === 'customer'; });

            for (var o = 1; o <= 120; o++) {
                var hIdx = o % 5;
                var hub = s.hubs[hIdx];
                var stat = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
                var cust = generatedCustomers[Math.floor(Math.random() * generatedCustomers.length)];
                
                var hubAgents = generatedAgents.filter(function(a) { return a.hub_id === hub.hub_id; });
                var assignedAgent = (stat === 'Pending' || stat === 'Failed') ? null : hubAgents[Math.floor(Math.random() * hubAgents.length)].user_id;
                var cityPrefix = hub.name.substring(0,3).toUpperCase();
                
                var date = new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000));
                var street = localStreets[hIdx][Math.floor(Math.random() * localStreets[hIdx].length)];

                s.orders.push({
                    order_id: 'ORD_' + (1000 + o),
                    tracking_id: 'TRK-' + cityPrefix + '-' + (8000 + o),
                    merchant_id: 'U_MER_1',
                    customer_id: cust.user_id,
                    customer_name: cust.name,
                    customer_phone: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
                    pickup_address: hub.name,
                    delivery_address: Math.floor(Math.random()*100+1) + ' ' + street + ', ' + hub.location,
                    package_type: Math.random() > 0.7 ? 'Express' : 'Standard',
                    weight: parseFloat((1 + Math.random() * 5).toFixed(1)),
                    amount: Math.floor(200 + Math.random() * 800),
                    status: stat,
                    created_at: date.toISOString(),
                    assigned_hub: hub.hub_id,
                    assigned_agent: assignedAgent
                });
            }
            changed = true;
        }

        // Retroactive DATA AUDIT: Ensure NO assigned_hub is null across all orders
        s.orders.forEach(function(o) {
            if (!o.assigned_hub || o.assigned_hub === "null" || o.assigned_hub === null) {
                var addrLower = (o.pickup_address + ' ' + o.delivery_address).toLowerCase();
                var fallbackHub = addrLower.indexOf('karimnagar') !== -1 ? 'hub_02' :
                                  addrLower.indexOf('bengaluru') !== -1 ? 'hub_03' :
                                  addrLower.indexOf('visakhapatnam') !== -1 ? 'hub_04' :
                                  addrLower.indexOf('hyderabad') !== -1 ? 'hub_05' : 'hub_01';
                o.assigned_hub = o.pickup_hub_id || fallbackHub;
                o.pickup_hub_id = o.assigned_hub;
                changed = true;
            }
        });

        if (changed) saveState(s);
    })();


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
                var addr = (o.pickup_address || '').toLowerCase();
                var fallback_hub = addr.indexOf('karimnagar') !== -1 ? 'hub_02' :
                                   addr.indexOf('bengaluru') !== -1 ? 'hub_03' :
                                   addr.indexOf('visakhapatnam') !== -1 ? 'hub_04' :
                                   addr.indexOf('hyderabad') !== -1 ? 'hub_05' : 'hub_01';
                return Object.assign({}, o, { 
                    pickup_hub_id: o.assigned_hub || o.pickup_hub_id || fallback_hub 
                }); 
            }); 
        },
        get agents() { 
            return getState().users.filter(function(u){ return u.role === 'delivery_agent'; }).map(function(u) {
                return {
                    agent_id: u.user_id,
                    user_id: u.user_id,
                    name: u.name,
                    role: 'Delivery Agent',
                    hub_id: u.hub_id,
                    status: 'Available',
                    vehicle_type: u.vehicle || 'Van',
                    tasks_count: getState().orders.filter(function(o){ return o.assigned_agent === u.user_id && o.status !== 'Delivered' && o.status !== 'Cancelled'; }).length
                };
            });
        },
        get hubs() { return getState().hubs || []; },

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
            
            // Hub Mapper: Mapping based on "delivery_address" or "pickup_address"
            var hmap = {
                "chennai": "hub_01",
                "karimnagar": "hub_02",
                "bengaluru": "hub_03",
                "visakhapatnam": "hub_04",
                "hyderabad": "hub_05"
            };
            var destLower = ((d.dest || '') + ' ' + (d.origin || '')).toLowerCase();
            var matchedHub = "hub_01"; // Fallback to Chennai
            for (var k in hmap) {
                if (destLower.indexOf(k) !== -1) { matchedHub = hmap[k]; break; }
            }

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
                pickup_hub_id: matchedHub,
                assigned_hub: matchedHub, 
                assigned_agent: null
            };
            s.orders.unshift(o); saveState(s);
            console.log("🟢 [MERCHANT] Order Created for Hub:", o.assigned_hub);
            try {
                window.dispatchEvent(new Event('appStateChanged'));
                window.dispatchEvent(new StorageEvent('storage', { key: 'swifttrack_central_state', newValue: JSON.stringify(s) }));
            } catch(e) {}
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
        get orders() { 
            var sess = JSON.parse(sessionStorage.getItem('st_session') || localStorage.getItem('user') || '{}');
            var uId = sess.user_id || 'U_AGT_102';
            return getState().orders.filter(function(o){ return o.assigned_agent === uId }).map(toAgentOrder); 
        },
        get history() { 
            var sess = JSON.parse(sessionStorage.getItem('st_session') || localStorage.getItem('user') || '{}');
            var uId = sess.user_id || 'U_AGT_102';
            return getState().orders.filter(function(o){ return o.assigned_agent === uId && o.status === 'Delivered' }).map(toAgentOrder); 
        },
        
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
                
                if (o.status === 'Delivered') {
                    console.log("🟠 [AGENT] Delivery Complete. State Synced.");
                }
                
                saveState(s); 
                try {
                    window.dispatchEvent(new Event('appStateChanged'));
                    window.dispatchEvent(new StorageEvent('storage', { key: 'swifttrack_central_state', newValue: JSON.stringify(s) }));
                } catch(e) {}
                
                return true;
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
        if (agentName === 'U_AGT_102') agentName = 'Karthik';
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
                assigned_agent: d.assignedAgent === 'Unassigned' ? null : (d.assignedAgent === 'Karthik' ? 'U_AGT_102' : d.assignedAgent)
            };
            s.orders.unshift(o); saveState(s);
        },
        updateOrder: function(id, d){
            var s = getState(); var o = s.orders.find(function(x){ return x.order_id === id; });
            if(o){ 
                if (d.customerName !== undefined) o.customer_name = d.customerName;
                if (d.assignedAgent !== undefined) {
                    var agId = d.assignedAgent === 'Unassigned' ? null : (d.assignedAgent === 'Karthik' ? 'U_AGT_102' : d.assignedAgent);
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
        getAgents: function(){ return getState().adminAgents && getState().adminAgents.length ? getState().adminAgents : [{id:'A1', name:'Karthik', status:'Available', distanceAway:'2.5 km', user_id:'U_AGT_102'}]; },
        getTransfers: function(){ return getState().transfers; },
        getComplaints: function(){ return getState().complaints; },
        getReports: function(){ return getState().adminReports; }
    };

    /* 5. StorageAPI (Super User Interface Proxy) — FULL CRUD */
    window.StorageAPI = {
        init: function() { return Promise.resolve(); },

        _save: function(k, d) { 
            var s = getState(); 
            s[k] = d; 
            saveState(s); 
        },

        /* --- USERS --- */
        getUsers: function() { 
            return getState().users.map(function(u){
                var roleMap = {
                    'super_user': 'Super User',
                    'hub_manager': 'Admin',
                    'merchant': 'Merchant',
                    'delivery_agent': 'Delivery Agent',
                    'customer': 'Customer'
                };
                return { 
                    id: u.user_id, 
                    name: u.name, 
                    email: u.email, 
                    role: roleMap[u.role] || u.role || 'Customer', 
                    status: u.active !== false ? 'Active' : 'Inactive', 
                    lastLogin: u.lastLogin || 'Recent' 
                };
            });
        },
        addUser: function(u) { 
            var s = getState(); 
            var roleRevMap = {
                'Super User': 'super_user',
                'Admin': 'hub_manager',
                'Merchant': 'merchant',
                'Delivery Agent': 'delivery_agent',
                'Customer': 'customer'
            };
            var newUser = {
                user_id: 'USR-' + Math.floor(Math.random()*9000+1000),
                name: u.name,
                email: u.email,
                password: 'password123',
                role: roleRevMap[u.role] || u.role,
                active: (u.status === 'Active'),
                lastLogin: 'Never'
            };
            s.users.push(newUser); 
            saveState(s);
            // Log the action
            this._addSecurityLog('User Created: ' + newUser.name);
        },
        updateUser: function(id, d) {
            var s = getState(); 
            var u = s.users.find(function(x){ return x.user_id === id; });
            if(u) { 
                if (d.name) u.name = d.name;
                if (d.email) u.email = d.email;
                if (d.role) {
                    var roleRevMap = {
                        'Super User': 'super_user',
                        'Admin': 'hub_manager',
                        'Merchant': 'merchant',
                        'Delivery Agent': 'delivery_agent',
                        'Customer': 'customer'
                    };
                    u.role = roleRevMap[d.role] || d.role;
                }
                if (d.status) u.active = (d.status === 'Active');
                saveState(s); 
                this._addSecurityLog('User Updated: ' + u.name);
            }
        },
        deleteUser: function(id) {
            var s = getState(); 
            var deletedUser = s.users.find(function(x){ return x.user_id === id; });
            s.users = s.users.filter(function(x){ return x.user_id !== id; }); 
            saveState(s);
            if (deletedUser) this._addSecurityLog('User Deleted: ' + deletedUser.name);
        },

        /* --- COMPLAINTS --- */
        getComplaints: function() { return getState().complaints || []; },
        updateComplaintStatus: function(id, ns) {
            var s = getState(); 
            var c = (s.complaints || []).find(function(x){ return x.id === id; });
            if(c){ c.status = ns; saveState(s); }
        },

        /* --- FEEDBACK --- */
        getFeedback: function() { return getState().feedback || []; },
        updateFeedbackStatus: function(id, ns) {
            var s = getState();
            var f = (s.feedback || []).find(function(x) { return x.id === id; });
            if (f) { f.status = ns; saveState(s); }
        },

        /* --- ROLES --- */
        getRoles: function() { return getState().roles || []; },
        updateRolePermissions: function(roleName, permissions) {
            var s = getState();
            var r = (s.roles || []).find(function(x) { return x.name === roleName; });
            if (r) { r.permissions = permissions; saveState(s); }
        },

        /* --- ZONES --- */
        getZones: function() { return getState().zones || []; },
        addZone: function(zone) {
            var s = getState();
            zone.id = 'ZON-' + Math.floor(Math.random() * 9000 + 1000);
            if (!s.zones) s.zones = [];
            s.zones.push(zone);
            saveState(s);
            return zone;
        },
        updateZone: function(id, data) {
            var s = getState();
            var z = (s.zones || []).find(function(x) { return x.id === id; });
            if (z) { Object.assign(z, data); saveState(s); }
        },
        deleteZone: function(id) {
            var s = getState();
            s.zones = (s.zones || []).filter(function(x) { return x.id !== id; });
            saveState(s);
        },

        /* --- ORDERS (Super Admin full access) --- */
        getOrders: function() { return getState().orders || []; },
        getHubs: function() { return getState().hubs || []; },

        /* --- SECURITY LOGS --- */
        getSecurityLogs: function() { return getState().securityLogs || []; },
        _addSecurityLog: function(action) {
            var s = getState();
            if (!s.securityLogs) s.securityLogs = [];
            s.securityLogs.unshift({
                time: new Date().toISOString().replace('T', ' ').slice(0, 19),
                user: 'admin@swifttrack.com',
                action: action,
                ip: '192.168.1.1',
                status: 'Success'
            });
            saveState(s);
        },

        /* --- NOTIFICATIONS (Super Admin) --- */
        getNotifications: function() { return getState().notifications || []; },
        addNotification: function(n) {
            var s = getState();
            if (!s.notifications) s.notifications = [];
            n.id = 'NOT-' + Date.now();
            n.time = new Date().toISOString();
            n.read = false;
            s.notifications.unshift(n);
            saveState(s);
        },
        markNotificationRead: function(id) {
            var s = getState();
            var n = (s.notifications || []).find(function(x) { return x.id === id; });
            if (n) { n.read = true; saveState(s); }
        }
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
