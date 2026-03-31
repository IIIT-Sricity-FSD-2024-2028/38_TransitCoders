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
        suUsers: [], suComplaints: [], feedback: [], roles: [], zones: [], notifications: [], customerOrders: [], customerComplaints: []
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
            { hub_id: 'H001', name: 'Chennai Central Hub', location: 'Chennai', status: 'Active' },
            { hub_id: 'H002', name: 'Bangalore Logistics Park', location: 'Bangalore', status: 'Active' },
            { hub_id: 'H003', name: 'Hyderabad Logistics Hub', location: 'Hyderabad', status: 'Active' }
        ];

        state.users.push(
            { user_id: 'U_SU_1', name: 'Admin Super User', email: 'admin@swifttrack.com', password: 'admin123', role: 'hub_manager', active: true, avatar: 'AM' },
            { user_id: 'U_MER_1', name: 'Prasanna Raja R', email: 'merchant@swifttrack.com', password: 'merchant123', role: 'merchant', active: true, avatar: 'PR', company: 'Swift Merchants' },
            { user_id: 'U_AGT_102', name: 'Mukesh', email: 'mukesh@swifttrack.com', password: 'password123', role: 'delivery_agent', hub_id: 'H001', active: true },
            { user_id: 'U_HM_1', name: 'Hub Manager Chennai', email: 'hm_chennai@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'H001', active: true },
            { user_id: 'U_HM_2', name: 'Hub Manager Bangalore', email: 'hm_bangalore@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'H002', active: true },
            { user_id: 'U_HM_3', name: 'Hub Manager Hyderabad', email: 'hm_hyderabad@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'H003', active: true },
            { user_id: 'U_HM_4', name: 'Hub Manager Karimnagar', email: 'hm_karimnagar@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'H004', active: true },
            { user_id: 'U_SUPER_1', name: 'Super User Admin', email: 'superuser@swifttrack.com', password: 'super123', role: 'super_user', active: true },
            { user_id: 'U_CUS_1', name: 'Priya Sharma', email: 'customer@swifttrack.com', password: 'password', role: 'customer', active: true }
        );

        state.roles = [
            { name: 'Super User', permissions: { manageUsers: true, manageComplaints: true, viewReports: true, configureSystem: true, manageDatabase: true } },
            { name: 'Admin', permissions: { manageUsers: false, manageComplaints: true, viewReports: true, configureSystem: false, manageDatabase: false } }
        ];

        /* --- UNIFIED ORDERS --- */
        var mockCustomers = ['Rajesh Kumar', 'Priya Sharma', 'Arun Mehta', 'Suresh Pillai'];
        var statuses = ['Pending', 'Assigned', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'];
        for (var i = 1; i <= 15; i++) {
            var stat = statuses[i % 6];
            state.orders.push({
                order_id: 'ORD_' + i,                 // Used by Admin, Agent routing id = i
                tracking_id: 'SWT-' + (200000 + i),   // Used by Merchant UI
                merchant_id: 'U_MER_1',
                customer_name: mockCustomers[i % 4],
                customer_phone: '+91 98450 ' + (1000 + i),
                pickup_address: 'Chennai Central Hub',
                delivery_address: 'Flat ' + i + ', Tech Park, Chennai',
                package_type: i % 2 === 0 ? 'Express' : 'Standard',
                weight: parseFloat((1.5 + (i * 0.2)).toFixed(1)),
                amount: 500 + (i * 100),
                status: stat,                         // Global normalized status
                created_at: new Date(Date.now() - i * 86400000).toISOString(),
                assigned_hub: 'H001',
                assigned_agent: stat === 'Pending' || stat === 'Cancelled' ? null : 'U_AGT_102'
            });
        }

        /* Legacy agent profile info so settings works */
        state.agentProfile = { name: 'Mukesh', currentStatus: 'available', performance: { completed: 271, rating: 4.6 } };

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
