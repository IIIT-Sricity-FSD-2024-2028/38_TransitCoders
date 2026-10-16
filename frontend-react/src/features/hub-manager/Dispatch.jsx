import { useState, useEffect } from "react";
import HubManagerLayout from "./HubManagerLayout.jsx";
import { API } from "../../services/api.js";
import AssignAgentModal from "./modals/AssignAgentModal";
import OrderDetailsModal from "./modals/OrderDetailsModal";
import "./Dispatch.css";

export default function Dispatch() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hubId, setHubId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const currentHubId = user.hubId || user.hub_id || "";
      if (!currentHubId) {
        setOrders([]);
        setError("The signed-in Hub Manager has no assigned hub.");
        return;
      }
      setHubId(currentHubId);

      const result = await API.orders.getAll();
      if (!Array.isArray(result)) {
        throw new Error("Could not load orders. Check the backend and login.");
      }
      setOrders(result);
    } catch (error) {
      setOrders([]);
      setError(error.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const effectiveHubId = hubId || (JSON.parse(localStorage.getItem("user") || "{}").hubId || JSON.parse(localStorage.getItem("user") || "{}").hub_id || "");

  const pendingOrders = orders.filter((order) => {
    return (
      order.status === "Pending" &&
      order.pickupHubId === effectiveHubId &&
      !order.assignedAgentId
    );
  });

  async function refreshOrders() {
    await loadOrders();
  }

  return (
    <HubManagerLayout title="Dispatch & Assignment">
      <div className="dispatch-page">
        <h1>Dispatch and Assignment</h1>
        <p>Assign delivery agents to pending unassigned orders at your hub.</p>

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
    </HubManagerLayout>
  );
}
