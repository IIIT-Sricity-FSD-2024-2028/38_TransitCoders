/**
 * SwiftTrack UNIFIED Mock Data Store
 * Consolidates Hub Manager, Merchant, and Delivery Agent data.
 * This ensures all team members can work in the same environment without conflicts.
 */

window.mockData = {
  hubs: [
    {
      hub_id: "H001",
      name: "Chennai Central Hub",
      location: "Chennai",
      status: "Active",
    },
    {
      hub_id: "H002",
      name: "Bangalore Logistics Park",
      location: "Bangalore",
      status: "Active",
    },
    {
      hub_id: "H003",
      name: "Hyderabad Logistics Hub",
      location: "Hyderabad",
      status: "Active",
    },
    {
      hub_id: "H004",
      name: "Karimnagar Distribution Center",
      location: "Karimnagar",
      status: "Active",
    },
  ],
  users: [],
  agents: [],
  orders: [], // Hub Manager Orders
  merchantShipments: [], // Merchant Portal Shipments
  merchantTickets: [], // Merchant Portal Tickets
  agentOrders: [], // Delivery Agent Orders
  agentHistory: [], // Delivery Agent History
  agentReports: [], // Delivery Agent Reports
  complaints: [],
};

/* ========================================================================== */
/* 1. UNIFIED USERS & AUTH SEEDS                                             */
/* ========================================================================== */

// 1a. Core Admin Users (Merging teammate constraints)
window.mockData.users.push({
  user_id: "U_SU_1",
  name: "Admin Super User",
  email: "admin@swifttrack.com",
  password: "admin123",
  role: "admin",
  hub_id: "H001",
  active: true,
  avatar: "AM",
  company: "SwiftTrack Ops",
});
window.mockData.users.push({
  user_id: "U_SU_2",
  name: "Super Admin",
  email: "super@swifttrack.com",
  password: "super123",
  role: "admin",
  hub_id: null,
  active: true,
  avatar: "SA",
  company: "SwiftTrack HQ",
});

// 1b. Hub Managers
window.mockData.hubs.forEach((hub, i) => {
  window.mockData.users.push({
    user_id: `U_HM_${i + 1}`,
    name: `Hub Manager ${hub.location}`,
    email: `hm_${hub.location.toLowerCase()}@swifttrack.com`,
    password: "password123",
    role: "hub_manager",
    hub_id: hub.hub_id,
    active: true,
  });
});

// 1c. Merchants (Preserving Shreesaanth's credentials)
for (let i = 1; i <= 5; i++) {
  window.mockData.users.push({
    user_id: `U_MER_${i}`,
    name: i === 1 ? "Vinod" : `Merchant ${i}`,
    email: i === 1 ? "merchant@swifttrack.com" : `merchant${i}@swifttrack.com`,
    password: i === 1 ? "merchant123" : "password123",
    role: "merchant",
    hub_id: null,
    active: true,
    avatar: i === 1 ? "VD" : "M" + i,
    company: i === 1 ? "Vinod's Store" : "Merchant Store",
  });
}

// 1d. Customers
const customerNames = [
  "Aarav Sharma",
  "Priya Patel",
  "Neha Reddy",
  "Vikram Singh",
  "Rahul Desai",
];
for (let i = 1; i <= 5; i++) {
  window.mockData.users.push({
    user_id: `U_CUS_${i}`,
    name: customerNames[i - 1],
    email: i === 1 ? "customer@swifttrack.com" : `customer${i}@swifttrack.com`,
    password: i === 1 ? "password" : "password123",
    role: "customer",
    hub_id: null,
    active: true,
  });
}

/* ========================================================================== */
/* 2. MERCHANT PORTAL DATA (MockDB Interface)                                */
/* ========================================================================== */

window.mockData.merchantShipments = [
  {
    id: "SWT-2026-98471",
    recipient: "Jane Doe",
    origin: "New York, NY",
    dest: "Los Angeles, CA",
    service: "Express",
    weight: "2.5 kg",
    amount: "$24.29",
    date: "Mar 28",
    status: "in-transit",
    merchantId: "U_MER_1",
  },
  {
    id: "SWT-2026-87230",
    recipient: "Carlos Ruiz",
    origin: "Chicago, IL",
    dest: "Dallas, TX",
    service: "Standard",
    weight: "1.2 kg",
    amount: "$12.50",
    date: "Mar 27",
    status: "delivered",
    merchantId: "U_MER_1",
  },
  {
    id: "SWT-2026-76184",
    recipient: "Sarah Kim",
    origin: "Miami, FL",
    dest: "Boston, MA",
    service: "Overnight",
    weight: "0.8 kg",
    amount: "$42.00",
    date: "Mar 26",
    status: "pending",
    merchantId: "U_MER_1",
  },
  {
    id: "SWT-2026-65091",
    recipient: "Tom Nguyen",
    origin: "Seattle, WA",
    dest: "Denver, CO",
    service: "Express",
    weight: "5.0 kg",
    amount: "$34.75",
    date: "Mar 25",
    status: "delivered",
    merchantId: "U_MER_1",
  },
  {
    id: "SWT-2026-54380",
    recipient: "Emma Wilson",
    origin: "Atlanta, GA",
    dest: "Phoenix, AZ",
    service: "Standard",
    weight: "3.1 kg",
    amount: "$18.90",
    date: "Mar 24",
    status: "cancelled",
    merchantId: "U_MER_1",
  },
];

window.mockData.merchantTickets = [
  {
    id: "TKT-1042",
    subject: "Package delayed — weather",
    tid: "SWT-2026-98471",
    priority: "high",
    date: "Mar 28",
    status: "open",
    merchantId: "U_MER_1",
  },
  {
    id: "TKT-1039",
    subject: "Address correction request",
    tid: "SWT-2026-76184",
    priority: "med",
    date: "Mar 26",
    status: "open",
    merchantId: "U_MER_1",
  },
];

window.MockDB = {
  get shipments() {
    return window.mockData.merchantShipments;
  },
  get tickets() {
    return window.mockData.merchantTickets;
  },
  get users() {
    return window.mockData.users;
  },

  _shipCounter: 11000,
  _ticketCounter: 1043,

  nextShipId() {
    return `SWT-2026-${this._shipCounter++}`;
  },
  nextTicketId() {
    return `TKT-${this._ticketCounter++}`;
  },

  /* ── AUTH COMPATIBILITY BRIDGE ── */
  login(email, password) {
    const u = this.users.find(
      (u) => u.email === email && u.password === password,
    );
    if (u) {
      const userData = {
        user_id: u.user_id,
        name: u.name,
        email: u.email,
        role: u.role,
        hub_id: u.hub_id,
        active: true,
      };
      sessionStorage.setItem("st_session", JSON.stringify(userData));
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    }
    return null;
  },
  logout() {
    sessionStorage.removeItem("st_session");
    localStorage.removeItem("user");
  },
  restoreSession() {
    const s =
      sessionStorage.getItem("st_session") || localStorage.getItem("user");
    if (s) return JSON.parse(s);
    return null;
  },

  getStats(merchantId) {
    const data = this.shipments.filter((s) => s.merchantId === merchantId);
    return {
      total: data.length,
      delivered: data.filter((s) => s.status === "delivered").length,
      inTransit: data.filter((s) => s.status === "in-transit").length,
      pending: data.filter((s) => s.status === "pending").length,
      cancelled: data.filter((s) => s.status === "cancelled").length,
      revenue: data
        .reduce((sum, s) => sum + parseFloat(s.amount.replace("$", "")), 0)
        .toFixed(2),
    };
  },
  getShipments(mId) {
    return this.shipments.filter((s) => s.merchantId === mId);
  },
  addShipment(d) {
    // Get user from either sessionStorage or localStorage for better reliability
    let userStr =
      sessionStorage.getItem("user") ||
      localStorage.getItem("user") ||
      sessionStorage.getItem("st_session");
    let user = null;
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error("Failed to parse user data:", e);
      user = null;
    }

    const merchantId = user?.user_id || "U_MER_1"; // Default to first merchant if user not found
    const n = {
      ...d,
      id: this.nextShipId(),
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      status: "pending",
      merchantId: merchantId,
    };
    window.mockData.merchantShipments.unshift(n);
    console.log("Shipment added:", n);
    return n;
  },
};

/* ========================================================================== */
/* 3. DELIVERY AGENT DATA (DeliveryData Interface)                           */
/* ========================================================================== */

window.mockData.agentOrders = [
  {
    id: 1001,
    customer: "Rajesh Kumar",
    phone: "+91 98450 12345",
    status: "in-transit",
    priority: "High",
    origin: "Chennai Central Hub",
    destination: "Shanti Villa, Chennai",
    eta: "01:15 PM",
    amount: 1250,
    distance: "4.5 KM",
    packageId: 4421,
    paymentMode: "Prepaid",
  },
  {
    id: 1002,
    customer: "Priya Nair",
    phone: "+91 98765 43210",
    status: "pending",
    priority: "Medium",
    origin: "Chennai Central Hub",
    destination: "OMR, Chennai",
    eta: "12:30 PM",
    amount: 849,
    distance: "3.2 KM",
    packageId: 4422,
    paymentMode: "COD",
  },
];

window.mockData.agentHistory = [
  {
    orderId: 505,
    customer: "Rahul",
    location: "T. Nagar, Chennai",
    date: "8-3-2026",
    time: "14:20 PM",
    status: "Completed",
    rating: 4,
  },
];

// Delivery Agent Profile
const agentMukesh = {
  name: "Mukesh",
  agentId: "DA102",
  role: "Delivery Agent",
  email: "mukesh@swifttrack.com",
  phone: "+91 98765 43210",
  currentStatus: "available",
  hub: { name: "Chennai Central Hub", code: "CHN001" },
};
window.mockData.agentProfile = agentMukesh;
window.mockData.users.push({
  user_id: "U_AGT_102",
  name: "Mukesh",
  email: "mukesh@swifttrack.com",
  password: "password123",
  role: "agent",
  hub_id: "H001",
  active: true,
});

window.DeliveryData = {
  get orders() {
    return window.mockData.agentOrders;
  },
  get history() {
    return window.mockData.agentHistory;
  },

  getOrders(filter = "all") {
    if (filter === "all") return [...this.orders];
    return this.orders.filter((o) => o.status === filter);
  },
  getOrderById(id) {
    return this.orders.find((o) => o.id === parseInt(id));
  },
  updateOrderStatus(id, newStatus) {
    const o = this.orders.find((o) => o.id === parseInt(id));
    if (o) {
      o.status = newStatus;
      return true;
    }
    return false;
  },
  getProfile() {
    return window.mockData.agentProfile;
  },
};

/* ========================================================================== */
/* 4. HUB MANAGER DATA (Real-time Simulation)                                */
/* ========================================================================== */

// Seed Hub Manager Agents
const agentSeed = [
  {
    name: "Rahul Kumar",
    hub: "H001",
    avail: "Available",
    type: "Electric Scooter",
    charge: "85%",
    tasks: 1,
    avatar: "assets/agent-1.jpg",
  },
  {
    name: "Tanya Singh",
    hub: "H001",
    avail: "Busy",
    type: "Motorcycle",
    fuel: "40%",
    tasks: 2,
    avatar: "assets/agent-2.jpg",
  },
  {
    name: "Ajith Kumar",
    hub: "H001",
    avail: "Available",
    type: "Electric Scooter",
    charge: "92%",
    tasks: 0,
    avatar: "assets/agent-3.jpg",
  },
  {
    name: "Anita Reddy",
    hub: "H002",
    avail: "Available",
    type: "Bike",
    charge: "78%",
    tasks: 1,
    avatar: "assets/agent-4.jpg",
  },
];

agentSeed.forEach((a, idx) => {
  const aId = `AGT_${idx + 1}`;
  const uId = `U_AGT_${idx + 1}`;
  window.mockData.users.push({
    user_id: uId,
    name: a.name,
    email: `agent${idx + 1}@swifttrack.com`,
    password: "password123",
    role: "agent",
    hub_id: a.hub,
    active: true,
  });
  window.mockData.agents.push({
    agent_id: aId,
    user_id: uId,
    name: a.name,
    hub_id: a.hub,
    phone: `987654321${idx}`,
    availability_status: a.avail,
    vehicle_type: a.type,
    charge: a.charge || a.fuel,
    tasks_count: a.tasks,
    avatar: a.avatar,
  });
});

// Seed Hub Manager Orders
for (let i = 1; i <= 20; i++) {
  const hub = window.mockData.hubs[i % 4];
  const status =
    i % 5 === 0 ? "Delivered" : i % 3 === 0 ? "In Transit" : "Pending";
  const pkgTypes = [
    "Electronics",
    "Documents",
    "Apparel",
    "Home Decor",
    "Medical",
  ];
  const date = new Date();
  date.setHours(date.getHours() - i); // staggered times

  window.mockData.orders.push({
    order_id: `ORD_${i}`,
    tracking_id: `ST-${100000 + i}`,
    customer_name: customerNames[i % 5],
    customer_phone: `+91 9${8932 + i} ${1000 + i}`,
    pickup_hub_id: hub.hub_id,
    delivery_address: `Street ${i}, ${hub.location}`,
    status: status,
    agent_id: status === "Pending" ? null : `AGT_${(i % 3) + 1}`,
    merchant_id: `U_MER_1`,
    package_type: pkgTypes[i % 5],
    weight: (0.5 + Math.random() * 4.5).toFixed(1),
    amount: (500 + Math.random() * 5000).toFixed(0),
    created_at: date.toISOString(),
    updated_at: new Date().toISOString(),
  });
}

console.log("SwiftTrack Unified Mock Data Initialized.");
