import { useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { selectCurrentUser } from "../../shared/auth/authSlice";
import { useOrders } from "../../shared/orders/ordersHooks";
import OrderCard from "./OrderCard";
import OrderDetailsModal from "./modals/OrderDetailsModal";
import TransferHubModal from "./modals/TransferHubModal";
import { canTransfer } from "./warehouseWorkflow";
import "./OrderQueue.css";

export default function HubTransfer() {
  const hubId = useAppSelector(selectCurrentUser)?.hubId;
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: queryError,
    refetch: refreshOrders,
  } = useOrders(undefined, { skip: !hubId });

  const loading = Boolean(hubId) && ordersLoading;
  const error = hubId ? (queryError?.message || "") : "No hub is assigned to this account.";
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const transferOrders = orders.filter(order => canTransfer(order, hubId));

  return (
    <>
      <div className="order-queue">
        <h1>Hub Transfer</h1>
        <p>Check parcels out of your warehouse before transferring them to their destination hub.</p>

        {loading ? (
          <p>Loading orders...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : transferOrders.length === 0 ? (
          <p>No unassigned pending orders are available to transfer.</p>
        ) : (
          transferOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onTransfer={() => {
                setSelectedOrder(order);
                setShowTransferModal(true);
              }}
              onView={() => {
                setSelectedOrder(order);
                setShowDetailsModal(true);
              }}
            />
          ))
        )}
      </div>

      <TransferHubModal
        order={selectedOrder}
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={refreshOrders}
      />

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onSuccess={refreshOrders}
      />
    </>
  );
}
