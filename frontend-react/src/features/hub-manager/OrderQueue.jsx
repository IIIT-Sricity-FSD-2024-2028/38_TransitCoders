import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { selectCurrentUser } from "../../shared/auth/authSlice";
import { useOrders } from "../../shared/orders/ordersHooks";
import OrderCard from "./OrderCard";
import AssignAgentModal from "./modals/AssignAgentModal";
import TransferHubModal from "./modals/TransferHubModal";
import OrderDetailsModal from "./modals/OrderDetailsModal";
import { canAssign, canTransfer } from "./warehouseWorkflow";
import "./OrderQueue.css";

export default function OrderQueue() {
  const hubId = useAppSelector(selectCurrentUser)?.hubId;
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: queryError,
    refetch: refreshOrders,
  } = useOrders(undefined, { skip: !hubId });

  const loading = Boolean(hubId) && ordersLoading;
  const error = hubId ? (queryError?.message || "") : "No hub is assigned to this account.";
  const [status, setStatus] = useState("All");
  const [params, setParams] = useSearchParams();
  const searchTerm = params.get("id") || "";
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignOrder, setSelectedAssignOrder] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferOrder, setSelectedTransferOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  function openAssign(order) {
    setShowDetailsModal(false);
    setSelectedAssignOrder(order);
    setShowAssignModal(true);
  }

  function openTransfer(order) {
    setShowDetailsModal(false);
    setSelectedTransferOrder(order);
    setShowTransferModal(true);
  }

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = status === "All" || order.status === status;
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      order.id.toLowerCase() === term ||
      (order.orderId && order.orderId.toLowerCase().includes(term)) ||
      (order.trackingId && order.trackingId.toLowerCase().includes(term)) ||
      (order.customerName && order.customerName.toLowerCase().includes(term)) ||
      (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <div className="order-queue">
        <h1>Order Queue</h1>
        <p>View, search, and filter all orders.</p>

        <div className="queue-search-container">
          <input
            type="text"
            className="queue-search-input"
            placeholder="Search by Order ID, Tracking ID, customer, address..."
            value={searchTerm}
            onChange={(e) => setParams(e.target.value ? { id: e.target.value } : {}, { replace: true })}
          />
        </div>

        <div className="queue-filter">
          {[
            "All",
            "Pending",
            "Assigned",
            "PickedUp",
            "InTransit",
            "OutForDelivery",
            "Delivered",
            "Cancelled",
            "Returned",
            "Failed",
          ].map((item) => {
            return (
              <button
                key={item}
                className={status === item ? "active" : ""}
                onClick={() => setStatus(item)}
              >
                {item}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="queue-status-msg">Loading orders...</p>
        ) : error ? (
          <p className="queue-error-msg" role="alert">{error}</p>
        ) : filteredOrders.length === 0 ? (
          <p className="queue-status-msg">No orders found matching the criteria.</p>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              hubId={hubId}
              onAssign={canAssign(order, hubId) ? () => openAssign(order) : undefined}
              onTransfer={canTransfer(order, hubId) ? () => openTransfer(order) : undefined}
              onView={() => {
                setSelectedOrderId(order.id);
                setShowDetailsModal(true);
              }}
            />
          ))
        )}
      </div>

      <AssignAgentModal
        order={selectedAssignOrder}
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSuccess={refreshOrders}
      />

      <TransferHubModal
        order={selectedTransferOrder}
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={refreshOrders}
      />

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onSuccess={refreshOrders}
        onAssign={selectedOrder && canAssign(selectedOrder, hubId) ? () => openAssign(selectedOrder) : undefined}
        onTransfer={selectedOrder && canTransfer(selectedOrder, hubId) ? () => openTransfer(selectedOrder) : undefined}
      />
    </>
  );
}
