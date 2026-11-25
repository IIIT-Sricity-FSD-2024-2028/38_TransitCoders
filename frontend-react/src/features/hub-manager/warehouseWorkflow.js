export function canAssign(order, hubId) {
  if (!hubId || order.status !== 'Pending' || order.assignedAgentId ||
    (order.pickupHubId && order.pickupHubId !== hubId)) return false;
  return !order.warehouse || (order.deliveryHubId === hubId &&
    Boolean(order.warehouse.checkedInAt) && !order.warehouse.checkedOutAt);
}

export function canTransfer(order, hubId) {
  return Boolean(hubId && order.pickupHubId === hubId && order.status === 'Pending' &&
    !order.assignedAgentId && (!order.warehouse ||
      (order.deliveryHubId !== hubId && order.warehouse.checkedOutAt)));
}

export function warehouseStep(order, hubId) {
  const visit = order.warehouse;
  if (!visit) return null;
  if (order.status === 'Pending' && visit.hubId !== hubId) {
    return { text: `Waiting for hub ${visit.hubId} to transfer this parcel to ${order.deliveryHubId}.` };
  }
  if (visit.hubId !== hubId) return null;
  const scan = (action, label, text) => ({
    label, text, to: `/hub/warehouse?${new URLSearchParams({ reference: order.trackingId, action })}`,
  });
  if (order.status === 'Pending') {
    if (!visit.checkedInAt) {
      return scan('check-in', 'Open warehouse check-in', `Check this parcel in at ${hubId}.`);
    }
    if (order.deliveryHubId !== hubId) {
      return visit.checkedOutAt
        ? { text: `Ready to transfer to ${order.deliveryHubId}. Delivery assignment happens at ${order.deliveryHubId}.` }
        : scan('check-out', 'Open warehouse check-out', `Check this parcel out, then transfer it to ${order.deliveryHubId} for delivery assignment.`);
    }
    if (canAssign(order, hubId)) return { text: 'Ready to assign a delivery agent.' };
  }
  if (order.status === 'Assigned' && !visit.checkedOutAt) {
    return scan('check-out', 'Open warehouse check-out', 'Check this parcel out so the assigned agent can pick it up.');
  }
  return null;
}
