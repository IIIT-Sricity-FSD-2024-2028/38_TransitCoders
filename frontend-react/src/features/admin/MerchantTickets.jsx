import { useEffect, useState } from 'react';
import { API } from '../../services/api';
import AdminTable from '../../components/admin/AdminTable';

const statuses = { open: 'Open', 'in-progress': 'In progress', resolved: 'Resolved', closed: 'Closed' };

export default function MerchantTickets() {
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [saving, setSaving] = useState(null);
    const [query, setQuery] = useState('');

    useEffect(() => {
        let active = true;
        Promise.all([API.tickets.getAll(), API.users.getAll()]).then(([tickets, users]) => {
            if (active) setData({ tickets, names: new Map(users.map(user => [user.id, user.name])) });
        }, err => {
            if (active) setLoadError(err.message);
        });
        return () => { active = false; };
    }, []);

    async function update(ticket, status) {
        if (saving || ticket.status === status) return;
        setSaving(ticket.id);
        setSaveError('');
        try {
            const updated = await API.tickets.update(ticket.id, { status });
            setData(previous => ({ ...previous, tickets: previous.tickets.map(item => item.id === updated.id ? updated : item) }));
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaving(null);
        }
    }

    const search = query.trim().toLowerCase();
    const tickets = data?.tickets.filter(ticket => [ticket.ticketId, ticket.subject, ticket.category, data.names.get(ticket.merchantId)].some(value => value?.toLowerCase().includes(search))) || [];
    const columns = [
        { header: 'Ticket', render: ticket => <div className="space-y-1"><strong>{ticket.subject}</strong><p className="font-mono text-xs">{ticket.ticketId}</p>{ticket.description && <p>{ticket.description}</p>}</div> },
        { header: 'Merchant', render: ticket => data.names.get(ticket.merchantId) || 'Unavailable' },
        { header: 'Category', render: ticket => ticket.category || '—' },
        { header: 'Status', render: ticket => (
            <select aria-label={`Status for ${ticket.subject}`} className="rounded-lg border border-gray-300 bg-white px-2 py-1" value={ticket.status} disabled={Boolean(saving)} onChange={event => update(ticket, event.target.value)}>
                {Object.entries(statuses).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
        ) },
    ];

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Merchant Tickets</h1>
            <label className="block max-w-sm space-y-1 text-sm font-medium"><span>Search merchant tickets</span><input className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2" value={query} onChange={event => setQuery(event.target.value)} /></label>
            {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
            <section className="rounded-xl border border-gray-200 bg-white">
                <AdminTable columns={columns} data={tickets} isLoading={!data && !loadError} error={loadError} emptyMessage="No tickets match your search." />
            </section>
        </div>
    );
}
