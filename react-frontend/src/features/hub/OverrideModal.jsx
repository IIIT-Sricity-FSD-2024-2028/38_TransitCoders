import DriverList from './DriverList.jsx';

/**
 * Override Assignment modal — React port of #overrideModal in
 * front-end/hub-manager/dispatch.html + openOverrideModal() /
 * selectOverrideAgent() / confirmOverride() in js/dispatch.js.
 *
 * The original modal body is:
 *   intro paragraph
 *   .modal-info-card (ORDER ID / DELIVERY LOCATION)
 *   .modal-section-label "Available Delivery Agents"
 *   agent cards (.modal-agent-card)  → rendered by DriverList/DriverCard
 *   footer: Cancel + Confirm Override
 *
 * Driver selection inside this modal is the child→parent callback
 * (onSelectDriver) that updates the lifted selectedDriver state.
 */
export default function OverrideModal({
  order,
  drivers,
  selectedDriver,
  onSelectDriver,
  onClose,
  onConfirm,
}) {
  if (!order) return null;

  return (
    <div
      className="hm-modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="hm-modal">
        <button type="button" className="hm-modal-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="hm-modal-title">Override Assignment</div>

        <div className="hm-modal-body">
          <p
            style={{
              margin: 0,
              marginBottom: '16px',
              color: 'var(--text-subtitle)',
              fontSize: '13px',
            }}
          >
            Hub manager can manually override auto assignment when needed.
          </p>

          <div className="modal-info-card">
            <div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-subtitle)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px',
                }}
              >
                Order ID
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-title)' }}>
                {order.order_id}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-subtitle)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px',
                }}
              >
                Delivery Location
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-title)' }}>
                {order.delivery_address}
              </div>
            </div>
          </div>

          <span className="modal-section-label">Available Delivery Agents</span>

          <DriverList
            drivers={drivers}
            selectedDriver={selectedDriver}
            onSelectDriver={onSelectDriver}
          />
        </div>

        <div className="hm-modal-footer">
          <button type="button" className="hm-btn hm-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="hm-btn hm-btn-primary" onClick={onConfirm}>
            Confirm Override
          </button>
        </div>
      </div>
    </div>
  );
}