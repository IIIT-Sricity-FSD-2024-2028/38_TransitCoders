import { useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { selectCurrentUser } from "../../shared/auth/authSlice";
import { useOrders } from "../../shared/orders/ordersHooks";
import AssignAgentModal from "./modals/AssignAgentModal";
import OrderDetailsModal from "./modals/OrderDetailsModal";
import { canAssign } from "./warehouseWorkflow";
import "./Dispatch.css";

export default function Dispatch() {
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
  const [showModal, setShowModal] = useState(false);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const pendingOrders = orders.filter(order => canAssign(order, hubId));

  return (
      <div className="dispatch-page">
        <h1>Dispatch and Assignment</h1>
        <p>Check parcels in at their destination warehouse before assigning a delivery agent.</p>

        {loading ? (
          <p>Loading orders...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : pendingOrders.length === 0 ? (
          <p>No pending unassigned orders waiting for dispatch at this hub.</p>
        ) : (
          pendingOrders.map((order) => {
            return (
              <div className="dispatch-order" key={order.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3>{order.orderId}</h3>
                    <p><strong>Tracking ID:</strong> {order.trackingId || "N/A"}</p>
                    <p><strong>Customer:</strong> {order.customerName || "N/A"}</p>
                    <p><strong>Destination:</strong> {order.deliveryAddress || "N/A"}</p>
                    <p><strong>Priority:</strong> {order.priority || "Medium"}</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowModal(true);
                      }}
                    >
                      Assign Agent
                    </button>
                    <button
                      type="button"
                      style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}
                      onClick={() => {
                        setSelectedViewOrder(order);
                        setShowDetailsModal(true);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <AssignAgentModal
          order={selectedOrder}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={refreshOrders}
        />

        <OrderDetailsModal
          order={selectedViewOrder}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          onSuccess={refreshOrders}
        />
      </div>
  );
}
