/**
 * Mock data for Lab 2 — Hub Manager Dispatch.
 *
 * Field names intentionally mirror the real vanilla-app data
 * (front-end/assets/js/state.js + state-compat.js window.mockData)
 * so this can later be swapped for real API data without touching
 * the components.
 *
 * Scope: one hub (H001 — Chennai Central Hub), like a logged-in
 * Chennai hub manager sees.
 */

export const HUB_ID = 'H001';

export const hubs = [
  { hub_id: 'H001', name: 'Chennai Central Hub', location: 'Chennai', status: 'Active' },
  { hub_id: 'H002', name: 'Bengaluru Logistics Park', location: 'Bengaluru', status: 'Active' },
  { hub_id: 'H003', name: 'Hyderabad Logistics Hub', location: 'Hyderabad', status: 'Active' },
];

export const initialOrders = [
  {
    order_id: 'ORD_1',
    tracking_id: 'SWT-200001',
    customer_name: 'Asha Nair',
    customer_phone: '+91 98450 1102',
    pickup_hub_id: 'H001',
    pickup_address: 'Chennai Central Hub',
    delivery_address: 'Unit 10, T. Nagar, Chennai',
    package_type: 'Express',
    weight: 1.2,
    amount: 650,
    status: 'Pending',
    assigned_agent: null,
  },
  {
    order_id: 'ORD_2',
    tracking_id: 'SWT-200002',
    customer_name: 'Kiran Reddy',
    customer_phone: '+91 98450 2213',
    pickup_hub_id: 'H001',
    pickup_address: 'Chennai Central Hub',
    delivery_address: 'Unit 11, Adyar, Chennai',
    package_type: 'Standard',
    weight: 1.6,
    amount: 770,
    status: 'Pending',
    assigned_agent: null,
  },
  {
    order_id: 'ORD_3',
    tracking_id: 'SWT-200003',
    customer_name: 'Deepa Iyer',
    customer_phone: '+91 98450 3324',
    pickup_hub_id: 'H001',
    pickup_address: 'Chennai Central Hub',
    delivery_address: 'Unit 12, Anna Nagar, Chennai',
    package_type: 'Express',
    weight: 2.0,
    amount: 890,
    status: 'Pending',
    assigned_agent: null,
  },
  {
    order_id: 'ORD_4',
    tracking_id: 'SWT-200004',
    customer_name: 'Manoj Menon',
    customer_phone: '+91 98450 4435',
    pickup_hub_id: 'H001',
    pickup_address: 'Chennai Central Hub',
    delivery_address: 'Unit 13, Velachery, Chennai',
    package_type: 'Standard',
    weight: 2.4,
    amount: 1010,
    status: 'Assigned',
    assigned_agent: 'U_AGT_102',
  },
  {
    order_id: 'ORD_5',
    tracking_id: 'SWT-200005',
    customer_name: 'Harish Kumar',
    customer_phone: '+91 98450 5546',
    pickup_hub_id: 'H001',
    pickup_address: 'Chennai Central Hub',
    delivery_address: 'Unit 14, Mylapore, Chennai',
    package_type: 'Express',
    weight: 2.8,
    amount: 1130,
    status: 'In Transit',
    assigned_agent: 'U_AGT_102',
  },
  {
    order_id: 'ORD_6',
    tracking_id: 'SWT-200006',
    customer_name: 'Divya Rao',
    customer_phone: '+91 98450 6657',
    pickup_hub_id: 'H001',
    pickup_address: 'Chennai Central Hub',
    delivery_address: 'Unit 15, Tambaram, Chennai',
    package_type: 'Standard',
    weight: 3.2,
    amount: 1250,
    status: 'Out for Delivery',
    assigned_agent: 'U_AGT_103',
  },
];

export const initialDrivers = [
  {
    agent_id: 'U_AGT_102',
    name: 'Karthik',
    vehicle_type: 'Bike · TN-09 1234',
    status: 'Available',
    tasks_count: 2,
  },
  {
    agent_id: 'U_AGT_103',
    name: 'Akhil Menon',
    vehicle_type: 'Van · TN-09 8821',
    status: 'Available',
    tasks_count: 1,
  },
  {
    agent_id: 'U_AGT_106',
    name: 'Ramesh K',
    vehicle_type: 'Bike · TN-09 2210',
    status: 'Available',
    tasks_count: 0,
  },
  {
    agent_id: 'U_AGT_107',
    name: 'Suresh P',
    vehicle_type: 'Van · TN-09 4415',
    status: 'Busy',
    tasks_count: 3,
  },
];

/** Same priority rules as front-end/hub-manager/js/dispatch.js */
export function calculatePriority(order) {
  if (order.status === 'Pending') return 'HIGH';
  if (order.status === 'Assigned' || order.status === 'In Transit') return 'MEDIUM';
  return 'LOW';
}

export function getHubName(hubId) {
  const hub = hubs.find((h) => h.hub_id === hubId);
  return hub ? hub.name : hubId;
}

export function getDriverName(agentId, drivers) {
  if (!agentId) return 'Unassigned';
  const driver = drivers.find((d) => d.agent_id === agentId);
  return driver ? driver.name : agentId;
}

/**
 * Port of deriveOrderMeta() in front-end/hub-manager/js/hub-manager.js —
 * deterministic ETA/phone/payment derived from the order id, exactly like
 * the vanilla app does.
 */
export function deriveOrderMeta(order) {
  const str = (order.order_id || 'ORD_0').replace(/\D/g, '');
  const n = parseInt(str || '0', 10);
  const distance = (2.4 + (n % 28) / 5).toFixed(1);
  const etaMinutes = 12 + (n % 35);
  const phone =
    order.customer_phone ||
    '+91 98' + String(10000000 + (n % 89999999)).slice(-8);
  const payment = n % 3 === 0 ? 'COD' : 'PREPAID';
  return {
    phone,
    distanceKm: distance,
    etaText: `${etaMinutes} mins`,
    paymentMode: payment,
  };
}
