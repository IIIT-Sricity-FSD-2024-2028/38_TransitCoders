import { statusLabel } from '../../services/orderStatus.js';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

export function normalizeMerchantOrder(order) {
  return {
    id: order.orderId || order.id,
    backendId: order.id,
    trackingNumber: order.trackingId || order.orderId,
    recipientName: order.customerName,
    recipientPhone: order.customerPhone,
    pickupAddress: order.pickupAddress,
    deliveryAddress: order.deliveryAddress,
    pickupHubId: order.pickupHubId,
    deliveryHubId: order.deliveryHubId,
    origin: order.pickupAddress?.split(',').at(-1)?.trim() || order.pickupHubId,
    destination: order.deliveryAddress?.split(',').at(-1)?.trim() || order.deliveryHubId,
    packageWeight: order.weight,
    billableWeight: order.pricingBreakdown?.billableWeightKg,
    packageType: order.packageType,
    serviceType: order.serviceLevel,
    assignedAgentName: order.assignedAgentName,
    status: statusLabel(order.status).toUpperCase().replaceAll(' ', '_'),
    price: order.amount,
    paymentMode: order.paymentMode,
    paymentStatus: order.paymentStatus,
    pickupScheduledAt: order.pickupScheduledAt,
    date: formatDate(order.createdAt),
    createdAt: order.createdAt,
    timeline: (order.statusHistory || []).map((event, index, events) => ({
      title: event.note || statusLabel(event.status),
      time: event.timestamp ? new Date(event.timestamp).toLocaleString('en-IN') : '—',
      status: index === events.length - 1 ? 'active' : 'done',
    })),
  };
}

export function normalizeMerchantTicket(ticket) {
  return {
    ...ticket,
    id: ticket.ticketId || ticket.id,
    date: formatDate(ticket.createdAt),
    status: (ticket.status || 'open').toUpperCase(),
    priority: (ticket.priority === 'med' ? 'medium' : ticket.priority || 'medium').toUpperCase(),
  };
}

export const PACKAGE_TYPE_WEIGHT_LIMITS = {
  Envelope: { min: 0.1, max: 5.0, description: 'Up to 5 kg (Documents & Flyers)' },
  Box: { min: 0.1, max: 30.0, description: '0.1 – 30 kg (Cartons & Parcels)' },
  Pallet: { min: 10.0, max: 50.0, description: '10 – 50 kg (Heavy Freight / Skids)' },
};

export const PACKAGE_TYPES = ['Box', 'Envelope', 'Pallet'];

export function isPackageTypeAllowed(packageType, weight) {
  if (!packageType || !Number.isFinite(weight)) return true;
  const normalizedType = Object.keys(PACKAGE_TYPE_WEIGHT_LIMITS).find(
    (key) => key.toLowerCase() === packageType.toLowerCase(),
  );
  if (!normalizedType) return true;
  const limits = PACKAGE_TYPE_WEIGHT_LIMITS[normalizedType];
  return weight >= limits.min && weight <= limits.max;
}

export function getPackageTypeErrorMessage(packageType, weight) {
  if (!packageType || !Number.isFinite(weight)) return '';
  const normalizedType = Object.keys(PACKAGE_TYPE_WEIGHT_LIMITS).find(
    (key) => key.toLowerCase() === packageType.toLowerCase(),
  );
  if (!normalizedType) return '';
  const limits = PACKAGE_TYPE_WEIGHT_LIMITS[normalizedType];
  if (weight < limits.min) {
    return `${normalizedType} requires a minimum weight of ${limits.min} kg (${weight} kg entered).`;
  }
  if (weight > limits.max) {
    return `${normalizedType} supports a maximum weight of ${limits.max} kg (${weight} kg entered).`;
  }
  return '';
}

export function getValidPackageType(weight, preferredType = 'Box') {
  if (isPackageTypeAllowed(preferredType, weight)) return preferredType;
  const fallback = PACKAGE_TYPES.find((type) => isPackageTypeAllowed(type, weight));
  return fallback || preferredType;
}

export function getAutoDimensions(packageType = 'Box', weight = 1) {
  const w = parseFloat(weight) || 1;
  const type = (packageType || 'Box').toLowerCase();

  if (type === 'envelope') {
    if (w <= 0.5) return { length: 24, width: 16, height: 1, label: 'Small Document Pouch' };
    if (w <= 1.5) return { length: 30, width: 22, height: 2, label: 'Standard A4 Document Flyer' };
    if (w <= 3.0) return { length: 38, width: 28, height: 4, label: 'Heavy Document Folder' };
    return { length: 42, width: 32, height: 6, label: 'Large Courier Pouch (Up to 5kg)' };
  }

  if (type === 'pallet') {
    if (w <= 50) return { length: 80, width: 60, height: 60, label: 'Quarter Pallet (Mini-Skid)' };
    if (w <= 150) return { length: 120, width: 80, height: 100, label: 'Standard Euro Pallet (EUR-1)' };
    if (w <= 300) return { length: 120, width: 100, height: 140, label: 'Industrial Freight Pallet' };
    return { length: 120, width: 120, height: 180, label: 'Heavy Master Pallet' };
  }

  if (w <= 0.5) return { length: 18, width: 12, height: 8, label: 'Extra Small Box (0.5kg)' };
  if (w <= 1.5) return { length: 22, width: 16, height: 12, label: 'Small Carton (1.5kg)' };
  if (w <= 3.5) return { length: 28, width: 22, height: 16, label: 'Medium Parcel Box (3.5kg)' };
  if (w <= 7.0) return { length: 36, width: 28, height: 24, label: 'Standard Shipping Box (7kg)' };
  if (w <= 15.0) return { length: 48, width: 36, height: 32, label: 'Large Freight Box (15kg)' };
  if (w <= 30.0) return { length: 60, width: 45, height: 40, label: 'Heavy Duty Crate (30kg)' };
  return { length: 75, width: 55, height: 50, label: 'Jumbo Industrial Box' };
}
