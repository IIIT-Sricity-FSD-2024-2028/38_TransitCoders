/**
 * SwiftTrack UNIFIED Mock Data Store
 * Consolidates Hub Manager, Merchant, and Delivery Agent data.
 * This ensures all team members can work in the same environment without conflicts.
 */

window.mockData = {
    hubs: [
        { hub_id: 'H001', name: 'Chennai Central Hub', location: 'Chennai', status: 'Active' },
        { hub_id: 'H002', name: 'Bengaluru Logistics Park', location: 'Bengaluru', status: 'Active' },
        { hub_id: 'H003', name: 'Hyderabad Logistics Hub', location: 'Hyderabad', status: 'Active' },
        { hub_id: 'H004', name: 'Kharimnagar City Hub', location: 'Kharimnagar', status: 'Active' }
    ],
    users: [],
    agents: [],
    orders: [], // Hub Manager Orders
    merchantShipments: [], // Merchant Portal Shipments
    merchantTickets: [], // Merchant Portal Tickets
    agentOrders: [], // Delivery Agent Orders
    agentHistory: [], // Delivery Agent History
    agentReports: [], // Delivery Agent Reports
    complaints: []
};

/* ========================================================================== */
/* 1. UNIFIED USERS & AUTH SEEDS                                             */
/* ========================================================================== */

// 1a. Core Admin Users (Merging teammate constraints)
window.mockData.users.push({ 
    user_id: 'U_SU_1', name: 'Admin Super User', email: 'admin@swifttrack.com', 
    password: 'admin123', role: 'admin', hub_id: 'H001', active: true, avatar: 'AM', company: 'SwiftTrack Ops' 
});
window.mockData.users.push({ 
    user_id: 'U_SU_2', name: 'Super Admin', email: 'super@swifttrack.com', 
    password: 'super123', role: 'superuser', hub_id: null, active: true, avatar: 'SA', company: 'SwiftTrack HQ' 
});

// 1b. Hub Managers
window.mockData.hubs.forEach((hub, i) => {
    window.mockData.users.push({ 
        user_id: `U_HM_${i+1}`, name: `Hub Manager ${hub.location}`, 
        email: `hm_${hub.location.toLowerCase().replace(/\s/g, '_')}@swifttrack.com`, 
        password: 'password123', role: 'hub_manager', hub_id: hub.hub_id, active: true 
    });
});

// 1c. Merchants (Preserving Shreesaanth's credentials)
for (let i = 1; i <= 5; i++) {
    window.mockData.users.push({ 
        user_id: `U_MER_${i}`, name: i === 1 ? 'Prasanna Raja R' : `Merchant ${i}`, 
        email: i === 1 ? 'merchant@swifttrack.com' : `merchant${i}@swifttrack.com`, 
        password: i === 1 ? 'merchant123' : 'password123', 
        role: 'merchant', hub_id: null, active: true, avatar: i === 1 ? 'PR' : 'M'+i, company: i === 1 ? "Prasanna's Enterprises" : "Merchant Store"
    });
}

// 1d. Customers
const customerNames = ['Aarav Sharma', 'Priya Patel', 'Neha Reddy', 'Vikram Singh', 'Rahul Desai'];
for (let i = 1; i <= 5; i++) {
    window.mockData.users.push({ 
        user_id: `U_CUS_${i}`, name: customerNames[i-1], 
        email: i === 1 ? 'customer@swifttrack.com' : `customer${i}@swifttrack.com`, 
        password: i === 1 ? 'password' : 'password123', 
        role: 'customer', hub_id: null, active: true 
    });
}

/* ========================================================================== */
/* 2. MERCHANT PORTAL DATA (MockDB Interface)                                */
/* ========================================================================== */

window.mockData.merchantShipments = [
    { id:'SWT-2026-98471', recipient:'Priya Sharma',   origin:'Chennai, TN',     dest:'Bangalore, KA',   service:'Express',   weight:'2.5 kg', amount:'₹1950', date:'Mar 28', status:'in-transit',  merchantId:'U_MER_1' },
    { id:'SWT-2026-87230', recipient:'Rahul Verma',    origin:'Mumbai, MH',      dest:'Hyderabad, TG',   service:'Standard',  weight:'1.2 kg', amount:'₹999',  date:'Mar 27', status:'delivered',   merchantId:'U_MER_1' },
    { id:'SWT-2026-76184', recipient:'Anita Desai',    origin:'Kochi, KL',       dest:'Pune, MH',        service:'Overnight', weight:'0.8 kg', amount:'₹3200', date:'Mar 26', status:'pending',     merchantId:'U_MER_1' },
    { id:'SWT-2026-65091', recipient:'Suresh Kumar',   origin:'Delhi, NCR',      dest:'Jaipur, RJ',      service:'Express',   weight:'5.0 kg', amount:'₹2450', date:'Mar 25', status:'delivered',   merchantId:'U_MER_1' },
    { id:'SWT-2026-54380', recipient:'Kavita Reddy',   origin:'Kolkata, WB',     dest:'Ahmedabad, GJ',   service:'Standard',  weight:'3.1 kg', amount:'₹1450', date:'Mar 24', status:'cancelled',   merchantId:'U_MER_1' }
];

window.mockData.merchantTickets = [
    { id:'TKT-1042', subject:'Package delayed — weather', tid:'SWT-2026-98471', priority:'high', date:'Mar 28', status:'open', merchantId:'U_MER_1' },
    { id:'TKT-1039', subject:'Address correction request', tid:'SWT-2026-76184', priority:'med',  date:'Mar 26', status:'open', merchantId:'U_MER_1' }
];

window.MockDB = {
    get shipments() { return window.mockData.merchantShipments; },
    get tickets() { return window.mockData.merchantTickets; },
    get users() { return window.mockData.users; },
    
    _shipCounter: 11000,
    _ticketCounter: 1043,
    
    nextShipId() { return `SWT-2026-${this._shipCounter++}`; },
    nextTicketId() { return `TKT-${this._ticketCounter++}`; },

    /* ── AUTH COMPATIBILITY BRIDGE ── */
    login(email, password) {
        const u = this.users.find(u => u.email === email && u.password === password);
        if (u) {
            const userData = { user_id: u.user_id, name: u.name, email: u.email, role: u.role, hub_id: u.hub_id, active: true };
            sessionStorage.setItem('st_session', JSON.stringify(userData));
            localStorage.setItem('user', JSON.stringify(userData));
            return userData;
        }
        return null;
    },
    logout() {
        sessionStorage.removeItem('st_session');
        localStorage.removeItem('user');
    },
    restoreSession() {
        const s = sessionStorage.getItem('st_session') || localStorage.getItem('user');
        if (s) return JSON.parse(s);
        return null;
    },

    getStats(merchantId) {
        const data = this.shipments.filter(s => s.merchantId === merchantId);
        return {
            total: data.length,
            delivered: data.filter(s => s.status === 'delivered').length,
            inTransit: data.filter(s => s.status === 'in-transit').length,
            pending: data.filter(s => s.status === 'pending').length,
            cancelled: data.filter(s => s.status === 'cancelled').length,
            revenue: data.reduce((sum, s) => sum + parseFloat(s.amount.replace('₹','').replace(/,/g,'')), 0).toFixed(2),
        };
    },
    getShipment(id) { return this.shipments.find(s => s.id === id); },
    getShipments(mId) {
        // If mId is null (superuser/admin), return all
        if (!mId) return this.shipments;
        return this.shipments.filter(s => s.merchantId === mId);
    },
    addShipment(d) {
        const session = sessionStorage.getItem('st_session');
        const mId = session ? JSON.parse(session).user_id : 'U_MER_1';
        const n = { ...d, id: this.nextShipId(), date: new Date().toLocaleDateString('en-US', {month:'short', day:'numeric'}), merchantId: mId };
        window.mockData.merchantShipments.unshift(n);
        return n;
    },
    updateShipment(id, updates) {
        const idx = window.mockData.merchantShipments.findIndex(s => s.id === id);
        if (idx === -1) return null;
        window.mockData.merchantShipments[idx] = { ...window.mockData.merchantShipments[idx], ...updates };
        return window.mockData.merchantShipments[idx];
    },
    deleteShipment(id) {
        const idx = window.mockData.merchantShipments.findIndex(s => s.id === id);
        if (idx === -1) return false;
        window.mockData.merchantShipments.splice(idx, 1);
        return true;
    },
    getTickets(mId) {
        if (!mId) return window.mockData.merchantTickets;
        return window.mockData.merchantTickets.filter(t => t.merchantId === mId);
    },
    addTicket(data) {
        const session = sessionStorage.getItem('st_session');
        const mId = session ? JSON.parse(session).user_id : 'U_MER_1';
        const t = { id: this.nextTicketId(), ...data, date: new Date().toLocaleDateString('en-US', {month:'short', day:'numeric'}), status: 'open', merchantId: mId };
        window.mockData.merchantTickets.unshift(t);
        return t;
    },
    updateTicket(id, updates) {
        const idx = window.mockData.merchantTickets.findIndex(t => t.id === id);
        if (idx === -1) return null;
        window.mockData.merchantTickets[idx] = { ...window.mockData.merchantTickets[idx], ...updates };
        return window.mockData.merchantTickets[idx];
    },
    deleteTicket(id) {
        const idx = window.mockData.merchantTickets.findIndex(t => t.id === id);
        if (idx === -1) return false;
        window.mockData.merchantTickets.splice(idx, 1);
        return true;
    }
};

/* ========================================================================== */
/* 3. DELIVERY AGENT DATA (DeliveryData Interface)                           */
/* ========================================================================== */

window.mockData.agentOrders = [
    { id: 1001, customer: 'Rajesh Kumar', phone: '+91 98450 12345', status: 'in-transit', priority: 'High', origin: 'Chennai Central Hub', destination: 'Shanti Villa, Chennai', eta: '01:15 PM', amount: 1250, distance: '4.5 KM', packageId: 4421, paymentMode: 'Prepaid' },
    { id: 1002, customer: 'Priya Nair', phone: '+91 98765 43210', status: 'pending', priority: 'Medium', origin: 'Chennai Central Hub', destination: 'OMR, Chennai', eta: '12:30 PM', amount: 849, distance: '3.2 KM', packageId: 4422, paymentMode: 'COD' }
];

window.mockData.agentHistory = [
    { orderId: 505, customer: 'Rahul', location: 'T. Nagar, Chennai', date: '8-3-2026', time: '14:20 PM', status: 'Completed', rating: 4 }
];

// Delivery Agent Profile
const agentMukesh = {
    name: 'Mukesh', agentId: 'DA102', role: 'Delivery Agent', email: 'mukesh@swifttrack.com',
    phone: '+91 98765 43210', currentStatus: 'available', hub: { name: 'Chennai Central Hub', code: 'CHN001' }
};
window.mockData.agentProfile = agentMukesh;
window.mockData.users.push({ user_id: 'U_AGT_102', name: 'Mukesh', email: 'mukesh@swifttrack.com', password: 'password123', role: 'agent', hub_id: 'H001', active: true });

window.DeliveryData = {
    get orders() { return window.mockData.agentOrders; },
    get history() { return window.mockData.agentHistory; },
    
    getOrders(filter = 'all') {
        if (filter === 'all') return [...this.orders];
        return this.orders.filter(o => o.status === filter);
    },
    getOrderById(id) { return this.orders.find(o => o.id === parseInt(id)); },
    updateOrderStatus(id, newStatus) {
        const o = this.orders.find(o => o.id === parseInt(id));
        if (o) { o.status = newStatus; return true; }
        return false;
    },
    getProfile() { return window.mockData.agentProfile; }
};

/* ========================================================================== */
/* 4. HUB MANAGER DATA (Real-time Simulation)                                */
/* ========================================================================== */

// Seed Hub Manager Agents dynamically for massive parity
const _plates = ['TN-09', 'KA-01', 'TS-02', 'AP-31', 'TS-09'];
const _agentNames = ['Ramesh', 'Suresh', 'Rahul', 'Vijay', 'Ajith', 'Pawan', 'Mahesh', 'Prabhas', 'Allu', 'Ram', 'NTR', 'Gautham', 'Vikram', 'Dhanush', 'Siva', 'Surya', 'Karthi', 'Kamal', 'Rajini', 'Ravi', 'Jiiva', 'Arya', 'Vishal', 'Jayam', 'Madhavan'];

window.mockData.hubs.forEach((hub, idx) => {
    let prefix = _plates[idx % _plates.length];
    for (let i = 0; i < 5; i++) {
        let aName = _agentNames[(idx * 5) + i];
        let ag = {
            user_id: `U_AGT_${hub.hub_id}_${i}`,
            name: `${aName} (Agent)`,
            email: `${aName.toLowerCase()}_${i}@swifttrack.com`,
            password: 'password123',
            role: 'agent',
            hub_id: hub.hub_id,
            active: true
        };
        window.mockData.users.push(ag);
        window.mockData.agents.push({
            agent_id: ag.user_id,
            user_id: ag.user_id,
            name: ag.name,
            hub_id: hub.hub_id,
            phone: `+91 ${prefix.split('-')[1]} 884${i} 112`,
            availability_status: 'Available',
            vehicle_type: prefix
        });
    }
});

// Seed Hub Manager Orders
for (let i = 1; i <= 20; i++) {
    const hub = window.mockData.hubs[i % 4];
    const status = i % 5 === 0 ? 'Delivered' : (i % 3 === 0 ? 'In Transit' : 'Pending');
    const pkgTypes = ['Electronics', 'Documents', 'Apparel', 'Home Decor', 'Medical'];
    const date = new Date();
    date.setHours(date.getHours() - i);
    
    window.mockData.orders.push({
        order_id: `ORD_${i}`,
        tracking_id: `ST-${100000 + i}`,
        customer_name: customerNames[i % 5],
        customer_phone: `+91 9${8932 + i} ${1000 + i}`,
        pickup_hub_id: hub.hub_id,
        delivery_address: `Street ${i}, ${hub.location}`,
        status: status,
        agent_id: status === 'Pending' ? null : `AGT_${(i%3)+1}`,
        merchant_id: `U_MER_1`,
        package_type: pkgTypes[i % 5],
        weight: (0.5 + Math.random() * 4.5).toFixed(1),
        amount: (500 + Math.random() * 5000).toFixed(0),
        created_at: date.toISOString(),
        updated_at: new Date().toISOString()
    });
}

console.log('SwiftTrack Unified Mock Data Initialized.');
