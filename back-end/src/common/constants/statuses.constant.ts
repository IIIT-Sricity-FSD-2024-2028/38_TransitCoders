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
  RETURNED = 'Returned',   // Hub-manager authorized post-delivery return (with refund)
  FAILED = 'Failed',       // Agent mishap report during active transit
}

/**
 * Defines which statuses can follow each status.
 * OrdersService checks this map before applying any status update.
 * RETURNED and FAILED are terminal — no further transitions are permitted.
 */
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]:          [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED]:         [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]:        [OrderStatus.IN_TRANSIT, OrderStatus.FAILED],
  [OrderStatus.IN_TRANSIT]:       [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.FAILED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
  [OrderStatus.DELIVERED]:        [OrderStatus.RETURNED],
  [OrderStatus.CANCELLED]:        [],
  [OrderStatus.RETURNED]:         [],   // terminal
  [OrderStatus.FAILED]:           [],   // terminal
};
