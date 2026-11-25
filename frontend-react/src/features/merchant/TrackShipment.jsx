import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchMerchantOrders } from '../../services/merchantHelpers';
import OrderStatusBadge from '../../components/merchant/OrderStatusBadge';
import ShippingLabelModal from '../../components/merchant/ShippingLabelModal';

export default function TrackShipment() {
  const [params, setParams] = useSearchParams();
  const id = params.get('id') || '';
  return <TrackingView key={id} id={id} onSearch={value => setParams({ id: value })} />;
}

function TrackingView({ id, onSearch }) {
  const [input, setInput] = useState(id);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [showLabel, setShowLabel] = useState(false);
  const current = result?.attempt === attempt ? result : null;
  const orders = current?.orders || [];
  const query = id.toLowerCase();
  const order = id ? orders.find(item =>
    [item.id, item.trackingNumber, item.backendId].some(value => value?.toLowerCase() === query)
  ) : null;

  useEffect(() => {
    let active = true;
    fetchMerchantOrders().then(data => {
      if (active) setResult({ attempt, orders: data });
    }, err => {
      if (active) setResult({ attempt, error: err.message });
    });
    return () => { active = false; };
  }, [attempt]);

  function search(event) {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;
    if (value === id) setAttempt(previous => previous + 1);
    else onSearch(value);
  }

  return (
    <div className="max-w-5xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Track Shipment</h1>
        <p className="text-sm text-gray-500">Look up a shipment to see its current status and delivery milestones.</p>
      </header>
      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <form className="flex flex-wrap items-end gap-3" onSubmit={search}>
          <label className="min-w-48 flex-1 space-y-1 text-sm font-medium">
            <span>Tracking or order ID</span>
            <input required className="block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono" value={input} onChange={event => setInput(event.target.value)} />
          </label>
          <button className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white" type="submit">Track Shipment</button>
        </form>
        {!id && orders.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {orders.slice(0, 6).map(item => (
              <button className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-mono" key={item.backendId} onClick={() => onSearch(item.trackingNumber || item.id)}>
                {item.trackingNumber || item.id}
              </button>
            ))}
          </div>
        )}
        {!current && <p role="status">Loading shipments…</p>}
        {current?.error && <p role="alert" className="text-red-700">{current.error}</p>}
        {current && !current.error && id && !order && <p role="alert" className="text-red-700">No shipment found for {id}.</p>}
      </section>
      {order && (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-semibold text-gray-900">{order.trackingNumber || order.id}</h2>
            <OrderStatusBadge status={order.status} />
            <button className="text-sm font-semibold text-orange-700" onClick={() => setShowLabel(true)}>View shipping label</button>
          </div>
          <p className="text-sm text-gray-700">{order.pickupAddress || order.pickupHubId || 'Pickup unavailable'} → {order.deliveryAddress}</p>
          <h3 className="text-sm font-semibold">Shipment history</h3>
          {order.timeline.length ? (
            <ol className="space-y-3 border-l border-orange-200 pl-4 text-sm">
              {[...order.timeline].reverse().map((event, index) => <li key={index}><strong>{event.title}</strong><p className="text-gray-600">{event.time}</p></li>)}
            </ol>
          ) : <p className="text-sm text-gray-500">No shipment updates yet.</p>}
          {showLabel && <ShippingLabelModal order={order} isOpen onClose={() => setShowLabel(false)} />}
        </section>
      )}
    </div>
  );
}
