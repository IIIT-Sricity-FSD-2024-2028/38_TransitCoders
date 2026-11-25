import { useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { selectCurrentUser } from '../../../shared/auth/authSlice';
import { useAuthorizeReturn, useUpdateOrder } from '../hubManagerHooks';
import { statusLabel } from '../../../services/orderStatus';
import OrderMessages from '../../../components/OrderMessages';
import WarehouseNextStep from '../WarehouseNextStep';
import './OrderDetailsModal.css';

export default function OrderDetailsModal({ order, isOpen, ...props }) {
  return isOpen && order ? <OrderDetails key={order.id} initialOrder={order} {...props} /> : null;
}

function OrderDetails({ initialOrder, onClose, onSuccess, onAssign, onTransfer }) {
  const [savedOrder, setSavedOrder] = useState(null);
  const order = savedOrder && (savedOrder.updatedAt || '') >= (initialOrder.updatedAt || '')
    ? savedOrder
    : initialOrder;
  const [mode, setMode] = useState('view');
  const [deliveryAddress, setDeliveryAddress] = useState(order.deliveryAddress || '');
  const [priority, setPriority] = useState(order.priority || 'Medium');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const hubId = useAppSelector(selectCurrentUser)?.hubId;
  const [triggerAuthorizeReturn, { isLoading: returning }] = useAuthorizeReturn();
  const [triggerUpdateOrder, { isLoading: updating }] = useUpdateOrder();
  const saving = returning || updating;
  const canMessageAgent = order.assignedAgentId && order.pickupHubId === hubId;

  function view() {
    setMode('view');
    setDeliveryAddress(order.deliveryAddress || '');
    setPriority(order.priority || 'Medium');
    setReason('');
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setError('');
    if ((mode === 'edit' && !deliveryAddress.trim()) || (mode === 'return' && !reason.trim())) {
      setError(mode === 'edit' ? 'Enter a delivery address.' : 'Enter a reason for the return.');
      return;
    }
    try {
      const updated = mode === 'return'
        ? await triggerAuthorizeReturn({ id: order.id, reason: reason.trim() }).unwrap()
        : await triggerUpdateOrder({ id: order.id, deliveryAddress: deliveryAddress.trim(), priority }).unwrap();
      setSavedOrder(updated);
      setMode('view');
      if (onSuccess) await onSuccess();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="details-overlay">
      <div className="details-modal">
        <h2 id="order-detail-title">Order Details</h2>
        <p><strong>Order ID:</strong> {order.orderId}</p>
        <p><strong>Tracking ID:</strong> {order.trackingId || '—'}</p>
        <p><strong>Status:</strong> {statusLabel(order.status)}</p>
        <p><strong>Customer:</strong> {order.customerName}</p>
        <p><strong>Pickup Hub:</strong> {order.pickupHubId || '—'}</p>
        <p><strong>Delivery Hub:</strong> {order.deliveryHubId || '—'}</p>
        {mode === 'view' ? (
          <>
            <p><strong>Priority:</strong> {order.priority}</p>
            <p><strong>Destination:</strong> {order.deliveryAddress}</p>
            {order.paymentStatus && <p><strong>Payment status:</strong> {order.paymentStatus}</p>}
            {order.warehouse && <p><strong>Warehouse:</strong> {order.warehouse.checkedOutAt ? 'Checked out' : order.warehouse.checkedInAt ? 'Checked in' : 'Awaiting check-in'}</p>}
            {hubId && <WarehouseNextStep order={order} hubId={hubId} />}
            {canMessageAgent && <OrderMessages orderId={order.id} channel="hub" label="Message delivery agent" />}
            <div className="details-actions flex-wrap">
              {onAssign && <button type="button" className="btn-primary" onClick={onAssign}>Assign Agent</button>}
              {onTransfer && <button type="button" className="btn-primary" onClick={onTransfer}>Transfer Hub</button>}
              {['Pending', 'Assigned'].includes(order.status) && <button type="button" className="btn-primary" onClick={() => setMode('edit')}>Edit Order</button>}
              {order.status === 'Delivered' && <button type="button" className="btn-primary" onClick={() => setMode('return')}>Authorize Return</button>}
              <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            {mode === 'edit' ? (
              <>
                <div className="details-form-group"><label htmlFor="edit-delivery-address">Destination Address</label><input id="edit-delivery-address" value={deliveryAddress} onChange={event => setDeliveryAddress(event.target.value)} disabled={saving} required /></div>
                <div className="details-form-group"><label htmlFor="edit-priority">Priority</label><select id="edit-priority" value={priority} onChange={event => setPriority(event.target.value)} disabled={saving}>
                  {['Low', 'Medium', 'High'].map(value => <option key={value}>{value}</option>)}
                </select></div>
              </>
            ) : (
              <div className="details-form-group"><label htmlFor="return-reason">Return reason</label><textarea id="return-reason" value={reason} onChange={event => setReason(event.target.value)} disabled={saving} required className="w-full rounded border border-gray-300 p-2" /></div>
            )}
            {error && <p className="details-error" role="alert">{error}</p>}
            <div className="details-actions">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Confirm Return'}</button>
              <button type="button" className="btn-secondary" onClick={view} disabled={saving}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
