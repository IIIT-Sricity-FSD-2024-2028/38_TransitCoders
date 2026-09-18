import { calculatePriority } from './data/mockData.js';
import routeMap from './assets/delivery-route-map.png';

const statusBadgeClass = {
  Pending: 'hm-badge-pending',
  Assigned: 'hm-badge-assigned',
  'In Transit': 'hm-badge-in-transit',
  'Out for Delivery': 'hm-badge-out-for-delivery',
  Delivered: 'hm-badge-delivered',
};

/**
 * Order Details modal — React port of #viewDetailModal + viewOrderDetail()
 * in front-end/hub-manager/js/dispatch.js:
 *   .modal-header-strip  (Order #ID + status badge + package/priority)
 *   .modal-map-banner    (delivery-route-map.png)
 *   .modal-2col          (Customer/Phone/Address + Value/Weight/Distance)
 *   footer: Change Destination Hub · Track Live Map · Override Agent · Close
 */
export default function OrderDetailModal({
  order,
  onClose,
  onChangeDestination,
  onTrackMap,
  onOverrideAgent,
}) {
  if (!order) return null;

  const priority = calculatePriority(order);
  const num = parseInt((order.order_id || '').replace(/\D/g, ''), 10) || 0;
  const distanceKm = (2.4 + (num % 28) / 5).toFixed(1);

  return (
    <div
      className="hm-modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="hm-modal hm-modal-wide" style={{ padding: 0 }}>
        <button type="button" className="hm-modal-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header strip */}
        <div className="modal-header-strip">
          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-title)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              Order #{order.order_id.replace('ORD_', '')}{' '}
              <span className={`hm-badge ${statusBadgeClass[order.status] || 'hm-badge-pending'}`}>
                {order.status}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-subtitle)' }}>
              {order.package_type} · {priority}
            </div>
          </div>
        </div>

        {/* Map banner */}
        <div className="modal-map-banner">
          <img src={routeMap} alt="Route Map" />
        </div>

        {/* Two-column info */}
        <div className="modal-2col">
          <div>
            <div className="modal-info-block">
              <div className="hm-info-row">
                <span className="hm-info-label">Customer</span>
                <span className="hm-info-value">{order.customer_name}</span>
              </div>
              <div className="hm-info-row">
                <span className="hm-info-label">Phone</span>
                <span className="hm-info-value">{order.customer_phone}</span>
              </div>
              <div className="hm-info-row">
                <span className="hm-info-label">Address</span>
                <span
                  className="hm-info-value"
                  style={{ maxWidth: '170px', textAlign: 'right' }}
                >
                  {order.delivery_address}
                </span>
              </div>
            </div>
          </div>
          <div>
            <div className="modal-info-block">
              <div className="hm-info-row">
                <span className="hm-info-label">Order Value</span>
                <span className="hm-info-value">₹{order.amount}</span>
              </div>
              <div className="hm-info-row">
                <span className="hm-info-label">Weight</span>
                <span className="hm-info-value">{order.weight} kg</span>
              </div>
              <div className="hm-info-row">
                <span className="hm-info-label">Distance</span>
                <span className="hm-info-value">{distanceKm} km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions — same four buttons as the original */}
        <div className="hm-modal-footer" style={{ padding: '24px 32px' }}>
          <button type="button" className="hm-btn hm-btn-ghost" onClick={onChangeDestination}>
            Change Destination Hub
          </button>
          <button type="button" className="hm-btn hm-btn-ghost" onClick={onTrackMap}>
            Track Live Map
          </button>
          <button type="button" className="hm-btn hm-btn-ghost" onClick={onOverrideAgent}>
            Override Agent
          </button>
          <button type="button" className="hm-btn hm-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}