const statuses = {
  pending: 'Pending',
  assigned: 'Assigned',
  pickedup: 'Picked Up',
  intransit: 'In Transit',
  outfordelivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  failed: 'Failed',
};

export const deliveryStages = ['pending', 'assigned', 'pickedup', 'intransit', 'outfordelivery', 'delivered'];

export function statusKey(status) {
  return (status || '').toLowerCase().replace(/[\s_-]/g, '');
}

export function statusLabel(status) {
  return statuses[statusKey(status)] || status || 'Unknown';
}

export function isActiveOrder(status) {
  return deliveryStages.slice(0, -1).includes(statusKey(status));
}

export function deliveryStage(status, history = []) {
  const index = deliveryStages.indexOf(statusKey(status));
  if (index >= 0) return index;
  return history.reduce((stage, event) => Math.max(stage, deliveryStages.indexOf(statusKey(event.status))), 0);
}
