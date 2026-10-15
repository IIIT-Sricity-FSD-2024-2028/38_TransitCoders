/**
 * merchantHelpers.js
 * 
 * Utility functions for merchant order management, local persistence,
 * tracking numbers, and rate calculations.
 */

const STORAGE_KEY = 'swifttrack_merchant_orders';
const TRACKING_KEY = 'swifttrack_active_tracking';

// ─── Seed Data ───────────────────────────────────────────────
// Initial sample orders shown when the app loads for the first time
const SEED_ORDERS = [
  {
    id: 'SWT-2026-98471',
    trackingNumber: 'SWT-2026-98471',
    recipientName: 'Divya Iyer',
    recipientPhone: '+91 91234 56789',
    pickupAddress: '24 Mount Road, Chennai',
    deliveryAddress: '15 MG Road, Bengaluru',
    origin: 'Chennai',
    destination: 'Bengaluru',
    packageWeight: 2.5,
    packageType: 'Box',
    serviceType: 'express',
    status: 'IN_TRANSIT',
    price: 450,
    date: '28 Mar 2026',
    timeline: [
      { title: 'Order Placed', time: 'Mar 28, 2026 · 09:15 AM', status: 'done' },
      { title: 'Picked Up by Agent', time: 'Mar 28, 2026 · 02:30 PM', status: 'done' },
      { title: 'In Transit – Bengaluru Hub', time: 'Mar 29, 2026 · 08:00 AM', status: 'active' },
      { title: 'Out for Delivery', time: 'Expected Mar 31', status: 'pending' },
      { title: 'Delivered', time: 'Expected Apr 1', status: 'pending' }
    ]
  },
  {
    id: 'SWT-2026-98470',
    trackingNumber: 'SWT-2026-98470',
    recipientName: 'Karthik Raja',
    recipientPhone: '+91 98765 43210',
    pickupAddress: '10 Anna Nagar, Chennai',
    deliveryAddress: '42 Jubilee Hills, Hyderabad',
    origin: 'Chennai',
    destination: 'Hyderabad',
    packageWeight: 1.2,
    packageType: 'Envelope',
    serviceType: 'standard',
    status: 'DELIVERED',
    price: 320,
    date: '27 Mar 2026',
    timeline: [
      { title: 'Order Placed', time: 'Mar 26, 2026 · 10:00 AM', status: 'done' },
      { title: 'Picked Up', time: 'Mar 26, 2026 · 04:00 PM', status: 'done' },
      { title: 'In Transit – Hyderabad Hub', time: 'Mar 27, 2026 · 06:00 AM', status: 'done' },
      { title: 'Delivered', time: 'Mar 27, 2026 · 03:15 PM', status: 'done' }
    ]
  }
];

// ─── Helper Functions ────────────────────────────────────────

/**
 * Generate a unique tracking number
 * @returns {string} e.g. "SWT-2026-48271"
 */
export function generateTrackingNumber() {
  return `SWT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
}

/**
 * Load all merchant orders from localStorage.
 * Returns seed data on first visit.
 * @returns {Array} Array of order objects
 */
export function loadOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load orders:', e);
  }
  // First time ever: save seed data and return it
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ORDERS));
  return SEED_ORDERS;
}

/**
 * Save the full orders array to localStorage.
 * Call this after every add/update/delete operation.
 * @param {Array} orders - The complete updated orders array
 */
export function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

/**
 * Find a single order by tracking number or ID.
 * @param {string} trackingId - The tracking number or ID to search for
 * @returns {Object|null} The matching order, or null if not found
 */
export function findOrder(trackingId) {
  const orders = loadOrders();
  const searchId = (trackingId || '').toLowerCase();
  return orders.find(
    (o) =>
      (o.trackingNumber && o.trackingNumber.toLowerCase() === searchId) ||
      (o.id && o.id.toLowerCase() === searchId)
  ) || null;
}

/**
 * Save a selected order for the Track Shipment page to read.
 * Stores selected order in localStorage for cross-page navigation.
 * @param {Object} order - The order to pre-select on the tracking page
 */
export function setActiveTracking(order) {
  localStorage.setItem(TRACKING_KEY, JSON.stringify(order));
}

/**
 * Get the pre-selected tracking order (set by another page).
 * @returns {Object|null}
 */
export function getActiveTracking() {
  try {
    const saved = localStorage.getItem(TRACKING_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Automatically calculates standard package dimensions (L x W x H in cm)
 * based on package type (Box, Envelope, Pallet) and weight in kg.
 * @param {string} packageType - Package type ('Box', 'Envelope', 'Pallet')
 * @param {number|string} weight - Package weight in kg
 * @returns {{ length: number, width: number, height: number, label: string }}
 */
export function getAutoDimensions(packageType = 'Box', weight = 1) {
  const w = parseFloat(weight) || 1;
  const type = (packageType || 'Box').toLowerCase();

  if (type === 'envelope') {
    if (w <= 0.5) return { length: 24, width: 16, height: 1, label: 'Small Document Pouch' };
    if (w <= 1.5) return { length: 30, width: 22, height: 2, label: 'Standard A4 Document Flyer' };
    if (w <= 3.0) return { length: 38, width: 28, height: 4, label: 'Heavy Document Folder' };
    return { length: 42, width: 32, height: 6, label: 'Large Courier Pouch' };
  }

  if (type === 'pallet') {
    if (w <= 50) return { length: 80, width: 60, height: 60, label: 'Quarter Pallet (Mini-Skid)' };
    if (w <= 150) return { length: 120, width: 80, height: 100, label: 'Standard Euro Pallet (EUR-1)' };
    if (w <= 300) return { length: 120, width: 100, height: 140, label: 'Industrial Freight Pallet' };
    return { length: 120, width: 120, height: 180, label: 'Heavy Master Pallet' };
  }

  // Default: Box (Carton)
  if (w <= 0.5) return { length: 18, width: 12, height: 8, label: 'Extra Small Box (0.5kg)' };
  if (w <= 1.5) return { length: 22, width: 16, height: 12, label: 'Small Carton (1.5kg)' };
  if (w <= 3.5) return { length: 28, width: 22, height: 16, label: 'Medium Parcel Box (3.5kg)' };
  if (w <= 7.0) return { length: 36, width: 28, height: 24, label: 'Standard Shipping Box (7kg)' };
  if (w <= 15.0) return { length: 48, width: 36, height: 32, label: 'Large Freight Box (15kg)' };
  if (w <= 30.0) return { length: 60, width: 45, height: 40, label: 'Heavy Duty Crate (30kg)' };
  return { length: 75, width: 55, height: 50, label: 'Jumbo Industrial Box' };
}
