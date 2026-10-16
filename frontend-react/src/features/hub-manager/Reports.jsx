import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import HubManagerLayout from "./HubManagerLayout.jsx";
import StatsCard from "./StatsCard";
import { API } from "../../services/api.js";
import "./Reports.css";

const statuses = [
  "Pending",
  "Assigned",
  "PickedUp",
  "InTransit",
  "OutForDelivery",
  "Delivered",
  "Cancelled",
  "Returned",
  "Failed",
];

const activeStatuses = [
  "Assigned",
  "PickedUp",
  "InTransit",
  "OutForDelivery",
];

export default function Reports() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hubId = user.hubId;

  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReports() {
      try {
        if (!hubId) {
          throw new Error("No hub is assigned to this account.");
        }

        const [orderData, agentData] = await Promise.all([
          API.orders.getAll(),
          API.hubs.getAgentsForHub(hubId),
        ]);

        if (!Array.isArray(orderData) || !Array.isArray(agentData)) {
          throw new Error("Invalid data received from the backend.");
        }

        if (active) {
          setOrders(orderData);
          setAgents(agentData);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load reports.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, [hubId]);

  const hubOrders = orders.filter(
    order =>
      order.pickupHubId === hubId ||
      order.deliveryHubId === hubId
  );

  const pendingOrders = hubOrders.filter(
    order =>
      order.pickupHubId === hubId &&
      order.status === "Pending" &&
      !order.assignedAgentId
  );

  const activeOrders = hubOrders.filter(
    order => activeStatuses.includes(order.status)
  );

  function countStatus(status) {
    return hubOrders.filter(order => order.status === status).length;
  }

  const stats = [
    {
      label: "Orders Involving Hub",
      value: hubOrders.length,
      sub: "Pickup or delivery hub",
      icon: "bi-box-seam",
    },
    {
      label: "Awaiting Assignment",
      value: pendingOrders.length,
      sub: "Pending and unassigned",
      icon: "bi-clock-history",
    },
    {
      label: "Orders in Progress",
      value: activeOrders.length,
      sub: "Currently active orders",
      icon: "bi-truck",
    },
    {
      label: "Delivered",
      value: countStatus("Delivered"),
      sub: "Current order status",
      icon: "bi-check-circle",
    },
  ];

  const statusData = statuses.map(status => ({
    status:
      status === "PickedUp" ? "Picked Up" :
        status === "InTransit" ? "In Transit" :
          status === "OutForDelivery" ? "Out for Delivery" :
            status,
    orders: countStatus(status),
  }));

  const backlogData = [
    { age: "Under 24 hours", orders: 0 },
    { age: "24–48 hours", orders: 0 },
    { age: "Over 48 hours", orders: 0 },
  ];

  const now = Date.now();

  pendingOrders.forEach(order => {
    const created = new Date(order.createdAt).getTime();

    if (!Number.isFinite(created)) {
      return;
    }

    const hours = (now - created) / (1000 * 60 * 60);

    if (hours < 24) {
      backlogData[0].orders++;
    } else if (hours < 48) {
      backlogData[1].orders++;
    } else {
      backlogData[2].orders++;
    }
  });

  const agentData = agents.map((agent, index) => ({
    name:
      agent.name ||
      agent.user?.name ||
      agent.email ||
      `Agent ${index + 1}`,
    tasks: Number(agent.currentTasksCount) || 0,
  }));

  const availableAgents = agents.filter(
    agent => agent.availabilityStatus === "Available"
  ).length;

  const busyAgents = agents.filter(
    agent => agent.availabilityStatus === "Busy"
  ).length;

  const offlineAgents = agents.filter(
    agent => agent.availabilityStatus === "Offline"
  ).length;

  const attentionOrders = hubOrders.filter(order => {
    if (["Failed", "Returned"].includes(order.status)) {
      return true;
    }

    return pendingOrders.some(pending => {
      if (pending.id !== order.id) {
        return false;
      }

      const created = new Date(order.createdAt).getTime();

      return (
        Number.isFinite(created) &&
        now - created > 24 * 60 * 60 * 1000
      );
    });
  });

  if (loading) {
    return (
      <HubManagerLayout title="Hub Reports">
        <p>Loading reports...</p>
      </HubManagerLayout>
    );
  }

  if (error) {
    return (
      <HubManagerLayout title="Hub Reports">
        <p role="alert">{error}</p>
      </HubManagerLayout>
    );
  }

  return (
    <HubManagerLayout title="Hub Reports">
      <div className="hub-reports">
        <p>Operational insights for your hub.</p>

        <div className="hub-report-stats">
          {stats.map(stat => (
            <StatsCard key={stat.label} stats={stat} />
          ))}
        </div>

        <div className="hub-report-grid">
          <section className="hub-report-section">
            <h2>Orders by status</h2>

            <div className="hub-report-chart status-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  layout="vertical"
                  margin={{ left: 10, right: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="status"
                    width={115}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="orders" name="Orders" fill="#ff6b1a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="hub-report-section">
            <h2>Pending order aging</h2>

            <p>How long unassigned Pending orders have been waiting.</p>

            <div className="hub-report-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={backlogData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="orders" name="Pending orders" fill="#eab308" label={{ position: "top" }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="hub-report-section">
            <h2>Agent workload</h2>

            <p>
              Available: {availableAgents} · Busy: {busyAgents} · Offline: {offlineAgents}
            </p>

            {agentData.length === 0 ? (
              <p>No agents found for this hub.</p>
            ) : (
              <div className="hub-report-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={agentData}
                    margin={{ bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="tasks" name="Current tasks" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="hub-report-section">
            <h2>Needs attention ({attentionOrders.length})</h2>

            {attentionOrders.length === 0 ? (
              <p>No overdue Pending, Failed, or Returned orders.</p>
            ) : (
              <ul>
                {attentionOrders.map(order => (
                  <li key={order.id}>
                    <strong>{order.orderId}</strong> — {order.status}
                    {order.status === "Pending"
                      ? " — Waiting over 24 hours"
                      : order.status === "Failed"
                        ? " — Failed delivery"
                        : " — Returned order"}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </HubManagerLayout>
  );
}