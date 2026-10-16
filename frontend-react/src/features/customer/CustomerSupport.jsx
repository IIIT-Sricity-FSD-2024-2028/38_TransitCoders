import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExclamationCircle, ChatSquareHeart, CheckCircleFill, ClockHistory, SendFill, ShieldCheck } from 'react-bootstrap-icons';
import { customerService } from '../../services/customerService';
import StarRating from '../../components/customer/StarRating';
import StatusBadge from '../../components/customer/StatusBadge';
import Toast from '../../components/customer/Toast';

export default function CustomerSupport() {
    const [searchParams] = useSearchParams();

    // Tab State: 'COMPLAINT' or 'FEEDBACK'
    const [activeTab, setActiveTab] = useState('COMPLAINT');

    // 1. Controlled Form State: Complaint
    const [complaintForm, setComplaintForm] = useState({
        orderId: '',
        type: 'Delivery Delay',
        details: '',
        priority: 'Medium'
    });

    // 2. Controlled Form State: Feedback
    const [feedbackForm, setFeedbackForm] = useState({
        orderId: '',
        rating: 5,
        comment: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    // History lists loaded from backend
    const [complaintsList, setComplaintsList] = useState([]);
    const [feedbackList, setFeedbackList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Side Effect: Auto-populate Order ID from URL if navigated from Tracking/Orders (useEffect)
    useEffect(() => {
        const orderIdParam = searchParams.get('orderId');
        if (orderIdParam) {
            setComplaintForm((prev) => ({ ...prev, orderId: orderIdParam }));
            setFeedbackForm((prev) => ({ ...prev, orderId: orderIdParam }));
        }
    }, [searchParams]);

    // Side Effect: Load past complaints and feedback on mount
    useEffect(() => {
        let isMounted = true;
        async function loadHistory() {
            try {
                setLoadingHistory(true);
                const [cData, fData] = await Promise.all([
                    customerService.getComplaints(),
                    customerService.getFeedback()
                ]);
                if (isMounted) {
                    setComplaintsList(cData);
                    setFeedbackList(fData);
                }
            } catch (err) {
                console.error("Failed to load support history:", err);
            } finally {
                if (isMounted) setLoadingHistory(false);
            }
        }
        loadHistory();
        return () => { isMounted = false; };
    }, []);

    // 3. Event Handler: Complaint Submission (Controlled Form)
    async function handleSubmitComplaint(e) {
        e.preventDefault();
        if (!complaintForm.orderId.trim() || !complaintForm.details.trim()) {
            alert('Please provide both the Order ID and explanation details.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await customerService.submitComplaint(complaintForm);
            setSuccessMessage(`Complaint #${res.data.id} submitted successfully! Support team will review within 24h.`);
            setComplaintsList((prev) => [res.data, ...prev]);
            setComplaintForm({ orderId: '', type: 'Delivery Delay', details: '', priority: 'Medium' });
        } catch (err) {
            console.error(err);
            alert('Failed to submit complaint. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    // 4. Event Handler: Feedback Submission (Controlled Form)
    async function handleSubmitFeedback(e) {
        e.preventDefault();
        if (!feedbackForm.orderId.trim() || !feedbackForm.comment.trim()) {
            alert('Please provide the Order ID and your experience comment.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await customerService.submitFeedback(feedbackForm);
            setSuccessMessage(`Thank you for your feedback! Rating of ${feedbackForm.rating} stars recorded.`);
            setFeedbackList((prev) => [res.data, ...prev]);
            setFeedbackForm({ orderId: '', rating: 5, comment: '' });
        } catch (err) {
            console.error(err);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Help & Customer Support</h1>
                <p className="text-sm text-gray-500 mt-1">
                    File delivery grievances, address changes, or rate your courier service experience.
                </p>
            </div>

            {/* Notification Banner */}
            {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircleFill size={18} className="text-emerald-500 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer ml-4"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* 2-Column Bento: Left Form (2 cols), Right History (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Container (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                    {/* Mode Toggle Tabs */}
                    <div className="flex border-b border-gray-100">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('COMPLAINT'); setSuccessMessage(null); }}
                            className={`flex-1 py-4 text-center text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                                activeTab === 'COMPLAINT'
                                    ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/30'
                                    : 'text-gray-400 hover:text-gray-700 bg-white'
                            }`}
                        >
                            <ExclamationCircle size={15} />
                            Raise a Complaint
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveTab('FEEDBACK'); setSuccessMessage(null); }}
                            className={`flex-1 py-4 text-center text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                                activeTab === 'FEEDBACK'
                                    ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/30'
                                    : 'text-gray-400 hover:text-gray-700 bg-white'
                            }`}
                        >
                            <ChatSquareHeart size={15} />
                            Service Feedback
                        </button>
                    </div>

                    {/* Tab 1: Complaint Form */}
                    {activeTab === 'COMPLAINT' ? (
                        <form onSubmit={handleSubmitComplaint} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                                    Tracking / Order ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. TRK-UV34WX56"
                                    value={complaintForm.orderId}
                                    onChange={(e) => setComplaintForm({ ...complaintForm, orderId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white font-mono"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                                        Issue Category
                                    </label>
                                    <select
                                        value={complaintForm.type}
                                        onChange={(e) => setComplaintForm({ ...complaintForm, type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white cursor-pointer"
                                    >
                                        <option value="Delivery Delay">Delivery Delay</option>
                                        <option value="Damaged Package">Damaged Package / Parcel</option>
                                        <option value="Address Correction">Address Correction Request</option>
                                        <option value="Agent Behavior">Delivery Agent Inquiry</option>
                                        <option value="Payment / COD Discrepancy">Payment / COD Discrepancy</option>
                                        <option value="Other">Other Issue</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                                        Priority Level
                                    </label>
                                    <select
                                        value={complaintForm.priority}
                                        onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white cursor-pointer"
                                    >
                                        <option value="Low">Low Priority</option>
                                        <option value="Medium">Medium Priority</option>
                                        <option value="High">High Urgency</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                                    Issue Explanation Details <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Please describe what happened with your shipment..."
                                    value={complaintForm.details}
                                    onChange={(e) => setComplaintForm({ ...complaintForm, details: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white leading-relaxed resize-none"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
                            >
                                <SendFill size={14} />
                                {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                            </button>
                        </form>
                    ) : (
                        /* Tab 2: Feedback Form */
                        <form onSubmit={handleSubmitFeedback} className="p-6 space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                                    Order ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. TRK-XK29BL7M"
                                    value={feedbackForm.orderId}
                                    onChange={(e) => setFeedbackForm({ ...feedbackForm, orderId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white font-mono"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                                    How was your delivery service experience?
                                </label>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 inline-block">
                                    <StarRating
                                        rating={feedbackForm.rating}
                                        onRatingChange={(newVal) => setFeedbackForm({ ...feedbackForm, rating: newVal })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                                    Your Comments & Feedback <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Tell us what you liked or how we can improve..."
                                    value={feedbackForm.comment}
                                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white leading-relaxed resize-none"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
                            >
                                <SendFill size={14} />
                                {submitting ? 'Submitting...' : 'Submit Service Feedback'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Right Column: Ticket & Feedback History List (1 col) */}
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <ClockHistory size={16} className="text-orange-500" />
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                {activeTab === 'COMPLAINT' ? 'Recent Tickets' : 'Recent Reviews'}
                            </h3>
                        </div>

                        {loadingHistory ? (
                            <div className="space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : activeTab === 'COMPLAINT' ? (
                            complaintsList.length === 0 ? (
                                <p className="text-xs text-gray-400 py-6 text-center">No past complaints on record.</p>
                            ) : (
                                <div className="space-y-3">
                                    {complaintsList.map((c) => (
                                        <div key={c.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-900">{c.id}</span>
                                                <StatusBadge status={c.status} />
                                            </div>
                                            <p className="text-xs font-semibold text-orange-600">{c.type}</p>
                                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{c.details}</p>
                                            <div className="text-[10px] text-gray-400 pt-1 flex justify-between">
                                                <span>Order: {c.orderId}</span>
                                                <span className="uppercase font-semibold">{c.priority} Priority</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            feedbackList.length === 0 ? (
                                <p className="text-xs text-gray-400 py-6 text-center">No feedback submitted yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {feedbackList.map((f) => (
                                        <div key={f.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-800">Order: {f.orderId}</span>
                                                <span className="text-xs font-bold text-amber-500">★ {f.rating}/5</span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed italic">"{f.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                        <span>Live backend complaints database connected</span>
                    </div>
                </div>
            </div>

            {/* Day 6 Toast Notification */}
            <Toast
                message={successMessage}
                type="success"
                onClose={() => setSuccessMessage(null)}
            />
        </div>
    );
}
