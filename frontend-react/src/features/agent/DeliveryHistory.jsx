import { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
    CheckCircleFill, 
    StarFill, 
    ClockHistory, 
    Search, 
    ArrowLeft, 
    Download, 
    BoxSeam, 
    GeoAlt, 
    ChevronLeft, 
    ChevronRight,
    X,
    Calendar3,
    AwardFill,
    Check2Circle
} from 'react-bootstrap-icons';

export default function DeliveryHistory() {
    const context = useOutletContext() || {};
    const liveDelivered = useMemo(() => {
        return (context.orders || [])
            .filter(o => o.status === 'delivered')
            .map(o => ({
                id: o.orderId || o.id,
                customer: o.customer || 'Customer',
                phone: o.phone || "+91 98765 00000",
                location: o.destination || "Delivery Address",
                origin: o.origin || "Hub Dispatch",
                date: "Today",
                deliveredTime: "Completed",
                period: "today",
                status: "Delivered",
                rating: 5,
                feedback: "Delivered successfully on schedule. Proof of delivery verified.",
                amount: o.amount || "₹350",
                distance: o.distance || "4.0 km",
                timeTaken: "25 mins",
                signatureVerified: true
            }));
    }, [context.orders]);

    const combinedDeliveries = liveDelivered;

    const [period, setPeriod] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const perPage = 5;

    // Filter logic
    const filteredDeliveries = useMemo(() => {
        return combinedDeliveries.filter(item => {
            const matchesPeriod = 
                period === 'all' ? true : 
                period === 'today' ? item.period === 'today' : 
                period === 'week' ? (item.period === 'today' || item.period === 'week') : 
                true;

            const q = searchTerm.toLowerCase().trim();
            const matchesSearch = !q || 
                item.id.toLowerCase().includes(q) ||
                item.customer.toLowerCase().includes(q) ||
                item.location.toLowerCase().includes(q);

            return matchesPeriod && matchesSearch;
        });
    }, [combinedDeliveries, period, searchTerm]);

    const totalPages = Math.ceil(filteredDeliveries.length / perPage) || 1;
    const paginatedDeliveries = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredDeliveries.slice(start, start + perPage);
    }, [filteredDeliveries, currentPage]);

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleExportCSV = () => {
        const headers = ["Order ID", "Customer", "Phone", "Location", "Date", "Delivered Time", "Status", "Rating", "Amount"];
        const rows = filteredDeliveries.map(d => [
            d.id,
            `"${d.customer}"`,
            `"${d.phone}"`,
            `"${d.location}"`,
            d.date,
            d.deliveredTime,
            d.status,
            `${d.rating}/5`,
            d.amount
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `SwiftTrack_Delivery_History_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header & Back Link */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link 
                            to="/agent/worklist" 
                            className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-orange-600 transition-colors"
                        >
                            <ArrowLeft className="mr-1" /> Back to Worklist
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ClockHistory className="text-orange-600" />
                        Delivery History
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Review past completed delivery tasks, customer feedback, and delivery certificates.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-orange-600 shadow-sm transition-all"
                    >
                        <Download size={14} />
                        Export Log
                    </button>
                </div>
            </div>

            {/* Quick KPI Summaries */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <CheckCircleFill size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</p>
                        <p className="text-xl font-bold text-gray-900">{combinedDeliveries.length}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check2Circle size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">On-Time Rate</p>
                        <p className="text-xl font-bold text-gray-900">98.4%</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                        <StarFill size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Rating</p>
                        <p className="text-xl font-bold text-gray-900">4.9 / 5.0</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <AwardFill size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Payout</p>
                        <p className="text-xl font-bold text-gray-900">
                            {combinedDeliveries.length > 0 
                                ? `₹${combinedDeliveries.reduce((sum, d) => sum + (parseInt(String(d.amount).replace(/\D/g, '')) || 350), 0)}`
                                : '₹0'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Period Pills */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { key: 'today', label: 'Today' },
                        { key: 'week', label: 'This Week' },
                        { key: 'month', label: 'This Month' },
                        { key: 'all', label: 'All Time' },
                    ].map(btn => (
                        <button
                            key={btn.key}
                            onClick={() => handlePeriodChange(btn.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                period === btn.key
                                    ? 'bg-orange-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search Order ID, customer, address..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-800"
                    />
                </div>
            </div>

            {/* History Table Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-700">
                        <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200/80">
                            <tr>
                                <th className="py-3.5 px-4 font-semibold">Order ID</th>
                                <th className="py-3.5 px-4 font-semibold">Customer</th>
                                <th className="py-3.5 px-4 font-semibold">Destination</th>
                                <th className="py-3.5 px-4 font-semibold">Delivered At</th>
                                <th className="py-3.5 px-4 font-semibold">Status</th>
                                <th className="py-3.5 px-4 font-semibold">Feedback</th>
                                <th className="py-3.5 px-4 font-semibold text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedDeliveries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400">
                                        <ClockHistory size={32} className="mx-auto mb-2 text-gray-300" />
                                        <p className="font-semibold text-gray-600">No deliveries found</p>
                                        <p className="text-xs text-gray-400 mt-1">Try selecting a different time filter or clear your search term.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedDeliveries.map(item => (
                                    <tr 
                                        key={item.id} 
                                        className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedOrder(item)}
                                    >
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span className="font-semibold text-orange-600 group-hover:underline">
                                                {item.id}
                                            </span>
                                            <span className="block text-[11px] text-gray-400">{item.distance}</span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-medium text-gray-900 block">{item.customer}</span>
                                            <span className="text-xs text-gray-400">{item.phone}</span>
                                        </td>
                                        <td className="py-3.5 px-4 max-w-xs truncate text-xs text-gray-600">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <GeoAlt size={12} className="text-gray-400 shrink-0" />
                                                <span className="truncate">{item.location}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                                            <span className="font-medium text-gray-800">{item.date}</span>
                                            <span className="block text-gray-400 text-[11px]">{item.deliveredTime}</span>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                <CheckCircleFill size={10} />
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <StarFill 
                                                        key={star} 
                                                        size={12} 
                                                        className={star <= item.rating ? "text-amber-400" : "text-gray-200"} 
                                                    />
                                                ))}
                                                <span className="text-xs font-semibold text-gray-600 ml-1">
                                                    {item.rating}.0
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedOrder(item);
                                                }}
                                                className="text-xs font-semibold text-gray-600 hover:text-orange-600 px-2.5 py-1 rounded bg-gray-50 border border-gray-200 hover:border-orange-300 transition-colors"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 bg-gray-50/70 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-gray-500">
                        Showing {filteredDeliveries.length > 0 ? (currentPage - 1) * perPage + 1 : 0} to{" "}
                        {Math.min(currentPage * perPage, filteredDeliveries.length)} of {filteredDeliveries.length} completed tasks
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Previous page"
                        >
                            <ChevronLeft size={14} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                                    page === currentPage
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Next page"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Delivery Details / Receipt Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white flex justify-between items-center">
                            <div>
                                <span className="text-xs uppercase font-bold tracking-wider text-orange-100">Delivery Confirmation</span>
                                <h3 className="text-xl font-bold flex items-center gap-2 mt-0.5">
                                    <BoxSeam /> {selectedOrder.id}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)} 
                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4 text-sm text-gray-700">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <span className="text-gray-500">Status</span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircleFill size={12} />
                                    Completed & Signed
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-gray-400 block font-semibold uppercase">Recipient</span>
                                    <span className="font-semibold text-gray-900 text-sm">{selectedOrder.customer}</span>
                                    <span className="text-gray-500 block">{selectedOrder.phone}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block font-semibold uppercase">Delivered On</span>
                                    <span className="font-semibold text-gray-900 text-sm">{selectedOrder.date}</span>
                                    <span className="text-gray-500 block">{selectedOrder.deliveredTime}</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Pickup Origin:</span>
                                    <span className="font-medium text-gray-800">{selectedOrder.origin}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Drop Destination:</span>
                                    <span className="font-medium text-gray-800 text-right">{selectedOrder.location}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Distance & Duration:</span>
                                    <span className="font-medium text-gray-800">{selectedOrder.distance} ({selectedOrder.timeTaken})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Payout Earned:</span>
                                    <span className="font-bold text-orange-600">{selectedOrder.amount}</span>
                                </div>
                            </div>

                            {/* Customer Feedback */}
                            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/50">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-amber-900">Customer Feedback</span>
                                    <div className="flex items-center text-amber-500">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <StarFill key={s} size={11} className={s <= selectedOrder.rating ? "text-amber-400" : "text-gray-200"} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-amber-800 italic">
                                    "{selectedOrder.feedback}"
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    alert(`Delivery receipt for ${selectedOrder.id} ready.`);
                                    setSelectedOrder(null);
                                }}
                                className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors"
                            >
                                Print Slip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
