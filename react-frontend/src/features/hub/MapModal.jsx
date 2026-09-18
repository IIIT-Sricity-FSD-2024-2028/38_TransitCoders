import routeMap from './assets/delivery-route-map.png';

/**
 * Delivery Route Map modal — React port of #map-modal in
 * front-end/hub-manager/dispatch.html + openDeliveryMap() in
 * js/hub-manager.js. Inline styles mirror the original markup.
 */
export default function MapModal({ order, driver, getHubName, onClose }) {
  if (!order) return null;

  const num = parseInt((order.order_id || '').replace(/\D/g, ''), 10) || 0;
  const distanceKm = (2.4 + (num % 28) / 5).toFixed(1);
  const etaMins = 12 + (num % 35);
  const agentInitials = driver
    ? driver.name.substring(0, 2).toUpperCase()
    : '??';

  return (
    <div
      className="hm-modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="hm-modal hm-modal-wide"
        style={{ borderRadius: 'var(--radius-l)', overflow: 'hidden', padding: 0 }}
      >
        <div
          className="modal-map-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '24px 32px 16px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-title)' }}>
              Delivery Route Map
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-subtitle)' }}>
              Route between hub and delivery destination
            </p>
          </div>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-caption)',
              cursor: 'pointer',
              padding: '4px',
            }}
            onClick={onClose}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div
          className="modal-map-body"
          style={{ background: 'var(--surface-subtle)', padding: '0 32px' }}
        >
          <img src={routeMap} alt="Delivery Route" id="modal-map-img" />
        </div>

        <div
          className="modal-map-footer"
          style={{
            padding: '24px 32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px',
            alignItems: 'start',
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-subtitle)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Pickup Hub
            </div>
            <div
              className="modal-info-val-pickup"
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-title)' }}
            >
              {getHubName(order.pickup_hub_id)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-subtitle)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Destination
            </div>
            <div
              className="modal-info-val-dest"
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-title)' }}
            >
              {order.delivery_address}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-subtitle)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Distance
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-title)' }}>
              {distanceKm} km
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-subtitle)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Est. Time
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-title)' }}>
              {etaMins} mins
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="modal-agent-badge"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--info-surface)',
                color: 'var(--info-fill)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              {agentInitials}
            </div>
            <div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-subtitle)',
                  textTransform: 'uppercase',
                  marginBottom: 0,
                }}
              >
                Agent
              </div>
              <div
                className="modal-info-val-agent"
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-title)' }}
              >
                {driver ? driver.name : 'Unassigned'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}