export const NEXT_AGENT_MILESTONE = {
  PickedUp: 'InTransit',
  InTransit: 'OutForDelivery',
};

export function mapAgentOrder(order) {
  const status =
    {
      Assigned: 'pending',
      PickedUp: 'in-transit',
      InTransit: 'in-transit',
      OutForDelivery: 'in-transit',
      Delivered: 'delivered',
      Failed: 'failed',
      Cancelled: 'cancelled',
      Returned: 'returned',
    }[order.status] || 'pending';
  const deliveredAt = order.statusHistory?.find((event) => event.status === 'Delivered')?.timestamp;
  return {
    id: order.orderId || order.id,
    orderId: order.orderId || order.id,
    rawId: order.id,
    trackingId: order.trackingId,
    customer: order.customerName,
    phone: order.customerPhone,
    origin: order.pickupAddress || order.pickupHubId || 'Pickup unavailable',
    destination: order.deliveryAddress,
    status,
    backendStatus: order.status,
    awaitingHandoff: Boolean(order.warehouse && !order.warehouse.checkedOutAt),
    pickupHubId: order.pickupHubId,
    priority: order.priority,
    eta: order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString('en-IN') : '—',
    amount: order.amount == null ? '—' : `₹${order.amount}`,
    distance: order.distance || '—',
    deliveredAt,
    createdAt: order.createdAt,
    statusHistory: order.statusHistory || [],
  };
}
