import {useState, useEffect, useMemo} from "react";
import { Search,ChevronDown,ThreeDotsVertical,Star,StarFill } from "react-bootstrap-icons";
import { API } from "../../services/api";
import AdminTable from "../../components/admin/AdminTable";
import KPICard from "../../components/shared/KPICard";

export default function FeedbackReview() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRating, setSelectedRating] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");

    useEffect(() => {
         async function fetchComplaints() {
            try {
                setLoading(true)
                setError(null)
                const response = await API.feedback.getAll()
                setFeedbacks(Array.isArray(response) ? response : (response?.data || []))
            } catch (err) {
                console.error("Error fetching complaints:", err)
                setError(err.message || "An error occurred while fetching complaints.")
            } finally {
                setLoading(false)
            }
        }
        fetchComplaints()
    },[])

    const filteredFeedbacks = useMemo(() => {
        return feedbacks.filter((feedback) => {
            const query = searchTerm.toLowerCase()
            const matchesSearchTerm =
                feedback.reference.toLowerCase().includes(query) ||
                feedback.customerName.toLowerCase().includes(query) ||
                (feedback.comment || feedback.comments || '').toLowerCase().includes(query)
            const matchesRating = selectedRating === 'All' || String(feedback.rating) === selectedRating
            const matchesStatus = selectedStatus === 'All' || feedback.status === selectedStatus
            return matchesSearchTerm && matchesRating && matchesStatus
        })
    }, [feedbacks, searchTerm, selectedRating, selectedStatus])

    const handleMarkReviewed = async (id) => {
        try {
            await API.feedback.update(id, { status: 'Reviewed' });
            setFeedbacks((prev) =>
                prev.map((item) => (item.id === id ? { ...item, status: 'Reviewed' } : item))
            );
        } catch (err) {
            console.error('Failed to update feedback status:', err);
        }
    };

    const feedbackColumns = [
        {
           header: 'Reference',
           render: (feedback) => (
               <div className="flex flex-col min-w-0">
                   <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                       {feedback.reference || `fbk-${feedback.id.slice(0, 4)}`}
                   </span>
                   <span className="text-[11px] font-mono text-gray-400 truncate max-w-[140px]" title={feedback.id}>
                       {feedback.id}
                   </span>
               </div>
           ),
       },
       {
           header: 'Customer',
           render: (feedback) => {
               const date = feedback.createdAt || feedback.date;
               const formattedDate = date 
                   ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                   : '—';
               return (
                   <div className="flex flex-col min-w-0">
                       <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                           {feedback.customerName || feedback.customer || 'Customer'}
                       </span>
                       <span className="text-[11px] text-gray-400">
                           {formattedDate}
                       </span>
                   </div>
               );
           },
       },
       {
           header: 'Rating',
           render: (item) => {
               const rating = Number(item.rating) || 0;
               const isNegative = rating <= 2;
               return (
                   <div className="flex items-center gap-0.5">
                       {[1, 2, 3, 4, 5].map((star) => (
                           star <= rating ? (
                               <StarFill 
                                   key={star} 
                                   size={13} 
                                   className={isNegative ? "text-rose-500" : "text-amber-400"} 
                               />
                           ) : (
                               <Star 
                                   key={star} 
                                   size={13} 
                                   className="text-gray-200" 
                               />
                           )
                       ))}
                   </div>
               );
           }
       },
       {
           header: 'Comment',
           render: (item) => {
               const text = item.comments || item.comment;
               return (
                   <span className="text-sm text-gray-600 line-clamp-2 max-w-xs block" title={text}>
                       {text || '—'}
                   </span>
               );
           }
       },
        {
           header: 'Status',
           render: (item) => (
               <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                   item.status === 'Reviewed' 
                       ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                       : 'bg-gray-100 text-gray-700 '
               }`}>
                   {item.status || 'New'}
               </span>
           )
       },
       {
           header: 'Actions',
           headerAlign: 'text-right',
           cellClassName: 'text-right whitespace-nowrap',
           render: (item) => (
               <div className="flex justify-end">
                   {item.status !== 'Reviewed' ? (
                       <button
                           onClick={() => handleMarkReviewed(item.id)}
                           className="px-3 py-1 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-colors"
                       >
                           Mark Reviewed
                       </button>
                   ) : (
                       <span className="text-xs text-gray-400 font-medium px-2 py-1">Completed</span>
                   )}
               </div>
           )
       },
    ]

    return (
        <div className="p-2 bg-gray-50 min-h-screen">
            {/* header */}
            <div className="flex justify-between items-center mb-6">
                <div className="mb-4 left-full">
                    <h1 className="text-2xl font-bold">Feedback Review</h1>
                    <p className="text-lg font-light text-gray-500 mb-2">Monitor ratings and resolve negative platform reviews.</p>
                </div>
            </div>
            {/* widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KPICard
                    title="Total Feedbacks"
                    value={feedbacks.length}
                    isicon={true}
                    iconcolor="bg-blue-50 text-blue-500"
                    icon={<Star size={22} />}
                />
                <KPICard
                    title="Positive Feedbacks"
                    value={feedbacks.filter(f => f.rating >= 4).length}
                    isicon={true}
                    iconcolor="bg-green-50 text-green-500"
                    icon={<StarFill size={22} />}
                />
                <KPICard
                    title="Negative Feedbacks"
                    value={feedbacks.filter(f => f.rating <= 2).length}
                    isicon={true}
                    iconcolor="bg-rose-50 text-rose-500"
                    icon={<StarFill size={22} />}
                />
                <KPICard
                    title="Pending Reviews"
                    value={feedbacks.filter(f => f.status !== 'Reviewed').length}
                    isicon={true}
                    iconcolor="bg-orange-50 text-orange-500"
                    icon={<ThreeDotsVertical size={22} />}
                />
            </div>
            {/* Feedback table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflaw-hidden">
                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search ref, customer, type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors placeholder:text-gray-400"
                        />
                    </div>
                    {/* dropdowns */}
                    <div className="flex items-center gap-3 w full sm:w-auto">
                        <div className="relative">
                            <select 
                                value={selectedRating}
                                onChange={(e) => setSelectedRating(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 text-sm text-gray-700 py-2 pl-3.5 pr-8 rounded-lg outline-none cursor-pointer focus:border-orange-500"
                                >
                                    <option value="All">All Ratings</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                        </div>
                        <div className="relative">
                            <select 
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 text-sm text-gray-700 py-2 pl-3.5 pr-8 rounded-lg outline-none cursor-pointer focus:border-orange-500"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="New">New</option>
                                    <option value="Reviewed">Reviewed</option>
                                    <option value="Actioned">Actioned</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                        </div>
                    </div>
                </div>
                <AdminTable
                    columns={feedbackColumns}
                    data={filteredFeedbacks}
                    isLoading={loading}
                    loadingMessage="Loading feedbacks..."
                    emptyMessage="No feedbacks found."
                    error={error}
                />
            </div>
        </div>
    )
}