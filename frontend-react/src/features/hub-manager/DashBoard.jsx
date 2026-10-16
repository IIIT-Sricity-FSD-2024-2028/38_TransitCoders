import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// import Sidebar from '../../components/layout/Sidebar';
// import Topbar from '../../components/layout/Topbar';
import StatsCard from "./StatsCard";
import AssignAgentModal from "./modals/AssignAgentModal";
import TransferHubModal from "./modals/TransferHubModal";
import OrderDetailsModal from "./modals/OrderDetailsModal";
import HubManagerLayout from "./HubManagerLayout.jsx";

import "./DashBoard.css";
import OrderCard from "./OrderCard";

import { API } from "../../services/api";

export default function DashBoard() {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const hubId = currentUser.hubId || currentUser.hub_id || "";

  const [availableAgents, setAvailableAgents] = useState(0);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferOrder, setSelectedTransferOrder] = useState(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);

  const deliveredOrders = orders.filter((order) => {
    return order.status === "Delivered";
  }).length;

  async function loadAvailableAgents() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const currentHubId = user.hubId || user.hub_id || "";

      if (!currentHubId) {
        setAvailableAgents(0);
        return;
      }

      const agents = await API.hubs.getAgentsForHub(currentHubId);

      if (Array.isArray(agents)) {
        setAvailableAgents(
          agents.filter((agent) => agent.availabilityStatus === "Available")
            .length,
        );
      }
    } catch (err) {
      console.error("could not load available agents:", err);
    }
  }

  async function refreshOrders() {
    const result = await API.orders.getAll();

    if (Array.isArray(result)) {
      setOrders(result);
    }
  }

  useEffect(() => {
    async function loadOrders() {
      try {
        const result = await API.orders.getAll();

        if (result == null) {
          setError("Could not load orders. Check the backend and login.");
        } else if (!Array.isArray(result)) {
          setError("the API returned an unexpected order format");
        } else {
          setOrders(result);
        }
      } catch (err) {
        setError("an unexpected error occurred while loading orders.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
    loadAvailableAgents();
  }, []);

  const filteredOrders =
    activeFilter === "All"
      ? orders
      : orders.filter((order) => order.status === activeFilter);
  const activeOrders = orders.filter((order) =>
    ["Assigned", "PickedUp", "InTransit", "OutForDelivery"].includes(
      order.status,
    ),
  ).length;
  const pendingOrders = orders.filter(
    (order) => order.status === "Pending",
  ).length;

  return (
    <HubManagerLayout title="Hub Operations Dashboard">
      <div className="dashboard-content">
        <h1>Operations Dashboard</h1>
        <p>Overview of hub operations and orders</p>

        {loading === true ? (
          <p className="loading-orders-text">Loading orders...</p>
        ) : null}

        {error ? (
          <p role="alert" style={{ color: "#dc2626", margin: "12px 0" }}>
            {error}
          </p>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="stats-container">
              <StatsCard
                stats={{
                  label: "Active Orders",
                  value: activeOrders,
                  sub: "In delivery process",
                  icon: "bi-box-seam",
                }}
              />
              <StatsCard
                stats={{
                  label: "Pending Orders",
                  value: pendingOrders,
                  sub: "Waiting for assignment",
                  icon: "bi-clock-history",
                }}
              />
              <StatsCard
                stats={{
                  label: "Available Agents",
                  value: availableAgents,
                  sub: "Ready for delivery",
                  icon: "bi-people",
                }}
              />
              <StatsCard
                stats={{
                  label: "Delivered Orders",
                  value: deliveredOrders,
                  sub: "Successfully delivered",
                  icon: "bi-check-circle",
                }}
              />
            </div>

            <div className="order-filters">
              {["All", "Pending", "Assigned", "InTransit", "OutForDelivery", "Delivered"].map((status) => (
                <button
                  key={status}
                  className={activeFilter === status ? "active" : ""}
                  onClick={() => setActiveFilter(status)}
                >
                  {{
                    All: "All",
                    Pending: "Pending",
                    Assigned: "Assigned",
                    InTransit: "In Transit",
                    OutForDelivery: "Out for Delivery",
                    Delivered: "Delivered",
                  }[status] || status}
                </button>
              ))}
            </div>

            <div className="recent-orders">
              <div className="recent-orders-heading">
                <h2>{activeFilter === "All" ? "All Orders" : `${activeFilter} Orders`} ({filteredOrders.length})</h2>
                <Link to="/hub/queue">View All in Queue</Link>
              </div>

              {filteredOrders.length === 0 ? (
                <p className="empty-orders-text">No orders found for this status.</p>
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
                            setSelectedOrder(order);
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
                      setSelectedViewOrder(order);
                      setShowDetailsModal(true);
                    }}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <></>
        )}
      </div>

      <AssignAgentModal
        order={selectedOrder}
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
        order={selectedViewOrder}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onSuccess={refreshOrders}
      />
    </HubManagerLayout>
  );
}
