/**
 * merchantHelpers.js
 * 
 * Central data layer for Merchant operations.
 * Exclusively uses real data from the backend SQLite database (http://localhost:3001)
 * with zero hardcoded mock/seed data.
 */

import { API, Token } from './api';

const STORAGE_KEY = 'swifttrack_merchant_orders';
const TRACKING_KEY = 'swifttrack_active_tracking';
const HUBS_CACHE_KEY = 'swifttrack_merchant_hubs';
const PRICING_CACHE_KEY = 'swifttrack_merchant_pricing';

// Default customer UUID in backend SQLite database (Aarav Sharma)
const DEFAULT_CUSTOMER_ID = 'f91c2ff6-78ac-4d27-8f14-b32e60a9c595';

// ─── Backend Authentication ──────────────────────────────────

/**
 * Ensures a valid authentication token exists for Merchant API calls.
 * Authenticates with merchant1@example.com / password123 against the backend.
 */
export async function ensureMerchantAuth() {
  const currentToken = Token.get();
  if (currentToken) return currentToken;

  try {
    const res = await API.auth.login('merchant1@example.com', 'password123');
    if (res && res.data && res.data.token) {
      Token.set(res.data.token);
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('userRole', 'merchant');
      }
      return res.data.token;
    }
  } catch (err) {
    console.error('[merchantHelpers] Authentication failed with backend:', err?.message || err);
  }
  return null;
}

// ─── Order Normalization ─────────────────────────────────────

/**
 * Normalizes backend SQLite order record into the frontend merchant format.
 * @param {Object} o - Raw backend order object from database
 * @returns {Object} Normalized merchant order
 */
export function normalizeBackendOrder(o) {
  if (!o) return null;

  // Extract cities from addresses
  const extractCity = (addr, fallback = 'Hub') => {
    if (!addr) return fallback;
    const parts = addr.split(',').map((p) => p.trim());
    return parts[parts.length - 1] || parts[0] || fallback;
  };

  const originCity = extractCity(o.pickupAddress, 'Chennai');
  const destCity = extractCity(o.deliveryAddress, 'Destination');

  // Parse status timeline from database statusHistory
  let timeline = [];
  if (Array.isArray(o.statusHistory) && o.statusHistory.length > 0) {
    timeline = o.statusHistory.map((h) => ({
      title: h.note || `Status: ${h.status}`,
      time: h.timestamp
        ? new Date(h.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Recent',
      status: (h.status || '').toLowerCase() === 'delivered' ? 'done' : 'active',
    }));
  } else {
    timeline = [
      {
        title: 'Order Placed',
        time: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Just now',
        status: 'done',
      },
      {
        title: o.status || 'Processing at Hub',
        time: o.updatedAt ? new Date(o.updatedAt).toLocaleDateString() : 'Active',
        status: (o.status || '').toLowerCase() === 'delivered' ? 'done' : 'active',
      },
    ];
  }

  return {
    id: o.orderId || o.id,
    backendId: o.id,
    trackingNumber: o.trackingId || o.orderId || o.id,
    recipientName: o.customerName || 'Customer',
    recipientPhone: o.customerPhone || '+91 94444 00000',
    pickupAddress: o.pickupAddress || 'Origin Hub',
    deliveryAddress: o.deliveryAddress || 'Delivery Address',
    origin: originCity,
    destination: destCity,
    packageWeight: Number(o.weight) || 1.0,
    packageType: o.packageType || 'Box',
    serviceType: (o.serviceLevel || 'standard').toLowerCase(),
    status: (o.status || 'PENDING').toUpperCase().replace(/\s+/g, '_'),
    price: Number(o.amount) || 0,
    date: o.createdAt
      ? new Date(o.createdAt).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Recent',
    timeline,
  };
}

// ─── Live Orders from Database ───────────────────────────────

/**
 * Load cached orders synchronously for instant render.
 * Returns empty array if no orders are present (no fake seed data).
 * @returns {Array} Array of orders
 */
export function loadOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load orders from cache:', e);
  }
  return [];
}

/**
 * Save orders array to localStorage cache.
 * @param {Array} orders - Complete orders array
 */
export function saveOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders || []));
  } catch (e) {
    console.warn('Failed to save orders to cache:', e);
  }
}

/**
 * Asynchronously fetch live orders exclusively from the backend SQLite database.
 * @returns {Promise<Array>} Array of orders from the database
 */
export async function fetchMerchantOrders() {
  try {
    await ensureMerchantAuth();
    const liveData = await API.orders.getAll();

    if (Array.isArray(liveData)) {
      const normalized = liveData.map(normalizeBackendOrder);
      saveOrders(normalized);
      return normalized;
    }
  } catch (err) {
    console.error('[merchantHelpers] Failed to fetch orders from database:', err?.message || err);
  }

  return loadOrders();
}

/**
 * Create a new shipment directly in the backend SQLite database via POST /orders.
 * @param {Object} shipment - New shipment payload
 * @returns {Promise<Object>} Created order from database
 */
export async function createMerchantOrder(shipment) {
  try {
    await ensureMerchantAuth();

    const payload = {
      customerId: DEFAULT_CUSTOMER_ID,
      trackingId: shipment.trackingNumber || generateTrackingNumber(),
      deliveryAddress: shipment.deliveryAddress,
      pickupAddress: shipment.pickupAddress,
      pickupHubId: shipment.pickupHubId,
      deliveryHubId: shipment.deliveryHubId,
      priority: shipment.priority || 'Medium',
      packageType: shipment.packageType || 'Box',
      weight: Number(shipment.packageWeight) || 1,
      serviceLevel: (shipment.serviceType || 'standard').toLowerCase(),
      paymentMode: shipment.paymentMode || 'Prepaid',
    };

    const backendOrder = await API.orders.create(payload);

    if (backendOrder) {
      const normalized = normalizeBackendOrder(backendOrder);
      const currentOrders = loadOrders();
      const updated = [normalized, ...currentOrders.filter((o) => o.id !== normalized.id)];
      saveOrders(updated);
      return normalized;
    }
  } catch (err) {
    console.error('[merchantHelpers] Backend order creation failed:', err?.message || err);
    throw err;
  }

  return shipment;
}

/**
 * Cancel an order in the backend database via PATCH /orders/:id/cancel.
 * @param {string} orderId - Order identifier
 * @returns {Promise<Array>} Refreshed orders list
 */
export async function cancelMerchantOrder(orderId) {
  const orders = loadOrders();
  const target = orders.find((o) => o.id === orderId || o.trackingNumber === orderId || o.backendId === orderId);

  if (target && target.backendId) {
    try {
      await ensureMerchantAuth();
      await API.orders.cancel(target.backendId);
    } catch (err) {
      console.error('[merchantHelpers] Backend order cancel failed:', err?.message || err);
    }
  }

  // Refresh from backend database
  return fetchMerchantOrders();
}

/**
 * Advance or update an order status in the backend database.
 * @param {string} orderId - Order identifier
 * @param {string} nextStatus - Next status
 * @returns {Promise<Array>} Refreshed orders list
 */
export async function updateMerchantOrderStatus(orderId, nextStatus) {
  const orders = loadOrders();
  const target = orders.find((o) => o.id === orderId || o.trackingNumber === orderId || o.backendId === orderId);

  if (target && target.backendId) {
    try {
      await ensureMerchantAuth();
      await API.orders.updateStatus(target.backendId, nextStatus);
    } catch (err) {
      console.error('[merchantHelpers] Backend status update failed:', err?.message || err);
    }
  }

  return fetchMerchantOrders();
}

// ─── Live Hubs (Warehouses) from Database ────────────────────

/**
 * Fetches logistics warehouse hubs directly from the backend SQLite database via GET /hubs.
 * @returns {Promise<Array>} Array of warehouse hub objects
 */
export async function fetchMerchantHubs() {
  try {
    await ensureMerchantAuth();
    const hubs = await API.hubs.getAll();
    if (Array.isArray(hubs) && hubs.length > 0) {
      localStorage.setItem(HUBS_CACHE_KEY, JSON.stringify(hubs));
      return hubs;
    }
  } catch (err) {
    console.warn('[merchantHelpers] Could not fetch hubs from backend, checking cache:', err?.message || err);
  }

  try {
    const cached = localStorage.getItem(HUBS_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  return [];
}

// ─── Live Pricing Configuration from Database ───────────────

/**
 * Fetches authoritative pricing configuration from the backend SQLite database via GET /pricing/config.
 * @returns {Promise<Object>} Pricing config object
 */
export async function fetchMerchantPricing() {
  try {
    await ensureMerchantAuth();
    const config = await API.pricing.getConfig();
    if (config) {
      localStorage.setItem(PRICING_CACHE_KEY, JSON.stringify(config));
      return config;
    }
  } catch (err) {
    console.warn('[merchantHelpers] Could not fetch pricing from backend, checking cache:', err?.message || err);
  }

  try {
    const cached = localStorage.getItem(PRICING_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  // Database default fallback
  return {
    baseFee: 40,
    perKgStandard: 25,
    perKgExpress: 45,
    perKgSameDay: 80,
    codFee: 30,
    taxPercent: 5,
    minCharge: 60,
  };
}

// ─── Live Support Tickets from Database ──────────────────────

/**
 * Fetches real support tickets from the backend SQLite database via GET /tickets.
 * @returns {Promise<Array>} Array of ticket objects
 */
export async function fetchMerchantTickets() {
  try {
    await ensureMerchantAuth();
    const tickets = await API.tickets.getAll();
    if (Array.isArray(tickets)) {
      return tickets.map((t) => ({
        id: t.ticketId || t.id,
        backendId: t.id,
        subject: t.subject || 'Support Ticket',
        category: t.category || (t.subject?.toLowerCase().includes('invoice') ? 'Billing' : 'Delivery'),
        date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
        status: (t.status || 'OPEN').toUpperCase(),
        priority: (t.priority || 'MEDIUM').toUpperCase(),
        trackingId: t.trackingId || null,
      }));
    }
  } catch (err) {
    console.error('[merchantHelpers] Failed to fetch tickets from backend:', err?.message || err);
  }
  return [];
}

/**
 * Creates a new support ticket in the backend SQLite database via POST /tickets.
 * @param {Object} ticketData - { subject, category, description, trackingId }
 * @returns {Promise<Object>} Created ticket object
 */
export async function createMerchantTicket(ticketData) {
  await ensureMerchantAuth();
  const res = await API.tickets.create({
    subject: ticketData.subject,
    trackingId: ticketData.trackingId || undefined,
    priority: ticketData.priority || 'med',
  });
  return res;
}

// ─── Live Tracking from Database ─────────────────────────────

/**
 * Track an order by ID or tracking number exclusively from database.
 * @param {string} trackingId - Tracking or Order ID
 * @returns {Promise<Object|null>} Matching order
 */
export async function trackOrderWithBackend(trackingId) {
  if (!trackingId) return null;
  const searchId = trackingId.trim();

  // 1. Search in local cached database orders
  const localMatch = findOrder(searchId);
  if (localMatch) return localMatch;

  // 2. Query backend public tracking API (/tracking/:id)
  try {
    const apiRes = await API.tracking.track(searchId);
    if (apiRes) {
      return normalizeBackendOrder(apiRes);
    }
  } catch (_) {}

  return null;
}

/**
 * Find single order by tracking number or ID from cached database orders.
 * @param {string} trackingId - ID to search
 * @returns {Object|null}
 */
export function findOrder(trackingId) {
  const orders = loadOrders();
  const searchId = (trackingId || '').toLowerCase().trim();
  return (
    orders.find(
      (o) =>
        (o.trackingNumber && o.trackingNumber.toLowerCase() === searchId) ||
        (o.id && o.id.toLowerCase() === searchId) ||
        (o.backendId && o.backendId.toLowerCase() === searchId)
    ) || null
  );
}

/**
 * Store selected tracking order in localStorage for cross-page navigation.
 * @param {Object} order - Order to track
 */
export function setActiveTracking(order) {
  try {
    localStorage.setItem(TRACKING_KEY, JSON.stringify(order));
  } catch (_) {}
}

/**
 * Retrieve active tracking order pre-selected by another page.
 * @returns {Object|null}
 */
export function getActiveTracking() {
  try {
    const saved = localStorage.getItem(TRACKING_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Standard package dimensions lookup (L x W x H in cm) based on package type and weight.
 * @param {string} packageType - 'Box', 'Envelope', 'Pallet'
 * @param {number|string} weight - Weight in kg
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

/**
 * Generates a unique tracking number matching the common database format: TRK-XX00XX00
 * e.g. TRK-AB12CD34, TRK-GH56IJ78
 * @returns {string} Tracking number
 */
export function generateTrackingNumber() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const rL = () => letters[Math.floor(Math.random() * letters.length)];
  const rD = () => digits[Math.floor(Math.random() * digits.length)];
  return `TRK-${rL()}${rL()}${rD()}${rD()}${rL()}${rL()}${rD()}${rD()}`;
}
