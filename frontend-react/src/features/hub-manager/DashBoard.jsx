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

  const [availableAgents, setAvailableAgents] = useState(0);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferOrder, setSelectedTransferOrder] = useState(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);

  const recentOrders = orders.slice(0, 4);

  const deliveredOrders = orders.filter((order) => {
    return order.status === "Delivered";
  }).length;

  async function loadAvailableAgents() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user.hubId) {
        setAvailableAgents(0);
        return;
      }

      const agents = await API.hubs.getAgentsForHub(user.hubId);

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

            <div className="recent-orders">
              <div className="recent-orders-heading">
                <h2>Recent Orders</h2>
                <Link to="/hub/queue">View All Orders</Link>
              </div>

              {recentOrders.length === 0 ? (
                <p>No orders available.</p>
              ) : (
                recentOrders.map((order) => {
                  return (
                    <div className="recent-order-card" key={order.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <h3>{order.orderId}</h3>
                          <p><strong>Tracking ID:</strong> {order.trackingId || "N/A"}</p>
                          <p><strong>Status:</strong> {order.status}</p>
                          <p><strong>Customer:</strong> {order.customerName || "N/A"}</p>
                          <p><strong>Destination:</strong> {order.deliveryAddress || "N/A"}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedViewOrder(order);
                            setShowDetailsModal(true);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* {filteredOrders.length === 0 ? (
              <p className="empty-orders-text">
                No orders found for this status.
              </p>
            ) : (
              filteredOrders.map((order) => {
                return (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAssign={() => {
                      setSelectedOrder(order);
                      setShowAssignModal(true);
                    }}
                    onTransfer={
                      order.pickupHubId === currentUser.hubId &&
                      ![
                        "Delivered",
                        "Cancelled",
                        "Returned",
                        "Failed",
                      ].includes(order.status)
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
                );
              })
            )} */}
          </>
        ) : (
          <></>
        )}
      </div>

      {/* <AssignAgentModal
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
      /> */}

      <OrderDetailsModal
        order={selectedViewOrder}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onSuccess={refreshOrders}
      />
    </HubManagerLayout>
  );
}
