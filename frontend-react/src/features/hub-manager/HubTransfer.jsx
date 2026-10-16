import { useEffect, useState } from "react";
import HubManagerLayout from "./HubManagerLayout.jsx";
import { API } from "../../services/api.js";
import OrderCard from "./OrderCard";
import OrderDetailsModal from "./modals/OrderDetailsModal";
import TransferHubModal from "./modals/TransferHubModal";
import "./OrderQueue.css";

const terminalStatuses = ["Delivered", "Cancelled", "Returned", "Failed"];

export default function HubTransfer() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hubId = user.hubId || user.hub_id || "";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      if (!hubId) {
        throw new Error("The signed-in Hub Manager has no assigned hub.");
      }

      const result = await API.orders.getAll();
      if (!Array.isArray(result)) {
        throw new Error("Could not load orders. Check the backend and login.");
      }
      setOrders(result);
    } catch (err) {
      setOrders([]);
      setError(err.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const transferOrders = orders.filter(
    (order) =>
      order.pickupHubId === hubId &&
      order.status === "Pending" &&
      !order.assignedAgentId,
  );

  return (
    <HubManagerLayout title="Hub Transfer">
      <div className="order-queue">
        <h1>Hub Transfer</h1>
        <p>Transfer unassigned pending orders from your hub to another hub.</p>

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
        onSuccess={loadOrders}
      />

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onSuccess={loadOrders}
      />
    </HubManagerLayout>
  );
}