/**
 * SwiftTrack — Centralized State Management
 * Single source of truth for ALL entities across all roles.
 * Persisted in localStorage, synchronized via 'storage' event across tabs.
 */
(function () {
    'use strict';
    var STORAGE_KEY = 'swifttrack_central_state';

    var defaultState = {
        users: [], hubs: [], agents: [],
        orders: [], /* <--- UNIFIED CANONICAL SOURCE */
        complaints: [], adminAgents: [], transfers: [], adminReports: [],
        merchantTickets: [],
        suUsers: [], suComplaints: [], feedback: [], roles: [], zones: [], notifications: [], customerOrders: [], customerComplaints: [], securityLogs: []
    };

    function getState() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                for (var key in defaultState) { if (!parsed.hasOwnProperty(key)) parsed[key] = defaultState[key]; }
                return parsed;
            }
        } catch (e) { }
        return JSON.parse(JSON.stringify(defaultState));
    }

    function saveState(state) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { }
        notify();
    }

    function addItem(collection, item) { var s = getState(); s[collection].push(item); saveState(s); return item; }
    function updateItem(collection, idF, idV, u) { var s = getState(); var a = s[collection]; for(var i=0;i<a.length;i++){ if(a[i][idF]===idV){ Object.assign(a[i],u); saveState(s); return a[i];} } return null; }
    function deleteItem(collection, idF, idV) { var s = getState(); var b = s[collection].length; s[collection] = s[collection].filter(function(i){return i[idF]!==idV}); if(s[collection].length<b){saveState(s);return true;} return false; }
    function notify() { try { window.dispatchEvent(new CustomEvent('appStateChanged')); } catch(e){} }

    function seedIfEmpty() {
        if (localStorage.getItem(STORAGE_KEY)) return;
        var state = JSON.parse(JSON.stringify(defaultState));
        
        state.hubs = [
            { hub_id: 'hub_01', name: 'Chennai Central Hub', location: 'Chennai', status: 'Active' },
            { hub_id: 'hub_02', name: 'Karimnagar City Hub', location: 'Karimnagar', status: 'Active' },
            { hub_id: 'hub_03', name: 'Bengaluru Logistics Park', location: 'Bengaluru', status: 'Active' },
            { hub_id: 'hub_04', name: 'Visakhapatnam Port Hub', location: 'Visakhapatnam', status: 'Active' },
            { hub_id: 'hub_05', name: 'Hyderabad Logistics Hub', location: 'Hyderabad', status: 'Active' }
        ];

        state.users.push(
            { user_id: 'U_SU_1', name: 'Admin Super User', email: 'admin@swifttrack.com', password: 'admin123', role: 'hub_manager', active: true, avatar: 'AM' },
            { user_id: 'U_MER_1', name: 'Prasanna Raja R', email: 'merchant@swifttrack.com', password: 'merchant123', role: 'merchant', active: true, avatar: 'PR', company: 'Swift Merchants' },
            { user_id: 'U_AGT_102', name: 'Karthik', email: 'karthik@swifttrack.com', password: 'password123', role: 'delivery_agent', hub_id: 'hub_01', active: true },
            { user_id: 'U_HM_1', name: 'Hub Manager Chennai', email: 'hm_chennai@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'hub_01', active: true },
            { user_id: 'U_HM_2', name: 'Hub Manager Karimnagar', email: 'hm_karimnagar@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'hub_02', active: true },
            { user_id: 'U_HM_3', name: 'Hub Manager Bengaluru', email: 'hm_bengaluru@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'hub_03', active: true },
            { user_id: 'U_HM_4', name: 'Hub Manager Visakhapatnam', email: 'hm_visakhapatnam@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'hub_04', active: true },
            { user_id: 'U_HM_5', name: 'Hub Manager Hyderabad', email: 'hm_hyderabad@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'hub_05', active: true },
            { user_id: 'U_SUPER_1', name: 'Super User Admin', email: 'superuser@swifttrack.com', password: 'super123', role: 'super_user', active: true },
            { user_id: 'U_CUS_1', name: 'Priya Iyer', email: 'customer@swifttrack.com', password: 'password', role: 'customer', active: true }
        );

        state.roles = [
            { name: 'Super User', permissions: { manageUsers: true, manageComplaints: true, viewReports: true, configureSystem: true, manageDatabase: true } },
            { name: 'Admin', permissions: { manageUsers: false, manageComplaints: true, viewReports: true, configureSystem: false, manageDatabase: false } }
        ];

        /* --- UNIFIED ORDERS --- */
        var mockCustomers = ['Suresh Iyer', 'Priya Iyer', 'Arjun Menon', 'Lakshmi Menon'];
        var hubCycle = [
            { id: 'H001', pickup: 'Chennai Central Hub', delivery: 'T. Nagar, Chennai' },
            { id: 'H002', pickup: 'Bengaluru Logistics Park', delivery: 'Indiranagar, Bengaluru' },
            { id: 'H003', pickup: 'Hyderabad Logistics Hub', delivery: 'Madhapur, Hyderabad' },
            { id: 'H004', pickup: 'Karimnagar City Hub', delivery: 'Civil Lines, Karimnagar' },
            { id: 'H005', pickup: 'Visakhapatnam Port Hub', delivery: 'MVP Colony, Visakhapatnam' }
        ];
        var statuses = ['Pending', 'Assigned', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'];
        var hubAgents = {
            H001: 'U_AGT_102',
            H002: 'U_AGT_201',
            H003: 'U_AGT_301',
            H004: 'U_AGT_401',
            H005: 'U_AGT_501'
        };
        var orderIndex = 1;
        hubCycle.forEach(function (hubMeta, hubIdx) {
            var ordersPerHub = 7;
            for (var j = 0; j < ordersPerHub; j++) {
                var stat = statuses[(hubIdx + j) % statuses.length];
                var pkgType = j % 3 === 0 ? 'Express' : 'Standard';
                var weight = parseFloat((1.2 + (j * 0.4)).toFixed(1));
                var amount = 650 + (j * 120) + (hubIdx * 50);
                state.orders.push({
                    order_id: 'ORD_' + orderIndex,
                    tracking_id: 'SWT-' + (200000 + orderIndex),
                    merchant_id: 'U_MER_1',
                    customer_name: mockCustomers[(hubIdx + j) % mockCustomers.length],
                    customer_phone: '+91 98450 ' + (1100 + orderIndex),
                    pickup_address: hubMeta.pickup,
                    delivery_address: 'Unit ' + (10 + j) + ', ' + hubMeta.delivery,
                    package_type: pkgType,
                    weight: weight,
                    amount: amount,
                    status: stat,
                    created_at: new Date(Date.now() - ((hubIdx * 3 + j) * 86400000)).toISOString(),
                    assigned_hub: hubMeta.id,
                    assigned_agent: stat === 'Pending' || stat === 'Cancelled' ? null : hubAgents[hubMeta.id]
                });
                orderIndex++;
            }
        });

        /* Legacy agent profile info so settings works */
        state.agentProfile = { name: 'Karthik', currentStatus: 'available', performance: { completed: 271, rating: 4.6 } };

        saveState(state);
    }

    seedIfEmpty();
    
    window.AppState = { getState: getState, saveState: saveState, notify: notify, STORAGE_KEY: STORAGE_KEY };
    window.getState = getState;
    window.saveState = saveState;

    window.addEventListener('storage', function(e) {
        if (e.key === STORAGE_KEY) { notify(); }
    });
})();
