import { useNavigate } from "react-router-dom";

export default function LiveTrackingCard(props) {
    const navigate = useNavigate();
    const order = props.order;
    if (!order) return null;

    const trackingId = order.trackingId || order.id;
    const address = order.deliveryAddress || order.address || "Destination Address";
    const agent = order.assignedAgent || order.agent || "Assigned Agent";

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3"> 
            <div className="flex items-center justify-between">
                <h1 className="text-xs font-bold text-orange-500 uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    Live tracking
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600">
                    {order.status}
                </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Order #{trackingId}</h2>
            <p className="text-sm text-gray-500">{address}</p>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                <div>
                    <small className="text-gray-400 block text-xs">Status</small>
                    <p className="font-semibold text-gray-800 text-sm">{order.status}</p>
                </div>
                <div>
                    <small className="text-gray-400 block text-xs">Agent</small>
                    <p className="font-semibold text-gray-800 text-sm">{agent}</p>
                </div>
            </div>
            <button 
                onClick={() => navigate(`/customer/tracking?id=${trackingId}`)} 
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 cursor-pointer transition-colors"
            >
                Track Now →
            </button>
        </div>
    );
}