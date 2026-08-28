import { calculatePriority } from './data/mockData.js';

const priorityPill = {
  HIGH: 'hm-pill-high',
  MEDIUM: 'hm-pill-medium',
  LOW: 'hm-pill-low',
};

/**
 * One selectable order card.
 * Child-to-parent callback: clicking the card invokes onSelect(order),
 * which the parent (Dispatch.jsx) uses to update selectedOrder.
 */
export default function OrderCard({ order, selected, onSelect }) {
  const priority = calculatePriority(order);

  return (
    <div
      className={`hm-order-card${selected ? ' selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(order)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(order);
      }}
    >
      <div className="hm-attn-header">
        <span className="hm-order-id">{order.order_id}</span>
        <span className="hm-pill hm-pill-pending">
          • {order.status.toUpperCase()}
        </span>
        <span className={`hm-pill ${priorityPill[priority]}`}>{priority}</span>
      </div>
      <div className="hm-order-customer">{order.customer_name}</div>
      <div className="hm-order-addr">{order.delivery_address}</div>
      <div className="hm-order-meta">
        {order.package_type} · {order.weight} kg · ₹{order.amount}
      </div>
    </div>
  );
}