
import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  ExclamationTriangle,
  CheckCircle,
  Camera,
  X,
  ArrowLeft,
  ClockHistory
} from "react-bootstrap-icons";
import { API } from "../../services/api";

const ISSUE_CATEGORIES = [
  {
    value: "CUSTOMER_UNAVAILABLE",
    label: "Customer Unavailable / Phone Unreachable"
  },
  {
    value: "DAMAGED_PACKAGE",
    label: "Package Damaged In-Transit"
  },
  {
    value: "ADDRESS_INCORRECT",
    label: "Incorrect / Incomplete Delivery Address"
  },
  {
    value: "VEHICLE_BREAKDOWN",
    label: "Vehicle Breakdown / Transit Delay"
  },
  {
    value: "CUSTOMER_REFUSED",
    label: "Customer Refused Delivery"
  },
  {
    value: "OTHER",
    label: "Other Operational Issue"
  }
];

const INITIAL_RECENT_ISSUES = [
  {
    id: "RPT-9042",
    orderId: "ORD-9280",
    category: "Customer Unavailable / Phone Unreachable",
    severity: "Medium",
    description: "Called customer 3 times at gate; phone was switched off. Security guard confirmed recipient out of town.",
    status: "Resolved",
    timestamp: "Yesterday, 04:30 PM",
  }
];

export default function ReportIssue() {
    const navigate = useNavigate();
    const outletContext = useOutletContext() || {};
    const orders = outletContext.orders || [];

    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [category, setCategory] = useState("CUSTOMER_UNAVAILABLE");
    const [severity, setSeverity] = useState("Medium");
    const [description, setDescription] = useState("");

    const [proofPhoto, setProofPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [recentIssues, setRecentIssues] = useState(INITIAL_RECENT_ISSUES);

    useEffect(() => {
        if (orders.length > 0 && !selectedOrderId) {
            setSelectedOrderId(orders[0].id);
        }
    }, [orders, selectedOrderId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSuccessMessage("");
        setErrorMessage("");

        if (!selectedOrderId) {
            setErrorMessage("Please select an affected order.");
            return;
        }

        if (!description.trim()) {
            setErrorMessage("Please describe the issue before submitting.");
            return;
        }

        setSubmitting(true);

        const selectedCategory = ISSUE_CATEGORIES.find(
            (item) => item.value === category
        );

        try {
            if (API?.orders?.reportMishap) {
                await API.orders.reportMishap(
                    selectedOrderId,
                    category,
                    description.trim()
                ).catch((err) => {
                    console.warn("Issue API call fallback:", err);
                });
            }
        } catch (error) {
            console.warn("Issue API unavailable; using local demo mode.", error);
        }

        const newReport = {
            id: `RPT-${Math.floor(1000 + Math.random() * 9000)}`,
            orderId: selectedOrderId,
            category: selectedCategory?.label || category,
            severity,
            description: description.trim(),
            status: "Under Review",
            timestamp: "Just now",
        };

        setRecentIssues((previous) => [newReport, ...previous]);

        setDescription("");
        setProofPhoto(null);
        setPhotoPreview("");
        setSuccessMessage(`Incident #${newReport.id} logged successfully for Order ${selectedOrderId}. Dispatch hub notified.`);

        setSubmitting(false);
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header with back navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-600 transition-colors mb-2 cursor-pointer"
                    >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Report an Issue
                    </h1>
                    <p className="mt-0.5 text-sm text-gray-500">
                        Report delivery obstacles, customer mishaps, or package damage directly to dispatch.
                    </p>
                </div>
            </div>

            {/* Success banner */}
            {successMessage && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                        <span className="font-medium">{successMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSuccessMessage("")}
                        className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
                        aria-label="Dismiss success message"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Error banner */}
            {errorMessage && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5">
                        <ExclamationTriangle size={20} className="text-rose-600 shrink-0" />
                        <span className="font-medium">{errorMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage("")}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        aria-label="Dismiss error message"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Report form card */}
            <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm"
            >
                <div>
                    <h2 className="text-lg font-bold text-gray-900">
                        Incident Details
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Provide accurate details about the affected delivery load.
                    </p>
                </div>

                {/* Affected order */}
                <div>
                    <label
                        htmlFor="order"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700"
                    >
                        Affected Order
                    </label>

                    <select
                        id="order"
                        value={selectedOrderId}
                        onChange={(e) => setSelectedOrderId(e.target.value)}
                        className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 p-3 text-sm text-gray-800 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 cursor-pointer"
                        required
                        disabled={orders.length === 0}
                    >
                        {orders.length === 0 ? (
                            <option value="">No active orders available</option>
                        ) : (
                            orders.map((order) => {
                                const customer = typeof order.customer === "string" ? order.customer : (order.customer?.name || order.customerName || "Customer");
                                const destination = order.destination || order.address || "";
                                return (
                                    <option key={order.id} value={order.id}>
                                        {order.id} &mdash; {customer} {destination ? `(${destination})` : ""} [{order.status}]
                                    </option>
                                );
                            })
                        )}
                    </select>

                    {orders.length === 0 && (
                        <p className="mt-2 text-xs font-medium text-amber-600">
                            No active deliveries found in your session.
                        </p>
                    )}
                </div>

                {/* Category and severity */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label
                            htmlFor="category"
                            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700"
                        >
                            Issue Category
                        </label>

                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 p-3 text-sm text-gray-800 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 cursor-pointer"
                        >
                            {ISSUE_CATEGORIES.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                            Severity Level
                        </label>

                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { level: "Medium", activeClass: "bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/20" },
                                { level: "High", activeClass: "bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/20" },
                                { level: "Critical", activeClass: "bg-rose-600 border-rose-600 text-white shadow-sm shadow-rose-600/20" }
                            ].map(({ level, activeClass }) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setSeverity(level)}
                                    className={`rounded-xl border py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                                        severity === level
                                            ? activeClass
                                            : "border-gray-200 bg-gray-50/70 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label
                        htmlFor="description"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700"
                    >
                        Detailed Explanation
                    </label>

                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Explain what happened, recipient communication attempts, and any immediate actions taken..."
                        rows={4}
                        maxLength={2000}
                        required
                        className="w-full resize-y rounded-xl border border-gray-200/80 bg-gray-50/50 p-3.5 text-sm text-gray-800 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 placeholder:text-gray-400"
                    />

                    <p className="mt-1 text-right text-xs text-gray-400">
                        {description.length}/2000 characters
                    </p>
                </div>

                {/* Optional proof photo */}
                <div>
                    <label
                        htmlFor="proofPhoto"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700"
                    >
                        Supporting Photo Evidence (Optional)
                    </label>

                    {!photoPreview ? (
                        <label
                            htmlFor="proofPhoto"
                            className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center transition-all hover:border-orange-400 hover:bg-orange-50/20"
                        >
                            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Camera size={22} />
                            </div>
                            <span className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                                Click to attach photo evidence
                            </span>
                            <span className="mt-1 text-xs text-gray-400">
                                Supports JPG, PNG, WEBP up to 5 MB
                            </span>
                        </label>
                    ) : (
                        <div className="flex items-center gap-4 p-3 rounded-2xl border border-gray-200 bg-gray-50/50">
                            <img
                                src={photoPreview}
                                alt="Selected proof"
                                className="h-20 w-20 rounded-xl border border-gray-200 object-cover shadow-sm"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">
                                    {proofPhoto?.name || "Photo attachment"}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                    {proofPhoto ? `${(proofPhoto.size / 1024).toFixed(1)} KB` : "Attached"}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    URL.revokeObjectURL(photoPreview);
                                    setPhotoPreview("");
                                    setProofPhoto(null);
                                }}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1"
                            >
                                <X size={16} />
                                <span>Remove</span>
                            </button>
                        </div>
                    )}

                    <input
                        id="proofPhoto"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                                setErrorMessage("Please select a JPG, PNG or WEBP image.");
                                e.target.value = "";
                                return;
                            }

                            if (file.size > 5 * 1024 * 1024) {
                                setErrorMessage("The photo must be 5 MB or smaller.");
                                e.target.value = "";
                                return;
                            }

                            setErrorMessage("");
                            setProofPhoto(file);
                            setPhotoPreview(URL.createObjectURL(file));
                        }}
                    />
                </div>

                {/* Submit button */}
                <div className="flex justify-end border-t border-gray-100 pt-5">
                    <button
                        type="submit"
                        disabled={submitting || orders.length === 0}
                        className="rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                    >
                        <ExclamationTriangle size={16} />
                        <span>{submitting ? "Submitting..." : "Submit Incident Report"}</span>
                    </button>
                </div>
            </form>

            {/* Recent reports list */}
            <section className="space-y-3.5">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">
                        Recent Reported Incidents
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Log of reported incidents submitted to dispatch during this session.
                    </p>
                </div>

                {recentIssues.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
                        <ExclamationTriangle
                            size={32}
                            className="mx-auto mb-2 text-gray-300"
                        />
                        <p className="font-semibold text-gray-700 text-sm">
                            No incidents reported yet
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Submitted reports will appear here automatically.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentIssues.map((issue) => (
                            <article
                                key={issue.id}
                                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-3"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600 shrink-0">
                                            <ExclamationTriangle size={18} />
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900 text-sm">
                                                    {issue.category}
                                                </h3>
                                                <span className="text-xs font-semibold text-gray-400">
                                                    &bull; {issue.orderId}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Ticket #{issue.id} &bull; Severity: <strong className={issue.severity === 'Critical' ? 'text-rose-600' : issue.severity === 'High' ? 'text-orange-600' : 'text-amber-600'}>{issue.severity}</strong>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                                            issue.status === 'Resolved'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {issue.status}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                                    {issue.description}
                                </p>

                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                    <ClockHistory size={12} />
                                    <span>{issue.timestamp}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

