
import { useState, useEffect } from "react";
import { API } from "../../../services/api";
import "./OrderDetailsModal.css";

export default function OrderDetailsModal({ order, isOpen, onClose, onSuccess }) {
  const [isEditing, setIsEditing] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentOrder, setCurrentOrder] = useState(order);

  useEffect(() => {
    if (isOpen && order) {
      setCurrentOrder(order);
      setDeliveryAddress(order.deliveryAddress || "");
      setPriority(order.priority || "Medium");
      setIsEditing(false);
      setError("");
      setSaving(false);
    }
  }, [isOpen, order]);

  if (!isOpen || !currentOrder) return null;

  async function handleSave(e) {
    if (e) e.preventDefault();

    if (!deliveryAddress.trim()) {
      setError("Delivery address cannot be empty.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await API.orders.update(currentOrder.id, {
        deliveryAddress: deliveryAddress.trim(),
        priority: priority,
      });

      // Defensively unpack the order object if wrapped in { success, data }
      const updatedOrder =
        updated && updated.orderId
          ? updated
          : updated && updated.data && updated.data.orderId
          ? updated.data
          : {
              ...currentOrder,
              deliveryAddress: deliveryAddress.trim(),
              priority: priority,
            };

      setCurrentOrder(updatedOrder);
      setIsEditing(false);

      if (onSuccess) {
        await onSuccess();
      }
    } catch (err) {
      setError(err.message || "Failed to update order.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDeliveryAddress(currentOrder.deliveryAddress || "");
    setPriority(currentOrder.priority || "Medium");
    setError("");
    setIsEditing(false);
  }

  return (
    <div className="details-overlay">
      <div className="details-modal">
        <h2>Order Details</h2>

        <p><strong>Order ID:</strong> {currentOrder.orderId}</p>
        {currentOrder.trackingId && (
          <p><strong>Tracking ID:</strong> {currentOrder.trackingId}</p>
        )}
        <p><strong>Status:</strong> {currentOrder.status}</p>
        <p><strong>Customer:</strong> {currentOrder.customerName || "N/A"}</p>
        <p><strong>Pickup Hub:</strong> {currentOrder.pickupHubId || "N/A"}</p>
        <p><strong>Delivery Hub:</strong> {currentOrder.deliveryHubId || "N/A"}</p>

        {!isEditing ? (
          <>
            <p><strong>Priority:</strong> {currentOrder.priority || "Medium"}</p>
            <p><strong>Destination:</strong> {currentOrder.deliveryAddress || "N/A"}</p>

            {error && <p className="details-error" role="alert">{error}</p>}

            <div className="details-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Order
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave}>
            <div className="details-form-group">
              <label htmlFor="edit-delivery-address">Destination Address</label>
              <input
                id="edit-delivery-address"
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                disabled={saving}
                placeholder="Enter delivery address"
              />
            </div>

            <div className="details-form-group">
              <label htmlFor="edit-priority">Priority</label>
              <select
                id="edit-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={saving}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {error && <p className="details-error" role="alert">{error}</p>}

            <div className="details-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
