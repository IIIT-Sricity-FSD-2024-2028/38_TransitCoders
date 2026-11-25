import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

const formatTime = value => value ? new Date(value).toLocaleString('en-IN') : '—';

function download(filename, data, type) {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
    const text = String(value ?? '');
    const safe = /^[=+@\-\t\r\n]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
}

export default function DeliveryHistory() {
    const { orders } = useOutletContext();
    const [query, setQuery] = useState('');
    const [period, setPeriod] = useState('all');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(null);
    const pageSize = 10;
    const search = query.trim().toLowerCase();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const deliveries = orders.filter(order => {
        if (!['delivered', 'returned'].includes(order.status) || (order.status === 'returned' && !order.deliveredAt)) return false;
        const delivered = new Date(order.deliveredAt);
        if (period === 'today' && delivered.toDateString() !== now.toDateString()) return false;
        if (period === 'week' && (!order.deliveredAt || delivered < weekStart || delivered > now)) return false;
        return [order.orderId, order.trackingId, order.customer, order.destination].some(value => value?.toLowerCase().includes(search));
    }).sort((first, second) => (second.deliveredAt || '').localeCompare(first.deliveredAt || ''));
    const pages = Math.max(1, Math.ceil(deliveries.length / pageSize));
    const current = Math.min(pages, page);

    function exportCSV() {
        const rows = [
            ['Order', 'Tracking ID', 'Recipient', 'Destination', 'Delivered at', 'Status'],
            ...deliveries.map(order => [order.orderId, order.trackingId, order.customer, order.destination, order.deliveredAt, order.backendStatus]),
        ];
        download('swifttrack-delivery-history.csv', rows.map(row => row.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
    }

    function downloadReceipt() {
        const fields = [
            'SwiftTrack delivery record',
            `Order: ${selected.orderId}`,
            `Tracking ID: ${selected.trackingId || 'Unavailable'}`,
            `Recipient: ${selected.customer}`,
            `Destination: ${selected.destination}`,
            `Delivered at: ${formatTime(selected.deliveredAt)}`,
            `Current status: ${selected.backendStatus}`,
        ];
        download(`${selected.orderId}-delivery.txt`, fields.join('\n'), 'text/plain;charset=utf-8');
    }

    return (
        <div className="space-y-5">
            <header>
                <Link className="text-sm font-medium text-orange-700" to="/agent/worklist">Back to Worklist</Link>
                <h1 className="text-2xl font-bold text-gray-900">Delivery History</h1>
            </header>
            <div className="flex flex-wrap items-end gap-3">
                <label className="space-y-1 text-sm font-medium"><span>Search deliveries</span><input className="block rounded-lg border border-gray-300 bg-white px-3 py-2" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /></label>
                <label className="space-y-1 text-sm font-medium"><span>Delivery period</span><select className="block rounded-lg border border-gray-300 bg-white px-3 py-2" value={period} onChange={event => { setPeriod(event.target.value); setPage(1); }}>
                    <option value="all">All time</option><option value="today">Today</option><option value="week">Last 7 days</option>
                </select></label>
                <button type="button" onClick={exportCSV} disabled={!deliveries.length} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Export CSV</button>
            </div>
            <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50"><tr>{['Order', 'Recipient', 'Destination', 'Delivered at', ''].map(label => <th key={label} scope="col" className="p-3">{label}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {deliveries.slice((current - 1) * pageSize, current * pageSize).map(order => (
                            <tr key={order.rawId}><td className="p-3 font-mono">{order.orderId}</td><td className="p-3">{order.customer}</td><td className="p-3">{order.destination}</td><td className="p-3">{formatTime(order.deliveredAt)}</td><td className="p-3"><button className="font-medium text-orange-700" onClick={() => setSelected(order)}>View details</button></td></tr>
                        ))}
                        {!deliveries.length && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No deliveries match these filters.</td></tr>}
                    </tbody>
                </table>
            </section>
            {pages > 1 && <nav aria-label="Delivery history pages" className="flex items-center justify-end gap-3 text-sm">
                <button type="button" onClick={() => setPage(current - 1)} disabled={current === 1}>Previous</button>
                <span>Page {current} of {pages}</span>
                <button type="button" onClick={() => setPage(current + 1)} disabled={current === pages}>Next</button>
            </nav>}
            {selected && (
                <div role="dialog" aria-modal="true" aria-label="Delivery details" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <section className="w-full max-w-md space-y-3 rounded-xl bg-white p-6">
                        <h2 className="text-lg font-bold">{selected.orderId}</h2>
                        <p>{selected.customer} · {selected.backendStatus}</p>
                        <p>{selected.destination}</p>
                        <p>Delivered at {formatTime(selected.deliveredAt)}</p>
                        {selected.statusHistory.some(event => event.deliveryPhoto) && <p>Proof of delivery photo recorded</p>}
                        <div className="flex justify-end gap-4 text-sm"><button onClick={() => setSelected(null)}>Close</button><button onClick={downloadReceipt} className="font-semibold text-orange-700">Download delivery record</button></div>
                    </section>
                </div>
            )}
        </div>
    );
}
