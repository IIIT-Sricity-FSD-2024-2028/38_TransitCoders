
import "./OrderDetailsModal.css";

export default function OrderDetailsModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  return (
    <div className="details-overlay">
      <div className="details-modal">
        <h2>Order Details</h2>

        <p><strong>Order ID:</strong> {order.orderId}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Customer:</strong> {order.customerName || "N/A"}</p>
        <p><strong>Destination:</strong> {order.deliveryAddress || "N/A"}</p>
        <p><strong>Pickup Hub:</strong> {order.pickupHubId || "N/A"}</p>
        <p><strong>Delivery Hub:</strong> {order.deliveryHubId || "N/A"}</p>

        {order.trackingId && (
          <p><strong>Tracking ID:</strong> {order.trackingId}</p>
        )}

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
