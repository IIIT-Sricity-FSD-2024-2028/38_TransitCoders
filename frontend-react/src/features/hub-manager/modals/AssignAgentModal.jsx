
import { useEffect, useState } from "react";
import { API } from "../../../services/api";
import "./AssignAgentModal.css";

export default function AssignAgentModal({ order, isOpen, onClose, onSuccess }) {
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState("");
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [agentError, setAgentError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!isOpen || !order) return;
    let active = true;

    setAgents([]);
    setAgentId("");
    setAgentError("");
    setAssignmentError("");
    setLoadingAgents(true);

    async function loadAgents() {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.hubId) {
          throw new Error("The signed-in Hub Manager has no assigned hub.");
        }
        const result = await API.hubs.getAgentsForHub(user.hubId);

        if (!Array.isArray(result)) {
          throw new Error("Could not load agents for this hub.");
        }
        if (active) {
          setAgents(result.filter(a => a.availabilityStatus === "Available"));
        }
      } catch (error) {
        if (active) {
          setAgentError(error.message || "Could not load agents for this hub.");
        }
      } finally {
        if (active) setLoadingAgents(false);
      }
    }

    loadAgents();
    return () => {
      active = false;
    };
  }, [isOpen, order?.id]);

  async function handleAssign() {
    if (!agentId) {
      setAssignmentError("Please select an agent.");
      return;
    }

    setAssignmentError("");
    setAssigning(true);
    try {
      await API.orders.assign(order.id, agentId);
      await onSuccess();
      onClose();
    } catch (error) {
      setAssignmentError(error.message || "Could not assign agent.");
    } finally {
      setAssigning(false);
    }
  }

  if (!isOpen || !order) return null;

  return (
    <div className="assign-modal-overlay">
      <div className="assign-modal">
        <h2>Assign Agent</h2>
        <p>Order: {order.orderId}</p>

        {loadingAgents ? (
          <p>Loading available agents...</p>
        ) : agentError ? (
          <p role="alert">{agentError}</p>
        ) : agents.length === 0 ? (
          <p>No available agents in your hub.</p>
        ) : (
          <select
            value={agentId}
            onChange={e => setAgentId(e.target.value)}
            disabled={assigning}
          >
            <option value="">Select an agent</option>
            {agents.map(a => (
              <option key={a.id} value={a.userId}>
                {a.name || a.id}
              </option>
            ))}
          </select>
        )}

        {assignmentError && <p role="alert">{assignmentError}</p>}

        <button onClick={onClose}>Cancel</button>
        <button
          onClick={handleAssign}
          disabled={loadingAgents || Boolean(agentError) || agents.length === 0 || !agentId || assigning}
        >
          {assigning ? "Assigning..." : "Assign"}
        </button>
      </div>
    </div>
  );
}
