import { useState, useEffect } from "react";
import HubManagerLayout from "./HubManagerLayout.jsx";
import { API } from "../../services/api.js";
import OrderCard from "./OrderCard";
import AssignAgentModal from "./modals/AssignAgentModal";
import TransferHubModal from "./modals/TransferHubModal";
import OrderDetailsModal from "./modals/OrderDetailsModal";
import "./OrderQueue.css";

export default function OrderQueue() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignOrder, setSelectedAssignOrder] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferOrder, setSelectedTransferOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hubId = user.hubId || user.hub_id || "";

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
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

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = status === "All" || order.status === status;
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (order.orderId && order.orderId.toLowerCase().includes(term)) ||
      (order.trackingId && order.trackingId.toLowerCase().includes(term)) ||
      (order.customerName && order.customerName.toLowerCase().includes(term)) ||
      (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  return (
    <HubManagerLayout title="Order Queue">
      <div className="order-queue">
        <h1>Order Queue</h1>
        <p>View, search, and filter all orders.</p>

        <div className="queue-search-container">
          <input
            type="text"
            className="queue-search-input"
            placeholder="Search by Order ID, Tracking ID, customer, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              onAssign={
                hubId &&
                order.pickupHubId === hubId &&
                order.status === "Pending" &&
                !order.assignedAgentId
                  ? () => {
                      setSelectedAssignOrder(order);
                      setShowAssignModal(true);
                    }
                  : undefined
              }
              onTransfer={
                hubId &&
                order.pickupHubId === hubId &&
                order.status === "Pending" &&
                !order.assignedAgentId
                  ? () => {
                      setSelectedTransferOrder(order);
                      setShowTransferModal(true);
                    }
                  : undefined
              }
              onView={() => {
                setSelectedOrder(order);
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
        onSuccess={loadOrders}
      />

      <TransferHubModal
        order={selectedTransferOrder}
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
