/**
 * SwiftTrack Central Mock Data Store
 * Refactored for hyper-realism, exact distributions, and edge cases.
 */

const mockData = {
    hubs: [
        { hub_id: 'H001', name: 'Chennai Central Hub', location: 'Chennai', status: 'Active' },
        { hub_id: 'H002', name: 'Bangalore Logistics Park', location: 'Bangalore', status: 'Active' },
        { hub_id: 'H003', name: 'Hyderabad Logistics Hub', location: 'Hyderabad', status: 'Active' },
        { hub_id: 'H004', name: 'Karimnagar Distribution Center', location: 'Karimnagar', status: 'Active' }
    ],
    users: [],
    agents: [],
    orders: [],
    complaints: []
};

/* ========================================================================== */
/* 1. USERS (Preserving existing auth flows & adding realistic Indian names)  */
/* ========================================================================== */

mockData.users.push({ user_id: 'U_SU_1', name: 'Admin Super User', email: 'admin@swifttrack.com', password: 'admin123', role: 'super_user', hub_id: null, active: true });

mockData.hubs.forEach((hub, i) => {
    mockData.users.push({ user_id: `U_HM_${i+1}`, name: `Hub Manager ${hub.location}`, email: `hm_${hub.location.toLowerCase()}@swifttrack.com`, password: 'password123', role: 'hub_manager', hub_id: hub.hub_id, active: true });
});

for (let i = 1; i <= 5; i++) {
    mockData.users.push({ user_id: `U_MER_${i}`, name: i === 1 ? 'Vinod' : `Merchant ${i}`, email: i === 1 ? 'merchant@swifttrack.com' : `merchant${i}@swifttrack.com`, password: i === 1 ? 'merchant123' : 'password123', role: 'merchant', hub_id: null, active: true });
}

const customerNames = ['Aarav Sharma', 'Priya Patel', 'Neha Reddy', 'Vikram Singh', 'Rahul Desai', 'Anjali Menon', 'Kavya Iyer', 'Sameer Khan', 'Arjun Reddy', 'Sameera Rathod'];
for (let i = 1; i <= 10; i++) {
    mockData.users.push({ user_id: `U_CUS_${i}`, name: customerNames[i-1], email: i === 1 ? 'customer@swifttrack.com' : `customer${i}@swifttrack.com`, password: i === 1 ? 'password' : 'password123', role: 'customer', hub_id: null, active: true });
}

/* ========================================================================== */
/* 2. AGENTS & WORKLOAD REALISM                                               */
/* ========================================================================== */

const agentData = [
    { name: 'Ramesh K.', hub: 'H001', avail: 'Available', type: 'Van' },
    { name: 'Suresh P.', hub: 'H001', avail: 'Busy', type: 'Bike' },
    { name: 'Kumar M.', hub: 'H001', avail: 'Busy', type: 'Van' }, // Chennai has 3 agents (heavy load)
    { name: 'Anita Reddy', hub: 'H002', avail: 'Available', type: 'Bike' },
    { name: 'Imran Khan', hub: 'H002', avail: 'Busy', type: 'Van' },
    { name: 'John Doe', hub: 'H003', avail: 'Available', type: 'Bike' },
    { name: 'Akshara Verma', hub: 'H003', avail: 'Busy', type: 'Van' },
    { name: 'Ajay Prakash', hub: 'H004', avail: 'Available', type: 'Bike' }
];

agentData.forEach((a, idx) => {
    const aId = `AGT_${idx+1}`;
    const uId = `U_AGT_${idx+1}`;
    mockData.users.push({ user_id: uId, name: a.name, email: `agent${idx+1}@swifttrack.com`, password: 'password123', role: 'agent', hub_id: a.hub, active: true });
    mockData.agents.push({ agent_id: aId, user_id: uId, name: a.name, hub_id: a.hub, phone: `987654321${idx}`, availability_status: a.avail, vehicle_type: a.type });
});

/* ========================================================================== */
/* 3. ORDERS WITH HYPER-REALISM                                               */
/* ========================================================================== */

// Helper to generate a timestamp N hours ago
const generateOffset = (minHours, maxHours) => new Date(Date.now() - (Math.random() * (maxHours - minHours) + minHours) * 3600000).toISOString();

// Out of 40 Total Orders: Chennai (16), Bangalore (12), Hyderabad (8), Karimnagar (4)
const hubDist = [
    ...Array(16).fill('H001'), 
    ...Array(12).fill('H002'), 
    ...Array(8).fill('H003'), 
    ...Array(4).fill('H004')
];

// Exact Distribution out of 40:
// 50% Pending (20), 20% Assigned (8), 15% In Transit (6), 10% Delivered (4), 5% Failed (2)
const statusDist = [
    ...Array(20).fill('Pending'),
    ...Array(8).fill('Assigned'),
    ...Array(6).fill('In Transit'),
    ...Array(4).fill('Delivered'),
    ...Array(2).fill('Failed')
];

// Shuffle arrays so statuses are not clumped to one hub
statusDist.sort(() => Math.random() - 0.5);
hubDist.sort(() => Math.random() - 0.5);

const addresses = {
    'H001': ['T. Nagar, Chennai', 'Adyar Main Road, Chennai', 'Velachery, Chennai', 'Anna Nagar, Chennai', 'DLF IT Park, Ramapuram, Chennai'],
    'H002': ['Koramangala, Bangalore', 'Indiranagar, Bangalore', 'Whitefield, Bangalore', 'Jayanagar, Bangalore'],
    'H003': ['Hitech City, Hyderabad', 'Banjara Hills, Hyderabad', 'Jubilee Hills, Hyderabad', 'Madhapur, Hyderabad'],
    'H004': ['Karimnagar Main Road', 'Mukarampura, Karimnagar', 'Vidyanagar, Karimnagar', 'Kothirampur, Karimnagar']
};

const pkgTypes = ['Electronics', 'Clothing', 'Documents', 'Fragile', 'Heavy'];

for (let i = 0; i < 40; i++) {
    const hubId = hubDist[i];
    const status = statusDist[i];
    const hubAgents = mockData.agents.filter(a => a.hub_id === hubId);
    
    // EDGE CASE: Agent Assignment Workload
    // Force heavy load onto 'Busy' agents to simulate 3-5 orders per agent
    let agentId = null;
    if (['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed'].includes(status)) {
        if (hubAgents.length > 0) {
            const busyAgents = hubAgents.filter(a => a.availability_status === 'Busy');
            // If there's a busy agent, assign it to them 80% of the time, else random
            if (busyAgents.length > 0 && Math.random() > 0.2) {
                agentId = busyAgents[i % busyAgents.length].agent_id;
            } else {
                agentId = hubAgents[i % hubAgents.length].agent_id;
            }
        }
    }

    // EDGE CASE: Time Variation & Stuck Orders
    let created, updated;
    if (status === 'Pending') {
        // Some pending orders are very old (urgent)
        const isUrgent = Math.random() > 0.6; 
        created = generateOffset(isUrgent ? 3 : 0.1, isUrgent ? 48 : 2); // 0.1h up to 48h ago
        updated = created;
    } else if (status === 'Delivered') {
        created = generateOffset(24, 72); // 1-3 days ago
        updated = generateOffset(0.1, 8); // Delivered within last 8 hours today
    } else if (status === 'In Transit') {
        created = generateOffset(12, 48);
        updated = generateOffset(5, 12); // Stuck in transit for 5+ hours (edge case)
    } else {
        created = generateOffset(4, 24);
        updated = generateOffset(0.5, 3);
    }

    // Repeated customers (i % 10 loops over the 10 real indian names)
    const customerUser = mockData.users.filter(u => u.role === 'customer')[i % 10];
    const locArr = addresses[hubId];

    mockData.orders.push({
        order_id: `ORD_${1001 + i}`,
        tracking_id: `ST-${800001 + i}`,
        customer_name: customerUser.name,
        merchant_id: 'U_MER_1', // Using Vinod's merchant account
        pickup_hub_id: hubId,
        delivery_address: locArr[i % locArr.length],
        status: status,
        agent_id: agentId, // No agent (null) if Pending
        package_type: pkgTypes[Math.floor(Math.random() * pkgTypes.length)],
        weight: parseFloat((Math.random() * 8 + 0.5).toFixed(1)), // random 0.5 - 8.5 kg
        created_at: created,
        updated_at: updated
    });
}

/* ========================================================================== */
/* 4. COMPLAINTS                                                              */
/* ========================================================================== */

const complaintStatus = ['Open', 'In Progress', 'Resolved'];
for (let i = 1; i <= 6; i++) {
    mockData.complaints.push({
        complaint_id: `CMP_${100 + i}`,
        order_id: mockData.orders[i].order_id,
        customer_id: 'U_CUS_1', // Customer 1
        subject: `Delivery Issue for ${mockData.orders[i].tracking_id}`,
        description: i % 2 === 0 ? 'Package is delayed in transit.' : 'Outer box arrived damaged.',
        status: complaintStatus[i % complaintStatus.length],
        created_at: generateOffset(2, 48)
    });
}

window.mockData = mockData;
