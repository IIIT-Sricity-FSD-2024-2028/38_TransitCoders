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
            { hub_id: 'H002', name: 'Bengaluru Logistics Park', location: 'Bengaluru', status: 'Active' },
            { hub_id: 'H003', name: 'Hyderabad Logistics Hub', location: 'Hyderabad', status: 'Active' },
            { hub_id: 'H004', name: 'Kharimnagar City Hub', location: 'Kharimnagar', status: 'Active' },
            { hub_id: 'H005', name: 'Visakhapatnam Port Hub', location: 'Visakhapatnam', status: 'Active' }
        ];

        state.users.push(
            { user_id: 'U_SU_1', name: 'Admin Super User', email: 'admin@swifttrack.com', password: 'admin123', role: 'hub_manager', active: true, avatar: 'AM' },
            { user_id: 'U_MER_1', name: 'Prasanna Raja R', email: 'merchant@swifttrack.com', password: 'merchant123', role: 'merchant', active: true, avatar: 'PR', company: 'Swift Merchants' },
            { user_id: 'U_AGT_102', name: 'Karthik', email: 'karthik@swifttrack.com', password: 'password123', role: 'delivery_agent', hub_id: 'H001', active: true },
            { user_id: 'U_AGT_103', name: 'Akhil Menon', email: 'akhil.menon@swifttrack.com', password: 'password123', role: 'delivery_agent', hub_id: 'H001', active: true },
            { user_id: 'U_AGT_104', name: 'Meera Iyer', email: 'meera.iyer@swifttrack.com', password: 'password123', role: 'delivery_agent', hub_id: 'H002', active: true },
            { user_id: 'U_AGT_105', name: 'Sanjay Rao', email: 'sanjay.rao@swifttrack.com', password: 'password123', role: 'delivery_agent', hub_id: 'H003', active: true },
            { user_id: 'U_HM_1', name: 'Asha Nair', email: 'hm_chennai@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'H001', active: true },
            { user_id: 'U_HM_2', name: 'Kiran Reddy', email: 'hm_bengaluru@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'H002', active: true },
            { user_id: 'U_HM_3', name: 'Deepa Iyer', email: 'hm_hyderabad@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'H003', active: true },
            { user_id: 'U_HM_4', name: 'Manoj Menon', email: 'hm_kharimnagar@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'H004', active: true },
            { user_id: 'U_HM_5', name: 'Harish Kumar', email: 'hm_visakhapatnam@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'H005', active: true },
            { user_id: 'U_SUPER_1', name: 'Super User Admin', email: 'superuser@swifttrack.com', password: 'super123', role: 'super_user', active: true },
            { user_id: 'U_CUS_1', name: 'Priya Iyer', email: 'customer@swifttrack.com', password: 'password', role: 'customer', active: true }
        );

        // 25 dynamically generated Delivery Agents
        var agentNames = ['Ramesh', 'Suresh', 'Rahul', 'Vijay', 'Ajith', 'Pawan', 'Mahesh', 'Prabhas', 'Allu', 'Ram', 'NTR', 'Gautham', 'Vikram', 'Dhanush', 'Siva', 'Surya', 'Karthi', 'Kamal', 'Rajini', 'Ravi', 'Jiiva', 'Arya', 'Vishal', 'Jayam', 'Madhavan'];
        var plates = ['TN-09', 'KA-01', 'TS-02', 'AP-31', 'TS-09'];
        state.hubs.forEach(function(h, idx) {
            var prefix = plates[idx % plates.length];
            for (var i = 0; i < 5; i++) {
                var aName = agentNames[idx * 5 + i];
                state.users.push({
                    user_id: 'U_AGT_' + h.hub_id + '_' + i,
                    name: aName + ' (Agent)',
                    email: aName.toLowerCase() + '_' + i + '@swifttrack.com',
                    password: 'password123',
                    role: 'delivery_agent',
                    hub_id: h.hub_id,
                    active: true,
                    vehicle: prefix + ' ' + (1000 + Math.floor(Math.random()*9000))
                });
            }
        });

        // 50 dynamically generated Customers
        var custNames = ['Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Diya', 'Aditya', 'Aryan', 'Kavya', 'Sai', 'Arjun', 'Siddharth', 'Riya', 'Aadhya', 'Krishna', 'Ishaan', 'Shaurya', 'Ayaan', 'Navya', 'Dhruv', 'Kabir', 'Ritika', 'Anushka', 'Rudra', 'Anika', 'Prisha', 'Atharv', 'Ojas', 'Zara', 'Meera', 'Rohan', 'Neha', 'Maya', 'Nithin', 'Sneha', 'Varun', 'Kiran', 'Nisha', 'Ravi', 'Pooja', 'Anjali', 'Kunal', 'Shruti', 'Vikram', 'Pranav', 'Mohit', 'Swati', 'Sanjay', 'Divya', 'Suresh', 'Lakshmi'];
        for (var c = 0; c < 50; c++) {
            state.users.push({
                user_id: 'U_CUS_GEN_' + c,
                name: custNames[c],
                email: custNames[c].toLowerCase() + c + '@mail.com',
                password: 'password',
                role: 'customer',
                active: true
            });
        }

        state.roles = [
            { name: 'Super User', permissions: { manageUsers: true, manageComplaints: true, viewReports: true, configureSystem: true, manageDatabase: true } },
            { name: 'Admin', permissions: { manageUsers: false, manageComplaints: true, viewReports: true, configureSystem: false, manageDatabase: false } }
        ];

        /* --- UNIFIED ORDERS --- */
        var mockCustomers = [
            'Asha Nair', 'Kiran Reddy', 'Deepa Iyer', 'Manoj Menon', 'Harish Kumar',
            'Divya Rao', 'Naveen Reddy', 'Suresh Iyer', 'Lakshmi Menon', 'Arjun Menon',
            'Priya Iyer', 'Vijay Kumar', 'Meena Nair', 'Rohit Menon', 'Anita Rao',
            'Karthik Reddy', 'Shreya Iyer', 'Ganesh Nair', 'Keerthi Menon', 'Rahul Kumar',
            'Sindhu Rao', 'Ajay Prakash', 'Bhavya Iyer', 'Sanjay Kumar', 'Pooja Nair',
            'Siddharth Menon', 'Anil Reddy', 'Kavya Rao', 'Nithya Iyer', 'Hari Menon',
            'Revathi Nair', 'Gopal Reddy', 'Suman Rao', 'Vikas Kumar', 'Anu Iyer'
        ];
        var hubCycle = [
            { id: 'H001', pickup: 'Chennai Central Hub', delivery: ['T. Nagar, Chennai', 'Adyar, Chennai', 'Anna Nagar, Chennai', 'Velachery, Chennai', 'Mylapore, Chennai', 'Tambaram, Chennai', 'Guindy, Chennai'] },
            { id: 'H002', pickup: 'Bengaluru Logistics Park', delivery: ['Indiranagar, Bengaluru', 'Whitefield, Bengaluru', 'Koramangala, Bengaluru', 'Jayanagar, Bengaluru', 'Malleshwaram, Bengaluru', 'HSR Layout, Bengaluru', 'Rajajinagar, Bengaluru'] },
            { id: 'H003', pickup: 'Hyderabad Logistics Hub', delivery: ['Madhapur, Hyderabad', 'Gachibowli, Hyderabad', 'Kukatpally, Hyderabad', 'Banjara Hills, Hyderabad', 'Hitech City, Hyderabad', 'Miyapur, Hyderabad', 'Secunderabad, Hyderabad'] },
            { id: 'H004', pickup: 'Kharimnagar City Hub', delivery: ['Civil Lines, Kharimnagar', 'Ramnagar, Kharimnagar', 'Vavilalapally, Kharimnagar', 'Kothapalli, Kharimnagar', 'Subhash Nagar, Kharimnagar', 'Sai Nagar, Kharimnagar', 'Kaman Road, Kharimnagar'] },
            { id: 'H005', pickup: 'Visakhapatnam Port Hub', delivery: ['MVP Colony, Visakhapatnam', 'Dwaraka Nagar, Visakhapatnam', 'Seethammadhara, Visakhapatnam', 'Siripuram, Visakhapatnam', 'Gajuwaka, Visakhapatnam', 'Maddilapalem, Visakhapatnam', 'Rushikonda, Visakhapatnam'] }
        ];
        var phonePool = [
            '+91 98450 1102', '+91 98450 2213', '+91 98450 3324', '+91 98450 4435', '+91 98450 5546',
            '+91 98450 6657', '+91 98450 7768', '+91 98450 8879', '+91 98450 9980', '+91 98451 1091',
            '+91 98451 2102', '+91 98451 3213', '+91 98451 4324', '+91 98451 5435', '+91 98451 6546',
            '+91 98451 7657', '+91 98451 8768', '+91 98451 9879', '+91 98452 1080', '+91 98452 2191',
            '+91 98452 3202', '+91 98452 4313', '+91 98452 5424', '+91 98452 6535', '+91 98452 7646',
            '+91 98452 8757', '+91 98452 9868', '+91 98453 1079', '+91 98453 2180', '+91 98453 3291',
            '+91 98453 4302', '+91 98453 5413', '+91 98453 6524', '+91 98453 7635', '+91 98453 8746'
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
                var deliveryArea = hubMeta.delivery[j % hubMeta.delivery.length];
                state.orders.push({
                    order_id: 'ORD_' + orderIndex,
                    tracking_id: 'SWT-' + (200000 + orderIndex),
                    merchant_id: 'U_MER_1',
                    customer_name: mockCustomers[(orderIndex - 1) % mockCustomers.length],
                    customer_phone: phonePool[(orderIndex - 1) % phonePool.length],
                    pickup_address: hubMeta.pickup,
                    delivery_address: 'Unit ' + (10 + j) + ', ' + deliveryArea,
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
