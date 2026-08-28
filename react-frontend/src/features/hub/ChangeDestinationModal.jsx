import { useState } from 'react';

/**
 * Change Destination Hub modal — React port of #changeDestModal in
 * front-end/hub-manager/dispatch.html + openChangeDestinationModal() /
 * confirmChangeDestinationAction() in js/hub-manager.js.
 * Inline styles mirror the original markup on purpose.
 */
export default function ChangeDestinationModal({
  order,
  hubs,
  onClose,
  onConfirm,
}) {
  const [hubId, setHubId] = useState('');
  const [reason, setReason] = useState('');

  if (!order) return null;

  const otherHubs = hubs.filter(
    (h) => h.hub_id !== order.pickup_hub_id && h.status === 'Active'
  );

  function handleConfirm() {
    if (!hubId || !reason) {
      onConfirm(null, null);
      return;
    }
    onConfirm(hubId, reason);
  }

  return (
    <div
      className="hm-modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="hm-modal"
        style={{ borderRadius: 'var(--radius-l)', overflow: 'hidden', maxWidth: '480px' }}
      >
        <div
          className="hm-modal-title"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: '20px', height: '20px' }}
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Change Destination Hub
        </div>

        <div className="hm-modal-body" style={{ padding: '24px 32px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-subtitle)', marginBottom: '24px' }}>
            Reassign this order to a different hub for route optimization or capacity
            management.
          </p>

          <div className="hm-form-group" style={{ marginBottom: '20px' }}>
            <label
              className="hm-label"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-title)',
                marginBottom: '8px',
              }}
            >
              Target Pickup Hub <span style={{ color: 'var(--brand-action)' }}>*</span>
            </label>
            <select
              className="hm-form-select"
              value={hubId}
              onChange={(e) => setHubId(e.target.value)}
            >
              <option value="">Select new destination hub</option>
              {otherHubs.map((h) => (
                <option key={h.hub_id} value={h.hub_id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hm-form-group">
            <label
              className="hm-label"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-title)',
                marginBottom: '8px',
              }}
            >
              Reason for Change <span style={{ color: 'var(--brand-action)' }}>*</span>
            </label>
            <select
              className="hm-form-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">Select a reason</option>
              <option value="route">Route Optimization</option>
              <option value="capacity">Hub at Capacity</option>
              <option value="refusal">Customer Request</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div
          className="hm-modal-footer"
          style={{
            padding: '24px 32px',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button type="button" className="hm-btn hm-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="hm-btn hm-btn-primary" onClick={handleConfirm}>
            Update Destination
          </button>
        </div>
      </div>
    </div>
  );
}