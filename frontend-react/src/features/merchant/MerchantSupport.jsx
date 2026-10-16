import { useState, useEffect } from 'react';
import { ChatDots, Envelope, Telephone, PlusLg } from 'react-bootstrap-icons';
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

  // Fetch real tickets from backend SQLite database on mount
  useEffect(() => {
    fetchMerchantTickets().then((liveTickets) => {
      if (Array.isArray(liveTickets)) setTickets(liveTickets);
    });
  }, []);

  async function handleCreateTicket(e) {
    e.preventDefault();
    if (!newSubject.trim()) return;

    setIsSubmitting(true);
    try {
      await createMerchantTicket({
        subject: newSubject.trim(),
        category: newCategory,
        description: newDesc.trim(),
      });
      // Refresh tickets from backend database
      const refreshed = await fetchMerchantTickets();
      setTickets(refreshed);
    } catch (err) {
      console.error('Failed to create ticket in database:', err);
    }

    setIsSubmitting(false);
    setShowModal(false);
    setNewSubject('');
    setNewDesc('');
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
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
        >
          <PlusLg size={14} />
          <span>New Ticket</span>
        </button>
      </div>

      {/* ── 3 Support Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Live Chat */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#F97316] transition-all cursor-pointer shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#FFF0E6] flex items-center justify-center text-[#F97316] mb-3">
              <ChatDots size={20} />
            </div>
            <h3 className="text-sm font-bold text-[#111827]">Live Chat</h3>
            <p className="text-xs text-[#6B7280] mt-1">Chat with our support team in real-time. Avg response: 2 mins.</p>
          </div>
          <div className="mt-4">
            <span className="inline-block bg-[#FFF0E6] text-[#F97316] text-[10px] font-bold px-2 py-0.5 rounded-full">
              ● Online Now
            </span>
          </div>
        </div>

        {/* Email Support */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#F97316] transition-all cursor-pointer shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#DBEAFE] flex items-center justify-center text-[#2563EB] mb-3">
              <Envelope size={20} />
            </div>
            <h3 className="text-sm font-bold text-[#111827]">Email Support</h3>
            <p className="text-xs text-[#6B7280] mt-1">Submit a detailed request. We will reply within 24 hours.</p>
          </div>
          <div className="mt-4">
            <span className="inline-block bg-[#DBEAFE] text-[#2563EB] text-[10px] font-bold px-2 py-0.5 rounded-full">
              support@swifttrack.com
            </span>
          </div>
        </div>

        {/* Phone Support */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#F97316] transition-all cursor-pointer shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#D1FAE5] flex items-center justify-center text-[#059669] mb-3">
              <Telephone size={20} />
            </div>
            <h3 className="text-sm font-bold text-[#111827]">Phone Support</h3>
            <p className="text-xs text-[#6B7280] mt-1">Direct merchant helpline available Mon - Sat, 9am - 8pm.</p>
          </div>
          <div className="mt-4">
            <span className="inline-block bg-[#D1FAE5] text-[#059669] text-[10px] font-bold px-2 py-0.5 rounded-full">
              +91 1800 200 8899
            </span>
          </div>
        </div>
      </div>

      {/* ── Support Tickets Table ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
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
                  No support tickets found in database. Click &quot;New Ticket&quot; to create one.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-5 py-3.5 font-mono font-semibold text-[#F97316]">{t.id}</td>
                  <td className="px-5 py-3.5 font-medium text-[#111827]">{t.subject}</td>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#111827]">Create Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">Subject *</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  required
                  placeholder="Summary of your issue"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#F97316]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">Category</label>
                <select
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
                <label className="block text-xs font-semibold text-[#111827] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide any details, tracking IDs, etc."
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#6B7280]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F97316] text-white rounded-lg text-xs font-bold hover:bg-[#EA6C0A]"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
