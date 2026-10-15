
import { useEffect, useState } from "react";
import { API } from "../../../services/api";
import "./TransferHubModal.css";

export default function TransferHubModal({ order, isOpen, onClose, onSuccess }) {
  const [hubs, setHubs] = useState([]);
  const [hubId, setHubId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    async function loadHubs() {
      try {
        const result = await API.hubs.getAll();

        if (Array.isArray(result)) {
          setHubs(
            result.filter(
                hub => hub.hubId != order ?.pickupHubId 
            )
          );
        }
      } catch {
        setError("Could not load hubs.");
      }
    }

    loadHubs();
  }, [isOpen, order]);

  async function handleTransfer() {
    if (!hubId) {
      setError("Please select a destination hub.");
      return;
    }

    try {
      setError("");
      await API.orders.transfer(
        order.id,
        hubId,
        "Hub transfer via dashboard"
      );

      await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Could not transfer order.");
    }
  }

  if (!isOpen || !order) return null;

  return (
    <div className="transfer-modal-overlay">
      <div className="transfer-modal">
        <h2>Transfer Order</h2>
        <p>Order: {order.orderId}</p>
        <p>Current Hub: {order.pickupHubId}</p>

        <label htmlFor="destination-hub">Destination Hub</label>

        <select
          id="destination-hub"
          value={hubId}
          onChange={e => setHubId(e.target.value)}
        >
          <option value="">Select a hub</option>
          {hubs.map(hub => (
            <option key={hub.hubId} value={hub.hubId}>
              {hub.hubName || hub.name || hub.hubId}
            </option>
          ))}
        </select>

        {error && <p className="transfer-error">{error}</p>}

        <button onClick={onClose}>Cancel</button>
        <button onClick={handleTransfer} disabled={hubs.length === 0}>
          Transfer
        </button>
      </div>
    </div>
  );
}
