import { useState } from "react";
import { Link } from "react-router-dom";
import StatsCard from "./StatsCard";
import AssignAgentModal from "./modals/AssignAgentModal";
import TransferHubModal from "./modals/TransferHubModal";
import OrderDetailsModal from "./modals/OrderDetailsModal";
import { useAppSelector } from "../../app/hooks";
import { selectCurrentUser } from "../../shared/auth/authSlice";
import { useOrders } from "../../shared/orders/ordersHooks";
import { useHubAgents } from "./hubManagerHooks";
import { canAssign, canTransfer } from "./warehouseWorkflow";

import "./DashBoard.css";
import OrderCard from "./OrderCard";

export default function DashBoard() {
  const hubId = useAppSelector(selectCurrentUser)?.hubId;
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refreshOrders,
  } = useOrders(undefined, { skip: !hubId });
  const {
    data: hubAgents = [],
    error: agentsQueryError,
  } = useHubAgents(hubId, { skip: !hubId });

  const loading = Boolean(hubId) && ordersLoading;
  const error = hubId ? (ordersError?.message || "") : "No hub is assigned to this account.";
  const agentError = agentsQueryError?.message || "";
  const availableAgents = hubAgents.filter(agent => agent.availabilityStatus === "Available").length;

  const [activeFilter, setActiveFilter] = useState("All");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferOrder, setSelectedTransferOrder] = useState(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);

  const deliveredOrders = orders.filter((order) => {
    return order.status === "Delivered";
  }).length;

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
    <>
      <div className="dashboard-content">
        <h1>Operations Dashboard</h1>
        <p>Overview of hub operations and orders</p>
        {agentError && <p role="alert">{agentError}</p>}

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
                      canAssign(order, hubId)
                        ? () => {
                            setSelectedOrder(order);
                            setShowAssignModal(true);
                          }
                        : undefined
                    }
                    onTransfer={
                      canTransfer(order, hubId)
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
    </>
  );
}
