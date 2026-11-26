import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { statusLabel } from '../../services/orderStatus';
import { useConfirmDelivery } from './customerHooks';
import { useOrder } from '../../shared/orders/ordersHooks';
import { normalizeCustomerOrder, normalizeOrderReference } from './customerSelectors';
import StatusBadge from '../../components/customer/StatusBadge';
import OrderMessages from '../../components/OrderMessages';

export default function CustomerTracking() {
    const [searchParams, setSearchParams] = useSearchParams();
    const id = searchParams.get('id') || '';
    return <TrackingView key={id} id={id} search={query => setSearchParams({ id: query })} />;
}

function TrackingView({ id, search }) {
    const [trackingInput, setTrackingInput] = useState(id);
    const [manualLoading, setManualLoading] = useState(false);
    const [confirmError, setConfirmError] = useState('');
    const reference = id ? normalizeOrderReference(id) : '';

    const {
        data: rawOrder,
        isLoading,
        isFetching,
        error: queryError,
        refetch,
    } = useOrder(reference, { skip: !reference });
    const [triggerConfirmDelivery, { isLoading: confirming }] = useConfirmDelivery();

    const loading = Boolean(reference) && (isLoading || manualLoading);
    const errorMessage = !loading && queryError
        ? (queryError.status === 403 || queryError.status === 404
            ? `No shipment found for "${id}".`
            : queryError.message)
        : '';

    const order = useMemo(() => {
        if (loading || errorMessage) return null;
        return rawOrder ? normalizeCustomerOrder(rawOrder) : null;
    }, [loading, errorMessage, rawOrder]);

    const confirmed = order?.statusHistory.some(event => event.note === 'Receipt confirmed by customer');

    async function confirmReceipt() {
        if (confirming || isFetching || !order) return;
        setConfirmError('');
        try {
            // confirmDelivery invalidates this order's cache tag, so the query refetches itself.
            await triggerConfirmDelivery(order.backendId).unwrap();
        } catch (err) {
            setConfirmError(err.message || 'Could not confirm receipt.');
        }
    }

    async function submit(event) {
        event.preventDefault();
        const query = trackingInput.trim();
        if (!query) return;
        if (query === id) {
            setManualLoading(true);
            try {
                await refetch();
            } finally {
                setManualLoading(false);
            }
        } else {
            search(query);
        }
    }

    return (
        <div className="max-w-5xl space-y-5">
            <header><h1 className="text-2xl font-bold text-gray-900">Live Shipment Tracking</h1><p className="text-sm text-gray-500">Enter a tracking or order ID to view shipment updates.</p></header>
            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
                <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
                    <label className="min-w-48 flex-1 space-y-1 text-sm font-medium">
                        <span>Tracking or order ID</span>
                        <input required className="block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono" value={trackingInput} onChange={event => setTrackingInput(event.target.value)} />
                    </label>
                    <button type="submit" disabled={loading || confirming} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Track Package</button>
                </form>
                {loading && <p role="status" className="text-sm text-gray-500">Loading shipment…</p>}
                {!loading && errorMessage && <p role="alert" className="text-sm text-red-700">{errorMessage}</p>}
            </section>
            {order && (
                <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold">{order.trackingId || order.id}</h2>
                        <StatusBadge status={order.status} />
                    </div>
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        {[['Pickup', order.pickupAddress], ['Destination', order.deliveryAddress], ['Estimated delivery', order.estimatedDelivery], ['Courier', order.assignedAgent]].map(([label, value]) => (
                            <div key={label}><dt className="text-gray-500">{label}</dt><dd>{value}</dd></div>
                        ))}
                    </dl>
                    {order.assignedAgentId && <OrderMessages orderId={order.backendId} channel="customer" label="Message delivery agent" />}
                    <div>
                        <h3 className="mb-3 font-semibold">Shipment history</h3>
                        {order.statusHistory.length ? (
                            <ol className="space-y-3 border-l border-orange-200 pl-4 text-sm">
                                {[...order.statusHistory].reverse().map((event, index) => (
                                    <li key={index}>
                                        <strong>{statusLabel(event.status)}</strong>
                                        {event.note && <p>{event.note}</p>}
                                        {event.timestamp && <time dateTime={event.timestamp} className="text-gray-600">{new Date(event.timestamp).toLocaleString('en-IN')}</time>}
                                    </li>
                                ))}
                            </ol>
                        ) : <p className="text-sm text-gray-500">No shipment updates yet.</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <Link className="text-sm font-semibold text-orange-700" to={`/customer/support?orderId=${encodeURIComponent(order.trackingId || order.id)}`}>Raise a Complaint</Link>
                        {order.status === 'Delivered' && !confirmed && <button onClick={confirmReceipt} disabled={confirming || isFetching} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{confirming ? 'Confirming…' : 'Confirm Receipt'}</button>}
                        {confirmed && <p role="status" className="text-sm text-emerald-700">Receipt confirmed.</p>}
                    </div>
                    {confirmError && <p role="alert" className="text-sm text-red-700">{confirmError}</p>}
                </section>
            )}
        </div>
    );
}
