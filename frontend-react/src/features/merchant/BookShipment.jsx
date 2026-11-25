import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../../services/api';
import { createMerchantOrder, getAutoDimensions } from '../../services/merchantHelpers';
import ShippingLabelModal from '../../components/merchant/ShippingLabelModal';

const fieldClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm';
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const serviceLevels = { standard: 'Standard', express: 'Express', 'same-day': 'Same Day' };

function Field({ label, children }) {
  return <label className="block space-y-1 text-sm font-medium text-gray-700"><span>{label}</span>{children}</label>;
}

export default function BookShipment() {
  const [hubs, setHubs] = useState([]);
  const [hubRefresh, setHubRefresh] = useState(0);
  const [quoteRefresh, setQuoteRefresh] = useState(0);
  const [form, setForm] = useState({
    customerEmail: '', recipientName: '', recipientPhone: '', deliveryAddress: '', pincode: '',
    pickupHubId: '', deliveryHubId: '', packageType: 'Box', weight: '2',
    serviceLevel: 'express', paymentMode: 'Prepaid', pickupScheduledAt: '',
  });
  const [quote, setQuote] = useState(null);
  const [setupError, setSetupError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(null);
  const [showLabel, setShowLabel] = useState(false);
  const weight = Number(form.weight);
  const { serviceLevel, paymentMode } = form;
  const quoteKey = `${serviceLevel}:${weight}:${paymentMode}:${quoteRefresh}`;
  const currentQuote = quote?.key === quoteKey ? quote : null;
  const dimensions = getAutoDimensions(form.packageType, weight);
  const pickup = hubs.find(hub => hub.hubId === form.pickupHubId);
  const destination = hubs.find(hub => hub.hubId === form.deliveryHubId);
  const selectedFullHub = [pickup, destination].find(hub => hub?.remainingCapacity === 0);
  const setField = event => {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
  };

  useEffect(() => {
    let active = true;
    API.hubs.getAll().then(data => {
      if (active) {
        setHubs(data.filter(hub => hub.status === 'active'));
        setSetupError('');
      }
    }, err => {
      if (active) setSetupError(err.message);
    });
    return () => { active = false; };
  }, [hubRefresh]);

  useEffect(() => {
    if (!Number.isFinite(weight) || weight < 0.1 || weight > 50) return;
    let active = true;
    API.pricing.quote(serviceLevel, weight, paymentMode).then(data => {
      if (active) setQuote({ key: quoteKey, data });
    }, err => {
      if (active) setQuote({ key: quoteKey, error: err.message });
    });
    return () => { active = false; };
  }, [serviceLevel, weight, paymentMode, quoteKey]);

  async function book(event) {
    event.preventDefault();
    if (submitting || !currentQuote?.data) return;
    setError('');
    setSubmitting(true);
    try {
      if (!pickup || !destination) throw new Error('Select a pickup hub and a destination hub.');
      if (selectedFullHub) throw new Error(`Choose another hub. ${selectedFullHub.name} is full.`);
      const scheduledTime = form.pickupScheduledAt ? new Date(form.pickupScheduledAt) : null;
      if (scheduledTime && scheduledTime <= new Date()) throw new Error('Select a pickup time in the future.');
      const order = await createMerchantOrder({
        customerEmail: form.customerEmail.trim(),
        recipientName: form.recipientName.trim(),
        recipientPhone: form.recipientPhone.trim(),
        deliveryAddress: [form.deliveryAddress.trim(), destination.city, form.pincode].filter(Boolean).join(', '),
        pickupAddress: [pickup.address, pickup.city].filter(Boolean).join(', '),
        pickupHubId: pickup.hubId,
        deliveryHubId: destination.hubId,
        pickupScheduledAt: scheduledTime?.toISOString(),
        weight, serviceLevel, paymentMode, packageType: form.packageType, priority: 'Medium',
        quotedTotal: currentQuote.data.total,
      });
      setBooked(order);
      setShowLabel(true);
    } catch (err) {
      setError(err.message);
      if (err.status === 409 || err.status === 400) {
        setHubRefresh(value => value + 1);
        setQuoteRefresh(value => value + 1);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Book a Shipment</h1>
        <p className="text-sm text-gray-500">Choose the recipient, hubs, and service level to book a shipment.</p>
      </header>
      {booked ? (
        <section className="space-y-3 rounded-xl border border-emerald-200 bg-white p-6">
          <h2 className="text-lg font-bold">Shipment booked</h2>
          <p>{booked.trackingNumber} · {money.format(booked.price)}</p>
          {booked.pickupScheduledAt && <p>Pickup scheduled for {new Date(booked.pickupScheduledAt).toLocaleString('en-IN')}.</p>}
          <div className="flex flex-wrap gap-4 text-sm font-medium text-orange-700">
            <button type="button" onClick={() => setShowLabel(true)}>View shipping label</button>
            <Link to="/merchant/orders">View orders</Link>
            <button type="button" onClick={() => {
              setHubRefresh(value => value + 1);
              setQuoteRefresh(value => value + 1);
              setBooked(null);
            }}>Book another shipment</button>
          </div>
          {showLabel && <ShippingLabelModal order={booked} isOpen onClose={() => setShowLabel(false)} />}
        </section>
      ) : (
        <form onSubmit={book} className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <fieldset disabled={submitting} className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
            <Field label="Recipient name"><input name="recipientName" className={fieldClass} value={form.recipientName} onChange={setField} required /></Field>
            <Field label="Recipient phone"><input name="recipientPhone" type="tel" className={fieldClass} value={form.recipientPhone} onChange={setField} pattern="\+?[0-9][0-9\s\-]{6,19}" required /></Field>
            <Field label="Customer account email"><input name="customerEmail" type="email" className={fieldClass} value={form.customerEmail} onChange={setField} required /></Field>
            <Field label="Delivery address"><input name="deliveryAddress" className={fieldClass} value={form.deliveryAddress} onChange={setField} required /></Field>
            <Field label="PIN code"><input name="pincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} className={fieldClass} value={form.pincode} onChange={setField} required /></Field>
            <Field label="Pickup hub"><select name="pickupHubId" className={fieldClass} value={form.pickupHubId} onChange={setField} required>
              <option value="">Select a pickup hub</option>
              {hubs.map(hub => <option key={hub.hubId} value={hub.hubId} disabled={hub.remainingCapacity === 0}>{hub.name} ({hub.remainingCapacity} slots)</option>)}
            </select></Field>
            <Field label="Destination hub"><select name="deliveryHubId" className={fieldClass} value={form.deliveryHubId} onChange={setField} required>
              <option value="">Select a destination hub</option>
              {hubs.map(hub => <option key={hub.hubId} value={hub.hubId} disabled={hub.remainingCapacity === 0}>{hub.name} ({hub.remainingCapacity} slots)</option>)}
            </select></Field>
            <Field label="Pickup time (optional)"><input name="pickupScheduledAt" type="datetime-local" className={fieldClass} value={form.pickupScheduledAt} onChange={setField} /></Field>
            <Field label="Package weight (kg)"><input name="weight" type="number" min="0.1" max="50" step="0.1" className={fieldClass} value={form.weight} onChange={setField} required /></Field>
            <Field label="Package type"><select name="packageType" className={fieldClass} value={form.packageType} onChange={setField}>
              {['Box', 'Envelope', 'Pallet'].map(type => <option key={type}>{type}</option>)}
            </select><small className="block text-gray-500">Estimated dimensions {dimensions.length} × {dimensions.width} × {dimensions.height} cm</small></Field>
            <Field label="Service level"><select name="serviceLevel" className={fieldClass} value={serviceLevel} onChange={setField}>
              {Object.entries(serviceLevels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></Field>
            <Field label="Payment method"><select name="paymentMode" className={fieldClass} value={paymentMode} onChange={setField}>
              <option value="Prepaid">Prepaid</option><option value="COD">Cash on delivery</option>
            </select></Field>
          </fieldset>
          <section className="self-start space-y-4 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-bold text-gray-900">Shipping quote</h2>
            {setupError && <p role="alert" className="text-sm text-red-700">Could not load hubs. {setupError}</p>}
            {currentQuote?.error && <p role="alert" className="text-sm text-red-700">{currentQuote.error}</p>}
            {(setupError || currentQuote?.error || selectedFullHub) && <button type="button" className="text-sm font-medium text-orange-700" onClick={() => {
              setHubRefresh(value => value + 1);
              setQuoteRefresh(value => value + 1);
            }}>Refresh quote and hub availability</button>}
            {selectedFullHub && <p className="text-sm text-red-700">{selectedFullHub.name} is full. Choose another hub.</p>}
            {currentQuote?.data ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt>Billable weight</dt>
                  <dd>{currentQuote.data.billableWeightKg} kg × {money.format(currentQuote.data.ratePerKg)}/kg</dd>
                </div>
                {[
                  ['Base fee', 'baseFee'], ['Weight fee', 'weightFee'], ['Cash on delivery', 'codFee'],
                  ['Discount', 'discount'], ['Tax', 'tax'], ['Minimum charge adjustment', 'minimumChargeAdjustment'], ['Total', 'total'],
                ].filter(([, key]) => key !== 'minimumChargeAdjustment' || currentQuote.data[key] > 0).map(([label, key]) => (
                  <div key={key} className="flex justify-between gap-2"><dt>{label}</dt><dd>{money.format(key === 'discount' && currentQuote.data[key] ? -currentQuote.data[key] : currentQuote.data[key])}</dd></div>
                ))}
              </dl>
            ) : !currentQuote?.error && <p className="text-sm text-gray-500">{weight >= 0.1 && weight <= 50 ? 'Calculating…' : 'Enter a weight between 0.1 and 50 kg.'}</p>}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={submitting || !currentQuote?.data || !pickup || !destination || Boolean(selectedFullHub)} className="w-full rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
              {submitting ? 'Booking…' : 'Book Shipment'}
            </button>
          </section>
        </form>
      )}
    </div>
  );
}
