import { IconMapPin, IconNavigation, IconPhone } from '../../components/icons.jsx';
import { calculatePriority, deriveOrderMeta, getHubName } from './data/mockData.js';

const priorityPill = {
  HIGH: 'hm-pill-high',
  MEDIUM: 'hm-pill-medium',
  LOW: 'hm-pill-low',
};

/**
 * Attention card — exact React port of renderAttentionCard() in
 * front-end/hub-manager/js/dispatch.js and the #attentionContainer markup:
 *
 *   .hm-attn-card
 *     .hm-attn-header   → order id + "• PENDING" pill + priority pill
 *     .hm-attn-details  → "Customer: X" + "Assigned Agent: Y · ETA"
 *     .hm-timeline      → Pick Up Hub / Delivery Location / Customer Phone
 *     .hm-attn-actions  → [Override Assignment] [View Details]
 *
 * Receives the lifted selectedOrder via props; the two buttons fire the
 * parent's handlers (open override modal / open details modal).
 */
export default function DispatchPanel({ order, drivers, onOverride, onViewDetails }) {
  // No pending order → render nothing at all. The single "No Pending
  // Orders" empty state is rendered by OrderList directly under the
  // section header (where the original page shows it). An Assigned
  // order must NEVER appear in this attention area — the parent only
  // passes an order whose status is still Pending.
  if (!order) {
    return null;
  }

  const priority = calculatePriority(order);
  const meta = deriveOrderMeta(order);
  const agentName = order.assigned_agent
    ? (drivers.find((d) => d.agent_id === order.assigned_agent) || {}).name ||
      order.assigned_agent
    : 'Unassigned';

  return (
    <div className="hm-attn-card">
      <div className="hm-attn-header">
        <span className="hm-attn-id">{order.order_id}</span>
        <span className="hm-pill hm-pill-pending">• {order.status.toUpperCase()}</span>
        <span className={`hm-pill ${priorityPill[priority]}`}>{priority}</span>
      </div>

      <div className="hm-attn-details">
        Customer: {order.customer_name}
        <br />
        <span>
          Assigned Agent: {agentName} · {meta.etaText}
        </span>
      </div>

      <div className="hm-timeline">
        <div className="hm-tl-row">
          <div className="hm-tl-icon">
            <IconMapPin />
          </div>
          <div>
            <div className="hm-tl-label">Pick Up Hub</div>
            <div className="hm-tl-value">{getHubName(order.pickup_hub_id)}</div>
          </div>
        </div>
        <div className="hm-tl-row">
          <div className="hm-tl-icon">
            <IconNavigation />
          </div>
          <div>
            <div className="hm-tl-label">Delivery Location</div>
            <div className="hm-tl-value">{order.delivery_address}</div>
          </div>
        </div>
        <div className="hm-tl-row">
          <div className="hm-tl-icon">
            <IconPhone />
          </div>
          <div>
            <div className="hm-tl-label">Customer Phone</div>
            <div className="hm-tl-value">{meta.phone}</div>
          </div>
        </div>
      </div>

      <div className="hm-attn-actions">
        <button
          type="button"
          className="hm-btn-rounded primary"
          onClick={() => onOverride(order)}
        >
          Override Assignment
        </button>
        <button
          type="button"
          className="hm-btn-rounded outline"
          onClick={() => onViewDetails(order)}
        >
          View Details
        </button>
      </div>
    </div>
  );
}