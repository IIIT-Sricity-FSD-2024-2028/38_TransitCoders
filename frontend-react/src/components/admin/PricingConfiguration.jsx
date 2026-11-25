import { useEffect, useState } from 'react';
import { API } from '../../services/api';

const pricingFields = [
    ['baseFee', 'Base fee'], ['perKgStandard', 'Standard rate per kg'],
    ['perKgExpress', 'Express rate per kg'], ['perKgSameDay', 'Same-day rate per kg'],
    ['codFee', 'Cash-on-delivery fee'], ['discountPercent', 'Discount (%)'],
    ['taxPercent', 'Tax (%)'], ['minCharge', 'Minimum charge'],
];

export default function PricingConfiguration() {
    const [values, setValues] = useState(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        API.pricing.getConfig().then(data => { if (active) setValues(data); }, err => { if (active) setError(err.message); });
        return () => { active = false; };
    }, []);

    async function save(event) {
        event.preventDefault();
        if (saving) return;
        setError('');
        setNotice('');
        setSaving(true);
        try {
            const payload = Object.fromEntries(pricingFields.map(([key]) => [key, Number(values[key])]));
            setValues(await API.pricing.updateConfig(payload));
            setNotice('Pricing saved.');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="space-y-4">
            <h2 className="text-base font-bold">Shipping Pricing</h2>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {!values && !error && <p role="status">Loading pricing…</p>}
            {values && <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
                {pricingFields.map(([key, label]) => <label className="block space-y-1 text-sm font-medium" key={key}><span>{label}</span><input type="number" className="block w-full rounded-lg border border-gray-300 px-3 py-2" min="0" max={key === 'discountPercent' ? 100 : undefined} step="0.01" required disabled={saving} value={values[key]} onChange={event => setValues(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}
                <button type="submit" disabled={saving} className="justify-self-start rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Pricing'}</button>
            </form>}
            {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
        </section>
    );
}
