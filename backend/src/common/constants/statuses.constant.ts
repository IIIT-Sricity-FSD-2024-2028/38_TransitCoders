// ODDT-211 — OrderStatus enum + VALID_TRANSITIONS state machine
// Used by OrdersService.updateStatus() to enforce legal status progressions.
// No skipping, no reversals allowed.
export enum OrderStatus {
  PENDING = 'Pending',
  ASSIGNED = 'Assigned',
  PICKED_UP = 'PickedUp',
  IN_TRANSIT = 'InTransit',
  OUT_FOR_DELIVERY = 'OutForDelivery',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

/**
 * Defines which statuses can follow each status.
 * OrdersService checks this map before applying any status update.
 */
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};
