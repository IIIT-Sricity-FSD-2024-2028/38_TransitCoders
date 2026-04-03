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
                var needsSave = false;
                for (var key in defaultState) { 
                    if (!parsed.hasOwnProperty(key)) {
                        parsed[key] = defaultState[key]; 
                        needsSave = true;
                    }
                }
                
                // MIGRATION: Inject merchantTickets mock data if it is completely empty array 
                // meaning it just got migrated from defaultState and is uninitialized.
                if (parsed.merchantTickets && parsed.merchantTickets.length === 0) {
                     parsed.merchantTickets = [
                        { id: 'TKT-1001', subject: 'Integration failed on Magento', tid: 'N/A', priority: 'high', status: 'open', date: '2026-04-01T10:00:00Z' },
                        { id: 'TKT-1002', subject: 'Invoice not generated for SWT-513221', tid: 'SWT-513221', priority: 'medium', status: 'resolved', date: '2026-03-31T15:30:00Z' },
                        { id: 'TKT-1003', subject: 'Delayed pickup from main warehouse', tid: 'SWT-448821', priority: 'high', status: 'open', date: '2026-04-02T09:12:00Z' }
                     ];
                     needsSave = true;
                }

                if (needsSave) {
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch(e){}
                }
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
            { hub_id: 'H004', name: 'Karimnagar City Hub', location: 'Karimnagar', status: 'Active' },
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
            { user_id: 'U_HM_4', name: 'Manoj Menon', email: 'hm_karimnagar@swifttrack.com', password: 'password123', role: 'hub_manager', hub_id: 'H004', active: true },
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
        {
            id: 'super_user',
            name: 'Super User',
            description: 'Unrestricted access to all modules and configurations.',
            isSystem: true,
            permissions: {
                view_users: true, create_users: true, edit_users: true, delete_users: true, suspend_users: true, assign_roles: true,
                view_all_shipments: true, create_shipment: true, edit_shipment: true, cancel_shipment: true, view_own_shipment_only: false,
                view_complaints: true, resolve_complaints: true, escalate_complaints: true,
                view_live_shipments: true, view_hub_status: true, view_delayed_deliveries: true,
                view_reports: true, export_reports: true, revenue_analytics: true, complaint_analytics: true,
                edit_platform_settings: true, configure_hubs: true, configure_routes: true, manage_api_integrations: true,
                view_logs: true, export_logs: true, delete_logs: true,
                backup_database: true, restore_database: true, clear_old_logs: true
            }
        },
        {
            id: 'admin',
            name: 'Admin',
            description: 'Manage most configurations except destructive core actions.',
            isSystem: false,
            permissions: {
                view_users: true, create_users: true, edit_users: true, delete_users: false, suspend_users: true, assign_roles: false,
                view_all_shipments: true, create_shipment: true, edit_shipment: true, cancel_shipment: true, view_own_shipment_only: false,
                view_complaints: true, resolve_complaints: true, escalate_complaints: true,
                view_live_shipments: true, view_hub_status: true, view_delayed_deliveries: true,
                view_reports: true, export_reports: true, revenue_analytics: true, complaint_analytics: true,
                edit_platform_settings: true, configure_hubs: true, configure_routes: true, manage_api_integrations: false,
                view_logs: true, export_logs: true, delete_logs: false,
                backup_database: true, restore_database: false, clear_old_logs: true
            }
        },
        {
            id: 'hub_manager',
            name: 'Hub Manager',
            description: 'Handles shipments and operations monitoring for their designated hub.',
            isSystem: false,
            permissions: {
                view_users: false, create_users: false, edit_users: false, delete_users: false, suspend_users: false, assign_roles: false,
                view_all_shipments: true, create_shipment: true, edit_shipment: true, cancel_shipment: true, view_own_shipment_only: false,
                view_complaints: true, resolve_complaints: true, escalate_complaints: true,
                view_live_shipments: true, view_hub_status: true, view_delayed_deliveries: true,
                view_reports: true, export_reports: true, revenue_analytics: false, complaint_analytics: false,
                edit_platform_settings: false, configure_hubs: false, configure_routes: false, manage_api_integrations: false,
                view_logs: false, export_logs: false, delete_logs: false,
                backup_database: false, restore_database: false, clear_old_logs: false
            }
        },
        {
            id: 'merchant',
            name: 'Merchant',
            description: 'Can build and track their own shipments only.',
            isSystem: false,
            permissions: {
                view_users: false, create_users: false, edit_users: false, delete_users: false, suspend_users: false, assign_roles: false,
                view_all_shipments: false, create_shipment: true, edit_shipment: true, cancel_shipment: true, view_own_shipment_only: true,
                view_complaints: false, resolve_complaints: false, escalate_complaints: false,
                view_live_shipments: false, view_hub_status: false, view_delayed_deliveries: false,
                view_reports: false, export_reports: false, revenue_analytics: false, complaint_analytics: false,
                edit_platform_settings: false, configure_hubs: false, configure_routes: false, manage_api_integrations: false,
                view_logs: false, export_logs: false, delete_logs: false,
                backup_database: false, restore_database: false, clear_old_logs: false
            }
        },
        {
            id: 'delivery_agent',
            name: 'Delivery Agent',
            description: 'Field agent dispatch tracking.',
            isSystem: false,
            permissions: {
                view_users: false, create_users: false, edit_users: false, delete_users: false, suspend_users: false, assign_roles: false,
                view_all_shipments: false, create_shipment: false, edit_shipment: true, cancel_shipment: false, view_own_shipment_only: true,
                view_complaints: false, resolve_complaints: false, escalate_complaints: false,
                view_live_shipments: false, view_hub_status: false, view_delayed_deliveries: false,
                view_reports: false, export_reports: false, revenue_analytics: false, complaint_analytics: false,
                edit_platform_settings: false, configure_hubs: false, configure_routes: false, manage_api_integrations: false,
                view_logs: false, export_logs: false, delete_logs: false,
                backup_database: false, restore_database: false, clear_old_logs: false
            }
        },
        {
            id: 'support_staff',
            name: 'Support Staff',
            description: 'Manages incoming customer complaints and general inquiries.',
            isSystem: false,
            permissions: {
                view_users: true, create_users: false, edit_users: false, delete_users: false, suspend_users: false, assign_roles: false,
                view_all_shipments: true, create_shipment: false, edit_shipment: false, cancel_shipment: false, view_own_shipment_only: false,
                view_complaints: true, resolve_complaints: true, escalate_complaints: true,
                view_live_shipments: false, view_hub_status: false, view_delayed_deliveries: false,
                view_reports: true, export_reports: false, revenue_analytics: false, complaint_analytics: true,
                edit_platform_settings: false, configure_hubs: false, configure_routes: false, manage_api_integrations: false,
                view_logs: false, export_logs: false, delete_logs: false,
                backup_database: false, restore_database: false, clear_old_logs: false
            }
        }
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
            { id: 'H004', pickup: 'Karimnagar City Hub', delivery: ['Civil Lines, Karimnagar', 'Ramnagar, Karimnagar', 'Vavilalapally, Karimnagar', 'Kothapalli, Karimnagar', 'Subhash Nagar, Karimnagar', 'Sai Nagar, Karimnagar', 'Kaman Road, Karimnagar'] },
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
            H001: 'U_AGT_102', // Karthik
            H002: 'U_AGT_104', // Meera Iyer
            H003: 'U_AGT_105', // Sanjay Rao
            H004: 'U_AGT_H004_0', // Generated
            H005: 'U_AGT_H005_0'  // Generated
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
        
        // Add edge cases for specific delivery agents (e.g. exactly 1 pending, 1 history)
        // Agent U_AGT_103 (Akhil Menon) gets exactly 1 in Worklist and 1 in History.
        state.orders.push({
            order_id: 'ORD_EDGE_1', tracking_id: 'SWT-999001', merchant_id: 'U_MER_1',
            customer_name: 'Rahul Kumar', customer_phone: '+91 98450 1111',
            pickup_address: 'Chennai Central Hub', delivery_address: 'Alwarpet, Chennai',
            package_type: 'Standard', weight: 1.5, amount: 450, status: 'In Transit',
            created_at: new Date(Date.now() - 86400000).toISOString(), assigned_hub: 'H001', assigned_agent: 'U_AGT_103'
        });
        state.orders.push({
            order_id: 'ORD_EDGE_2', tracking_id: 'SWT-999002', merchant_id: 'U_MER_1',
            customer_name: 'Sindhu Rao', customer_phone: '+91 98450 2222',
            pickup_address: 'Chennai Central Hub', delivery_address: 'BTM Layout, Chennai',
            package_type: 'Express', weight: 0.8, amount: 750, status: 'Delivered',
            created_at: new Date(Date.now() - 172800000).toISOString(), assigned_hub: 'H001', assigned_agent: 'U_AGT_103'
        });

        /* Legacy agent profile info so settings works */
        state.agentProfile = { name: 'Karthik', currentStatus: 'available', performance: { completed: 271, rating: 4.6 } };

        /* --- COMPLAINTS SEED DATA --- */
        state.complaints = [
            { id: 'CMP-1001', customer: 'Priya Iyer', date: '2026-03-28', type: 'Delivery Delay', priority: 'High', status: 'Open', order_id: 'ORD_1', details: 'Package was supposed to arrive 3 days ago but still showing In Transit.' },
            { id: 'CMP-1002', customer: 'Asha Nair', date: '2026-03-27', type: 'Damaged Package', priority: 'Critical', status: 'Escalated', order_id: 'ORD_3', details: 'Received package with visible dents and torn packaging. Product inside was broken.' },
            { id: 'CMP-1003', customer: 'Kiran Reddy', date: '2026-03-26', type: 'Wrong Item', priority: 'High', status: 'Open', order_id: 'ORD_5', details: 'Received a completely different item than what was ordered.' },
            { id: 'CMP-1004', customer: 'Deepa Iyer', date: '2026-03-25', type: 'Missing Item', priority: 'Medium', status: 'Resolved', order_id: 'ORD_8', details: 'One out of three items in the order was missing from the package.' },
            { id: 'CMP-1005', customer: 'Manoj Menon', date: '2026-03-24', type: 'Delivery Delay', priority: 'Low', status: 'Resolved', order_id: 'ORD_10', details: 'Delivery was delayed by one day due to weather conditions.' },
            { id: 'CMP-1006', customer: 'Harish Kumar', date: '2026-03-23', type: 'Agent Behavior', priority: 'High', status: 'Open', order_id: 'ORD_12', details: 'Delivery agent was rude and refused to deliver to the door. Left package at the gate.' },
            { id: 'CMP-1007', customer: 'Divya Rao', date: '2026-03-22', type: 'Billing Issue', priority: 'Medium', status: 'Open', order_id: 'ORD_15', details: 'Charged twice for the same order. Refund has not been processed yet.' },
            { id: 'CMP-1008', customer: 'Naveen Reddy', date: '2026-03-21', type: 'Delivery Delay', priority: 'Medium', status: 'Escalated', order_id: 'ORD_18', details: 'Express delivery order marked as standard. Still not delivered after 5 days.' },
            { id: 'CMP-1009', customer: 'Suresh Iyer', date: '2026-03-20', type: 'Damaged Package', priority: 'High', status: 'Resolved', order_id: 'ORD_20', details: 'Fragile item delivered without proper cushioning. Glass item was cracked.' },
            { id: 'CMP-1010', customer: 'Lakshmi Menon', date: '2026-03-19', type: 'Wrong Address', priority: 'Low', status: 'Resolved', order_id: 'ORD_22', details: 'Package was delivered to the wrong apartment number in the same building.' },
            { id: 'CMP-1011', customer: 'Arjun Menon', date: '2026-03-18', type: 'Missing Item', priority: 'Critical', status: 'Open', order_id: 'ORD_25', details: 'Entire package is missing. Tracking shows delivered but nothing was received.' },
            { id: 'CMP-1012', customer: 'Vijay Kumar', date: '2026-03-17', type: 'Agent Behavior', priority: 'Medium', status: 'Resolved', order_id: 'ORD_28', details: 'Agent called multiple times at odd hours asking for directions instead of using GPS.' }
        ];

        /* --- FEEDBACK SEED DATA --- */
        state.feedback = [
            { id: 'FB-2001', customer: 'Priya Iyer', date: '2026-03-30', rating: 5, comment: 'Excellent delivery service! Package arrived well before the estimated time. Very impressed.', status: 'Reviewed' },
            { id: 'FB-2002', customer: 'Asha Nair', date: '2026-03-29', rating: 4, comment: 'Good service overall. The tracking updates were accurate and helpful.', status: 'Reviewed' },
            { id: 'FB-2003', customer: 'Kiran Reddy', date: '2026-03-28', rating: 2, comment: 'Delivery was delayed by two days. No proactive communication about the delay.', status: 'Pending' },
            { id: 'FB-2004', customer: 'Deepa Iyer', date: '2026-03-27', rating: 5, comment: 'The delivery agent was very polite and handled the fragile package with care. 10/10!', status: 'Pending' },
            { id: 'FB-2005', customer: 'Manoj Menon', date: '2026-03-26', rating: 3, comment: 'Average experience. Package arrived on time but was slightly dented on one side.', status: 'Pending' },
            { id: 'FB-2006', customer: 'Harish Kumar', date: '2026-03-25', rating: 1, comment: 'Terrible experience. Package was left at the wrong address and took a week to resolve.', status: 'Pending' },
            { id: 'FB-2007', customer: 'Divya Rao', date: '2026-03-24', rating: 4, comment: 'Swift delivery and great packaging. Would have given 5 stars but the tracking page was slow.', status: 'Reviewed' },
            { id: 'FB-2008', customer: 'Naveen Reddy', date: '2026-03-23', rating: 5, comment: 'Best courier service I have used so far. Keep up the great work SwiftTrack!', status: 'Pending' },
            { id: 'FB-2009', customer: 'Suresh Iyer', date: '2026-03-22', rating: 3, comment: 'Decent service but the customer support response time needs improvement.', status: 'Reviewed' },
            { id: 'FB-2010', customer: 'Lakshmi Menon', date: '2026-03-21', rating: 4, comment: 'Reliable and consistent. Have used SwiftTrack for 5 orders now and all went smoothly.', status: 'Pending' }
        ];

        /* --- MERCHANT TICKETS SEED DATA --- */
        state.merchantTickets = [
            { id: 'TKT-1001', subject: 'Integration failed on Magento', tid: 'N/A', priority: 'high', status: 'open', date: '2026-04-01T10:00:00Z' },
            { id: 'TKT-1002', subject: 'Invoice not generated for SWT-513221', tid: 'SWT-513221', priority: 'medium', status: 'resolved', date: '2026-03-31T15:30:00Z' },
            { id: 'TKT-1003', subject: 'Delayed pickup from main warehouse', tid: 'SWT-448821', priority: 'high', status: 'open', date: '2026-04-02T09:12:00Z' }
        ];

        /* --- DELIVERY ZONES SEED DATA --- */
        state.zones = [
            { id: 'ZN-001', name: 'Chennai Metro Zone', region: 'Tamil Nadu – Chennai', boundaries: 'T. Nagar, Adyar, Anna Nagar, Velachery, Mylapore, Tambaram, Guindy', hub_id: 'H001', status: 'Active', agents_assigned: 5 },
            { id: 'ZN-002', name: 'Bengaluru Urban Zone', region: 'Karnataka – Bengaluru', boundaries: 'Indiranagar, Whitefield, Koramangala, Jayanagar, Malleshwaram, HSR Layout, Rajajinagar', hub_id: 'H002', status: 'Active', agents_assigned: 5 },
            { id: 'ZN-003', name: 'Hyderabad IT Corridor', region: 'Telangana – Hyderabad', boundaries: 'Madhapur, Gachibowli, Kukatpally, Banjara Hills, Hitech City, Miyapur, Secunderabad', hub_id: 'H003', status: 'Active', agents_assigned: 5 },
            { id: 'ZN-004', name: 'Karimnagar District Zone', region: 'Telangana – Karimnagar', boundaries: 'Civil Lines, Ramnagar, Vavilalapally, Kothapalli, Subhash Nagar, Sai Nagar, Kaman Road', hub_id: 'H004', status: 'Active', agents_assigned: 5 },
            { id: 'ZN-005', name: 'Visakhapatnam Coastal Zone', region: 'Andhra Pradesh – Visakhapatnam', boundaries: 'MVP Colony, Dwaraka Nagar, Seethammadhara, Siripuram, Gajuwaka, Maddilapalem, Rushikonda', hub_id: 'H005', status: 'Active', agents_assigned: 5 },
            { id: 'ZN-006', name: 'Chennai Suburbs Extended', region: 'Tamil Nadu – Greater Chennai', boundaries: 'Porur, Ambattur, Avadi, Perambur, Tondiarpet, Chromepet', hub_id: 'H001', status: 'Active', agents_assigned: 3 },
            { id: 'ZN-007', name: 'Bengaluru Outer Ring', region: 'Karnataka – Bengaluru Outskirts', boundaries: 'Electronic City, Sarjapur, Marathahalli, Yelahanka, Bannerghatta, Hebbal', hub_id: 'H002', status: 'Active', agents_assigned: 3 },
            { id: 'ZN-008', name: 'Hyderabad Old City', region: 'Telangana – Hyderabad South', boundaries: 'Charminar, Nampally, Koti, Abids, Sultan Bazaar, Dilsukhnagar', hub_id: 'H003', status: 'Inactive', agents_assigned: 0 }
        ];

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
