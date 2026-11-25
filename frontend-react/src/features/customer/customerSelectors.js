import { isActiveOrder, statusKey, statusLabel } from '../../services/orderStatus';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

export function normalizeOrderReference(id) {
  const query = (id || '').trim();
  return /^(TRK|ORD)-/i.test(query) ? query.toUpperCase() : query;
}

export function normalizeCustomerOrder(order) {
  return {
    ...order,
    backendId: order.id,
    id: order.orderId || order.id,
    customerName: order.customerName || 'Customer',
    pickupAddress: order.pickupAddress || order.pickupHubId || 'Unavailable',
    deliveryAddress: order.deliveryAddress || 'Unavailable',
    estimatedDelivery: formatDate(order.estimatedDelivery),
    date: formatDate(order.createdAt),
    status: statusLabel(order.status),
    assignedAgent: order.assignedAgent || (order.assignedAgentId ? 'Assigned delivery agent' : 'Unassigned'),
    packageType: order.packageType || 'Package',
    statusHistory: order.statusHistory || [],
  };
}

export function normalizeCustomerComplaint(complaint) {
  return { ...complaint, details: complaint.description };
}

export function normalizeCustomerFeedback(feedback) {
  return { ...feedback, comment: feedback.comment || feedback.comments };
}

export function buildCustomerDashboardData(orders, complaints) {
  const activeOrders = orders.filter((order) => isActiveOrder(order.status));
  return {
    stats: {
      activeShipments: activeOrders.length,
      delivered: orders.filter((order) => statusKey(order.status) === 'delivered').length,
      supportTickets: complaints.length,
    },
    activeOrder: activeOrders[0] || null,
    recentOrders: orders.slice(0, 4),
  };
}
