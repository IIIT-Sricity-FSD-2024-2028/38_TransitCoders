import { useState, useEffect } from 'react';
import { PlusLg } from 'react-bootstrap-icons';
import { fetchMerchantTickets, createMerchantTicket } from '../../services/merchantHelpers';

/**
 * MerchantSupport
 * 
 * Merchant customer support and helpdesk portal:
 * - 3 Dedicated channels (Live Chat, Email Support, Phone Assistance)
 * - Support tickets table loaded from backend SQLite database
 * - Modal to log new merchant support tickets directly to database
 */
export default function MerchantSupport() {
  const [tickets, setTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Delivery');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch real tickets from backend SQLite database on mount
  useEffect(() => {
    let active = true;
    fetchMerchantTickets().then(data => {
      if (active) setTickets(data);
    }, err => {
      if (active) setError(err.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function handleCreateTicket(event) {
    event.preventDefault();
    if (isSubmitting || !newSubject.trim()) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await createMerchantTicket({
        subject: newSubject.trim(),
        category: newCategory,
        description: newDesc.trim(),
        priority: 'med',
      });
      setShowModal(false);
      setNewSubject('');
      setNewDesc('');
      setNewCategory('Delivery');
      setError('');
      try {
        setTickets(await fetchMerchantTickets());
      } catch (err) {
        setError(`Ticket saved. Could not refresh the ticket list. ${err.message}`);
      }
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Support Center</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">Get help with your shipments and account</p>
        </div>
        <button
          onClick={() => { setSubmitError(''); setShowModal(true); }}
          className="px-4 py-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
        >
          <PlusLg size={14} />
          <span>New Ticket</span>
        </button>
      </div>

      {error && <p role="alert" className="text-red-700">{error}</p>}

      {/* ── Support Tickets Table ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-x-auto shadow-sm">
        <div className="p-5 border-b border-[#E5E7EB]">
          <h2 className="text-sm font-bold text-[#111827]">Your Tickets</h2>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F9FAFB] text-[11px] font-bold uppercase text-[#6B7280] border-b border-[#E5E7EB]">
            <tr>
              <th className="px-5 py-3">Ticket ID</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                  {loading ? 'Loading tickets…' : error ? 'Ticket list unavailable.' : 'No support tickets yet.'}
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-5 py-3.5 font-mono font-semibold text-[#F97316]">{t.id}</td>
                  <td className="px-5 py-3.5 font-medium text-[#111827]">{t.subject}{t.description && <p className="mt-1 text-gray-600">{t.description}</p>}</td>
                  <td className="px-5 py-3.5 text-[#6B7280]">{t.category}</td>
                  <td className="px-5 py-3.5 text-[#6B7280]">{t.date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      t.status === 'OPEN' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#D1FAE5] text-[#059669]'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── New Ticket Modal ── */}
      {showModal && (
        <div role="dialog" aria-modal="true" aria-label="Create support ticket" className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#111827]">Create Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label htmlFor="ticket-subject" className="block text-xs font-semibold text-[#111827] mb-1">Subject *</label>
                <input
                  type="text" id="ticket-subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  required
                  placeholder="Summary of your issue"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#F97316]"
                />
              </div>
              <div>
                <label htmlFor="ticket-category" className="block text-xs font-semibold text-[#111827] mb-1">Category</label>
                <select id="ticket-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none bg-white"
                >
                  <option>Delivery</option>
                  <option>Billing</option>
                  <option>Pickup</option>
                  <option>Technical</option>
                </select>
              </div>
              <div>
                <label htmlFor="ticket-description" className="block text-xs font-semibold text-[#111827] mb-1">Description</label>
                <textarea id="ticket-description"
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide any details, tracking IDs, etc."
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#F97316]"
                />
              </div>
              {submitError && <p role="alert" className="text-sm text-red-700">{submitError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button" disabled={isSubmitting}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#6B7280]"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="px-5 py-2 bg-[#F97316] text-white rounded-lg text-xs font-bold hover:bg-[#EA6C0A]"
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
