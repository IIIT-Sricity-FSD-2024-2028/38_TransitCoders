import { useEffect, useState } from 'react';
import { API } from '../../../services/api';
import './TransferHubModal.css';

export default function TransferHubModal({ order, isOpen, ...props }) {
  return isOpen && order ? <Transfer key={order.id} order={order} {...props} /> : null;
}

function Transfer({ order, onClose, onSuccess }) {
  const [hubs, setHubs] = useState(null);
  const [hubId, setHubId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pickupHub = order.pickupHubId;
  const reservedDestination = order.warehouse ? order.deliveryHubId : undefined;

  useEffect(() => {
    let active = true;
    API.hubs.getAll().then(data => {
      if (active) setHubs(data.filter(hub => hub.hubId !== pickupHub && hub.status === 'active' &&
        (!reservedDestination || hub.hubId === reservedDestination)));
    }, err => {
      if (active) setError(err.message);
    });
    return () => { active = false; };
  }, [pickupHub, reservedDestination]);

  async function submit(event) {
    event.preventDefault();
    if (busy || !hubId) return;
    setBusy(true);
    setError('');
    try {
      await API.orders.transfer(order.id, hubId, reason.trim() || undefined);
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="transfer-title" className="transfer-modal-overlay">
      <form onSubmit={submit} className="transfer-modal">
        <h2 id="transfer-title">Transfer Order</h2>
        <p>Order {order.orderId} · Current hub {pickupHub || 'unassigned'}</p>
        <label htmlFor="destination-hub">Destination Hub</label>
        <select id="destination-hub" value={hubId} onChange={event => setHubId(event.target.value)} disabled={busy || !hubs?.length} required>
          <option value="">Select a hub</option>
          {hubs?.map(hub => <option key={hub.hubId} value={hub.hubId}>{hub.name} ({hub.hubId})</option>)}
        </select>
        <label htmlFor="transfer-reason">Transfer reason (optional)</label>
        <textarea id="transfer-reason" className="w-full rounded border border-gray-300 p-2" value={reason} onChange={event => setReason(event.target.value)} disabled={busy} />
        {!error && !hubs && <p role="status">Loading hubs…</p>}
        {hubs?.length === 0 && <p>No destination hubs are available.</p>}
        {error && <p className="transfer-error" role="alert">{error}</p>}
        <button type="button" disabled={busy} onClick={onClose}>Cancel</button>
        <button type="submit" disabled={busy || !hubId}>{busy ? 'Transferring…' : 'Transfer'}</button>
      </form>
    </div>
  );
}
