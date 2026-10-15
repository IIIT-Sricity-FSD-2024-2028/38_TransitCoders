
import { useEffect, useState } from "react";
import { API } from "../../../services/api";
import "./AssignAgentModal.css";

export default function AssignAgentModal({ order, isOpen, onClose, onSuccess }) {
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    async function loadAgents() {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const result = await API.hubs.getAgentsForHub(user.hubId);

      if (Array.isArray(result)) {
        setAgents(result.filter(a => a.availabilityStatus === "Available"));
      }
    }

    loadAgents();
  }, [isOpen]);

  async function handleAssign() {
    if (!agentId) {
      alert("Please select an agent");
      return;
    }

    try {
      await API.orders.assign(order.id, agentId);
      await onSuccess();
      onClose();
    } catch (error) {
  console.error("Assignment failed:", error);
  alert("Could not assign agent. Check the browser console.");
}
  }

  if (!isOpen || !order) return null;

  return (
    <div className="assign-modal-overlay">
      <div className="assign-modal">
        <h2>Assign Agent</h2>
        <p>Order: {order.orderId}</p>

        {agents.length === 0 ? (
          <p>No available agents in your hub.</p>
        ) : (
          <select value={agentId} onChange={e => setAgentId(e.target.value)}>
            <option value="">Select an agent</option>
            {agents.map(a => (
              <option key={a.id} value={a.userId}>
                {a.name || a.id}
              </option>
            ))}
          </select>
        )}

        <button onClick={onClose}>Cancel</button>
        <button onClick={handleAssign} disabled={agents.length === 0}>
          Assign
        </button>
      </div>
    </div>
  );
}
