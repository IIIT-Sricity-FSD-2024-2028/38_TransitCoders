import {useState, useEffect, useMemo} from "react";
import { Search,ChevronDown,ThreeDotsVertical } from "react-bootstrap-icons";
import { API } from "../../services/api";
import AdminTable from "../../components/admin/AdminTable";

export default function ComplaintsManagement() {
    const [complaints, setComplaints] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPriority, setSelectedPriority] = useState("All")
    const [selectedStatus, setSelectedStatus] = useState("All")
    const [activeMenuId, setActiveMenuId] = useState(null) //for adding 3dots menu for actions in each row

    useEffect(() => {
        async function fetchComplaints() {
            try {
                setLoading(true)
                setError(null)
                const response = await API.complaints.getAll()
                setComplaints(Array.isArray(response) ? response : [])
            } catch (err) {
                console.error("Error fetching complaints:", err)
                setError(err.message || "An error occurred while fetching complaints.")
            } finally {
                setLoading(false)
            }
        }
        fetchComplaints()
    },[])

    const filteredComplaints = useMemo(() => {
        return complaints.filter((complaint)=>{
            const query = searchTerm.toLowerCase()
            const matchesSearch = 
            (complaint.reference?.toLowerCase().includes(query)) ||
            (complaint.customerName?.toLowerCase().includes(query)) ||
            (complaint.description?.toLowerCase().includes(query)) ||
            (complaint.type?.toLowerCase().includes(query))||
            (complaint.id?.toString().includes(query))  
            const matchesPriority = selectedPriority === "All" || complaint.priority === selectedPriority
            const matchesStatus = selectedStatus === "All" || complaint.status === selectedStatus
            return matchesSearch && matchesPriority && matchesStatus
        })
    }, [complaints, searchTerm, selectedPriority, selectedStatus])

    const priorityStyles = {
        Critical: 'bg-rose-50 text-rose-700 border-rose-200/60',
        High:     'bg-amber-50 text-amber-700 border-amber-200/60',
        Medium:   'bg-blue-50 text-blue-700 border-blue-200/60',
        Low:      'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    }
    const statusStyles = {
        Resolved:    'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    }

    useEffect(() => {
        const handleOutsideClick = () => setActiveMenuId(null);
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []); 

    const handleUpdateStatus = async (id, newStatus) => {
        try {
           await API.complaints.update(id, { status: newStatus });
           setComplaints((prev) =>
               prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
           );
        } catch (err) {
           console.error('Failed to update complaint status:', err);
        }
    };
    const complaintColumns = [
        {
            header: "Reference",
            render: (complaint)=> (
                <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                        {complaint.reference}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400 truncate max-w-[140px]" title={complaint.id}>
                        {complaint.id}
                    </span>
                </div>
            )
        },
        {
            header: 'Customer & Date',
            render: (complaint) => {
                const date = complaint.createdAt?
                    new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '--';
                return (
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                            {complaint.customerName || 'Customer'}
                        </span>
                        <span className="text-[11px] text-gray-400">
                            {date}
                        </span>
                    </div>
                )
            }
        },
        {
            header: 'Type',
            render: (complaint) => (
                <div className="max-w-xs py-1">
                    <span className="font-semibold text-gray-900 text-sm block">
                        {complaint.type}
                    </span>
                    <span className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {complaint.description}
                    </span>
                </div>
            )
        },
        {
            header: "Priority",
            render: (complaint)=> {
                const p = complaint.priority || 'Medium';
                return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${priorityStyles[p] 
                        || priorityStyles.Medium}`}>
                        {p}
                    </span>
                )
            }
        },
        {
            header: "Status",
            render: (complaint) => {
                const s = complaint.status || 'Open';
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium  ${statusStyles[s] || statusStyles.Open}`}>
                        {s}
                    </span>
                )
            }
        },
        {
            header: 'Actions',
            headerAlign: 'text-right',
            cellClassName: 'text-right whitespace-nowrap',
            render: (complaint) => (
            <div 
                className="relative inline-block text-left" 
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === complaint.id ? null : complaint.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Complaint options"
                >
                    <ThreeDotsVertical size={15} />
                </button>

                {activeMenuId === complaint.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30 text-xs grid">
                        {complaint.status !== 'Resolved' && (
                            <button
                                onClick={() => {
                                    handleUpdateStatus(complaint.id, 'Resolved');
                                    setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-emerald-600 hover:bg-emerald-50 transition-colors font-medium"
                            >
                                Mark Resolved
                            </button>
                        )}
                        {complaint.status === 'Open' && (
                            <button
                                onClick={() => {
                                    handleUpdateStatus(complaint.id, 'In Progress');
                                    setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-amber-600 hover:bg-amber-50 transition-colors font-medium"
                            >
                                Mark In Progress
                            </button>
                        )}
                        {complaint.status === 'Resolved' && (
                            <button
                                onClick={() => {
                                    handleUpdateStatus(complaint.id, 'Open');
                                    setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                            >
                                Reopen
                            </button>
                        )}
                    </div>
                )}
            </div>
            )
        }
    ]

    return (
        <div className="p-1 bg-gray-100 min-h-screen">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
                <div className="mb-4 left-full">
                    <h1 className="text-2xl font-bold">Complaints Management</h1>
                    <p className="text-lg font-light text-gray-500 mb-2">Track, escalate, and resolve customer issues globally.</p>
                </div>
            </div>
            {/* complaints table */}
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
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 text-sm text-gray-700 py-2 pl-3.5 pr-8 rounded-lg outline-none cursor-pointer focus:border-orange-500"
                                >
                                    <option value="All Priorities">All Priorities</option>
                                    <option value="Critical">Critical</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                        </div>
                        <div className="relative">
                            <select 
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 text-sm text-gray-700 py-2 pl-3.5 pr-8 rounded-lg outline-none cursor-pointer focus:border-orange-500"
                                >
                                    <option value="All Statuses">All Statuses</option>
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                        </div>
                    </div>
                </div>
                <AdminTable
                    columns={complaintColumns}
                    data={filteredComplaints}
                    isLoading={loading}
                    loadingMessage="Loading complaints..."
                    emptyMessage="No complaints found."
                    error={error}
                />
            </div>
        </div>
    )
}