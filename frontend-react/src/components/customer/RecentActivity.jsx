import { useNavigate } from "react-router-dom";

function getBadgeStyle(status) {
    const s = (status || "").toLowerCase();
    if (s.includes("deliver")) return "bg-emerald-50 text-emerald-600";
    if (s.includes("cancel")) return "bg-red-50 text-red-600";
    if (s.includes("transit") || s.includes("out")) return "bg-orange-50 text-orange-600";
    if (s.includes("assign")) return "bg-blue-50 text-blue-600";
    return "bg-amber-50 text-amber-600";
}

export default function RecentActivity(props) {
    const navigate = useNavigate();
    const activities = props.activities || [];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                    <button
                        onClick={() => navigate('/customer/orders')}
                        className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                        View All →
                    </button>
                </div>

                {activities.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">No recent shipment activity.</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {activities.map((item) => {
                            const trackingId = item.trackingId || item.id;
                            const address = item.deliveryAddress || item.address || "Address unavailable";

                            return (
                                <li 
                                    key={item.id || trackingId} 
                                    onClick={() => navigate(`/customer/orders?id=${trackingId}`)}
                                    className="py-3 flex justify-between items-center hover:bg-gray-50/80 px-2 rounded-lg cursor-pointer transition-colors"
                                >
                                    <div>
                                        <strong className="text-sm font-semibold text-orange-600 block">
                                            {trackingId}
                                        </strong>
                                        <p className="text-xs text-gray-500 line-clamp-1 max-w-[220px]">
                                            {address}
                                        </p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getBadgeStyle(item.status)}`}>
                                        {item.status}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}