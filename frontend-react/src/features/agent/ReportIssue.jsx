import { useState } from 'react';
import { useMishaps } from '../../shared/orders/ordersHooks';
import { useReportMishap } from './agentHooks';
import { useAgentPortal } from './useAgentPortal';

const issueTypes = {
    customer_unavailable: 'Customer unavailable',
    package_damaged: 'Package damaged',
    address_not_found: 'Address not found',
    vehicle_breakdown: 'Vehicle breakdown',
    other: 'Other delivery issue',
};

const fieldClass = 'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';

export default function ReportIssue() {
    const { orders } = useAgentPortal();
    const [orderId, setOrderId] = useState('');
    const [category, setCategory] = useState('customer_unavailable');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const {
        data: reports,
        isLoading: loadingReports,
        error: reportsError,
    } = useMishaps();
    const [triggerReportMishap, { isLoading: submitting }] = useReportMishap();

    const historyError = reportsError?.message || '';
    const activeOrders = orders.filter(order => ['Assigned', 'PickedUp', 'InTransit', 'OutForDelivery'].includes(order.backendStatus));

    async function submit(event) {
        event.preventDefault();
        if (submitting) return;
        setError('');
        setSuccess('');
        if (!description.trim()) {
            setError('Describe the delivery issue.');
            return;
        }
        try {
            const order = await triggerReportMishap({ id: orderId, type: category, description: description.trim() }).unwrap();
            setOrderId('');
            setDescription('');
            setSuccess(`Issue reported for ${order.orderId}.`);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="max-w-4xl space-y-5">
            <header><h1 className="text-2xl font-bold text-gray-900">Report a Delivery Issue</h1><p className="text-sm text-gray-500">Record an incident that prevented an assigned delivery from completing.</p></header>
            <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
                <label className="block space-y-1 text-sm font-medium">
                    <span>Affected order</span>
                    <select className={fieldClass} value={orderId} onChange={event => setOrderId(event.target.value)} required disabled={submitting}>
                        <option value="">Select an assigned order</option>
                        {activeOrders.map(order => <option key={order.rawId} value={order.rawId}>{order.orderId} · {order.customer}</option>)}
                    </select>
                </label>
                <label className="block space-y-1 text-sm font-medium">
                    <span>Issue type</span>
                    <select className={fieldClass} value={category} onChange={event => setCategory(event.target.value)} disabled={submitting}>
                        {Object.entries(issueTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </label>
                <label className="block space-y-1 text-sm font-medium"><span>Description</span><textarea className={fieldClass} rows={4} value={description} onChange={event => setDescription(event.target.value)} required disabled={submitting} /></label>
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}
                <button type="submit" disabled={submitting || !activeOrders.length} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit Issue Report'}</button>
            </form>
            <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="font-semibold">Recent Issues</h2>
                {historyError && <p role="alert" className="text-sm text-red-700">Could not load issue history. {historyError}</p>}
                {!historyError && loadingReports && <p role="status">Loading reports…</p>}
                {!historyError && !loadingReports && reports?.length === 0 && <p className="text-sm text-gray-500">No issues reported yet.</p>}
                {reports?.map(report => (
                    <article key={report.id} className="border-t border-gray-100 pt-3 text-sm">
                        <h3 className="font-semibold">{report.orderNumber || report.trackingId || report.orderId} · {issueTypes[report.type] || report.type}</h3>
                        <p>{report.description}</p>
                        <time className="text-gray-500" dateTime={report.createdAt}>{new Date(report.createdAt).toLocaleString('en-IN')}</time>
                    </article>
                ))}
            </section>
        </div>
    );
}
