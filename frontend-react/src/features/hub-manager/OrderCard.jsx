
import "./OrderCard.css";

export default function OrderCard({ order, onAssign, onTransfer, onView }) {
    return (
        <div className="order-card">
            <div className="order-header">
                <div>
                    <span className="order-id">{order.orderId}</span>
                    <span className={`order-status ${order.status.toLowerCase()}`}>
                        {order.status}
                    </span>
                </div>

                <div className="order-actions">
                    {order.status === "Pending" ? <button onClick={onAssign}>Assign Agent</button> : (<></>)
                    }

                    {onTransfer && (
                    <button onClick={onTransfer}>Transfer Hub</button>
                    )}
                    
                    <button onClick={onView}>View</button>
                </div>
            </div>

            <div className="order-details">
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>Destination:</strong> {order.deliveryAddress}</p>
            </div>
        </div>
    );
}
