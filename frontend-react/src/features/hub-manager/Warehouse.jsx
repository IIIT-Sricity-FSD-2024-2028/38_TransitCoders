import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API } from '../../services/api';
import { getSessionUser } from '../../services/session';
import HubManagerLayout from './HubManagerLayout';
import { statusLabel } from '../../services/orderStatus';

export default function Warehouse() {
  const { hubId } = getSessionUser();
  const [params] = useSearchParams();
  const [inventory, setInventory] = useState(null);
  const [reference, setReference] = useState(params.get('reference') || '');
  const [action, setAction] = useState(params.get('action') === 'check-out' ? 'check-out' : 'check-in');
  const [autoAssign, setAutoAssign] = useState(true);
  const [lastScan, setLastScan] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  const load = useCallback(async () => {
    if (!hubId) throw new Error('Your account needs a hub before you can scan parcels.');
    const [hub, orders] = await Promise.all([API.hubs.getById(hubId), API.orders.getAll()]);
    return { hub, orders };
  }, [hubId]);

  useEffect(() => {
    let active = true;
    load().then(data => {
      if (active) setInventory(data);
    }, err => {
      if (active) setError(err.message);
    });
    return () => { active = false; };
  }, [load]);

  async function submit(event) {
    event.preventDefault();
    if (busy || !reference.trim()) return;
    setBusy(true);
    setError('');
    setLastScan(null);
    try {
      const order = await API.orders.scanWarehouse(reference.trim(), action, action === 'check-in' && autoAssign);
      const timestamp = action === 'check-in' ? order.warehouse.checkedInAt : order.warehouse.checkedOutAt;
      const verb = action === 'check-in' ? 'Checked in' : 'Checked out';
      let nextStep = '';
      if (order.status === 'Pending' && order.deliveryHubId !== hubId) {
        nextStep = action === 'check-in' ? `Check out before transferring to ${order.deliveryHubId}.` : `Ready to transfer to ${order.deliveryHubId}.`;
      } else if (action === 'check-in' && order.status === 'Assigned') {
        nextStep = 'Delivery agent assigned. Check out when handing over the parcel.';
      } else if (action === 'check-in' && order.status === 'Pending') {
        nextStep = autoAssign
          ? 'No eligible agent was assigned. Open the order to choose an agent or retry auto-assign.'
          : 'Open the order to assign a delivery agent.';
      }
      setLastScan({ trackingId: order.trackingId, text: `${verb} ${order.trackingId} at ${new Date(timestamp).toLocaleString('en-IN')}. ${nextStep}` });
      setReference('');
      setInventory(await load());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      input.current?.focus();
    }
  }

  const orders = inventory?.orders.filter(order => {
    if (!order.warehouse) return false;
    if (order.warehouse.hubId !== hubId) return order.deliveryHubId === hubId && order.status === 'Pending';
    const isStored = order.warehouse.checkedInAt && !order.warehouse.checkedOutAt;
    return isStored || order.status === 'Pending' || order.status === 'Assigned';
  }) ?? [];

  return (
    <HubManagerLayout title="Warehouse">
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse</h1>
          {inventory && <p className="text-sm text-gray-600">{inventory.hub.name} · {hubId}</p>}
        </header>
        {inventory && <dl className="grid grid-cols-3 gap-3">
          {[
            ['Stored parcels', inventory.hub.currentLoad],
            ['Reserved arrivals', inventory.hub.reservedParcels],
            ['Open slots', inventory.hub.remainingCapacity],
          ].map(([label, count]) => <div key={label} className="rounded-xl border border-gray-200 bg-white p-3">
            <dt className="text-sm text-gray-600">{label}</dt>
            <dd className="text-xl font-semibold">{count}</dd>
          </div>)}
        </dl>}
        <form className="space-y-3 rounded-xl border border-gray-200 bg-white p-5" onSubmit={submit}>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-sm font-medium">
              Scan action
              <select value={action} onChange={event => setAction(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2">
                <option value="check-in">Check in</option>
                <option value="check-out">Check out</option>
              </select>
            </label>
            <label className="grid min-w-48 flex-1 gap-1 text-sm font-medium">
              Tracking barcode or order ID
              <input ref={input} value={reference} onChange={event => setReference(event.target.value)}
                autoComplete="off" maxLength={128} required className="rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <button type="submit" disabled={busy || !hubId || !reference.trim()}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? 'Recording…' : 'Record scan'}
            </button>
          </div>
          {action === 'check-in' && <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoAssign} disabled={busy} onChange={event => setAutoAssign(event.target.checked)} />
            Auto-assign at the destination hub
          </label>}
          {lastScan && <div className="text-sm text-emerald-700">
            <p role="status">{lastScan.text}</p>
            <Link to={`/hub/queue?${new URLSearchParams({ id: lastScan.trackingId })}`} className="font-semibold underline">Open order in queue</Link>
          </div>}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </form>
        <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Incoming and outgoing parcels</h2>
            <button type="button" disabled={busy} className="text-sm font-medium text-orange-700 disabled:opacity-50" onClick={() => {
              setError('');
              load().then(setInventory, err => setError(err.message));
            }}>Refresh inventory</button>
          </div>
          {orders.length > 0 ? <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600"><tr>
              <th scope="col" className="px-5 py-2">Tracking ID</th>
              <th scope="col" className="px-5 py-2">Warehouse status</th>
              <th scope="col" className="px-5 py-2">Shipment status</th>
            </tr></thead>
            <tbody>{orders.map(order => {
              const { warehouse } = order;
              const state = warehouse.hubId !== hubId ? 'Awaiting transfer' : warehouse.checkedOutAt
                ? 'Checked out' : warehouse.checkedInAt ? 'Checked in' : 'Awaiting check-in';
              return <tr key={order.id} className="border-t border-gray-100">
                <td className="px-5 py-3"><button type="button" className="font-medium text-orange-700" onClick={() => {
                  setReference(order.trackingId);
                  input.current?.focus();
                }}>{order.trackingId}</button></td>
                <td className="px-5 py-3">{state}</td>
                <td className="px-5 py-3">{statusLabel(order.status)}</td>
              </tr>;
            })}</tbody>
          </table> : <p className="px-5 pb-4 text-sm text-gray-600">
            {inventory ? 'No parcels to handle at this hub.' : error ? 'Inventory is unavailable.' : 'Loading inventory…'}
          </p>}
        </section>
      </div>
    </HubManagerLayout>
  );
}
