"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_TRANSITIONS = exports.OrderStatus = void 0;
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "Pending";
    OrderStatus["ASSIGNED"] = "Assigned";
    OrderStatus["PICKED_UP"] = "PickedUp";
    OrderStatus["IN_TRANSIT"] = "InTransit";
    OrderStatus["OUT_FOR_DELIVERY"] = "OutForDelivery";
    OrderStatus["DELIVERED"] = "Delivered";
    OrderStatus["CANCELLED"] = "Cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
exports.VALID_TRANSITIONS = {
    [OrderStatus.PENDING]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
    [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
    [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT],
    [OrderStatus.IN_TRANSIT]: [OrderStatus.OUT_FOR_DELIVERY],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
};
//# sourceMappingURL=statuses.constant.js.map