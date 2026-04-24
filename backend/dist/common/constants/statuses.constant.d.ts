export declare enum OrderStatus {
    PENDING = "Pending",
    ASSIGNED = "Assigned",
    PICKED_UP = "PickedUp",
    IN_TRANSIT = "InTransit",
    OUT_FOR_DELIVERY = "OutForDelivery",
    DELIVERED = "Delivered",
    CANCELLED = "Cancelled"
}
export declare const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]>;
