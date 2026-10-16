
import "./OrderCard.css";

export default function OrderCard({ order, onAssign, onTransfer, onView }) {
    const statusText = order?.status || "Pending";
    return (
        <div className="order-card">
            <div className="order-header">
                <div>
                    <span className="order-id">{order.orderId}</span>
                    <span className={`order-status ${statusText.toLowerCase()}`}>
                        {statusText}
                    </span>
                </div>

                <div className="order-actions">
                    {order.status === "Pending" && onAssign && (
                        <button onClick={onAssign}>Assign Agent</button>
                    )}

                    {onTransfer && (
                        <button onClick={onTransfer}>Transfer Hub</button>
                    )}
                    
                    <button onClick={onView}>View</button>
                </div>
            </div>

            <div className="order-details">
                <p><strong>Customer:</strong> {order.customerName || "N/A"}</p>
                <p><strong>Destination:</strong> {order.deliveryAddress || "N/A"}</p>
            </div>
        </div>
    );
}
