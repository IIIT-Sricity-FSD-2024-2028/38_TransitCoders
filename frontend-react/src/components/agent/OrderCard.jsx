import { GeoAlt, Telephone, Clock, Cash, Truck, CheckCircle } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';

export default function OrderCard({ order ,onAccept,onVerify}) {
    const navigate = useNavigate();

    // Badge styles based on status
    const statusStyles = {
        'pending': 'bg-amber-50 text-amber-700 border-amber-200/70',
        'in-transit': 'bg-blue-50 text-blue-700 border-blue-200/70',
        'delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    };

    // Badge styles based on priority
    const priorityStyles = {
        'High': 'bg-rose-50 text-rose-600 border-rose-200/70',
        'Medium': 'bg-orange-50 text-orange-600 border-orange-200/70',
        'Standard': 'bg-slate-50 text-slate-600 border-slate-200/70',
    };

    const statusKey = order.status?.toLowerCase() || 'pending';
    const priorityKey = order.priority || 'Standard';

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:border-orange-100">
            <div>
                {/* Top Header */}
                <div className="flex justify-between items-start mb-3.5">
                    <div>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Tracking ID</span>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                            {order.id}
                        </h3>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {order.priority && (
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${priorityStyles[priorityKey] || priorityStyles.Standard}`}>
                                {order.priority}
                            </span>
                        )}

                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border capitalize ${statusStyles[statusKey] || statusStyles.pending}`}>
                            {order.status?.replace('-', ' ')}
                        </span>
                    </div>
                </div>

                {/* Customer & Route */}
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-800">{order.customer}</h4>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <Telephone size={12} className="text-gray-400" />
                        <a href={`tel:${order.phone}`} className="hover:text-orange-600 transition-colors">
                            {order.phone}
                        </a>
                    </div>

                    {/* Route details */}
                    <div className="mt-3.5 bg-gray-50/80 rounded-xl p-3 border border-gray-100 space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"></span>
                            <div className="min-w-0">
                                <span className="text-gray-400 font-medium mr-1">From:</span>
                                <span className="text-gray-700 truncate">{order.origin}</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <GeoAlt size={12} className="text-rose-500 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <span className="text-gray-400 font-medium mr-1">To:</span>
                                <span className="text-gray-900 font-medium truncate">{order.destination}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Details / Meta stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 my-4 text-xs">
                    <div className="flex flex-col items-center justify-center p-2 bg-gray-50/50 rounded-xl">
                        <div className="flex items-center gap-1 text-gray-400 mb-0.5">
                            <Clock size={11} />
                            <span className="text-[10px] uppercase font-semibold">ETA</span>
                        </div>
                        <span className="font-semibold text-gray-800 truncate">{order.eta}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 bg-gray-50/50 rounded-xl">
                        <div className="flex items-center gap-1 text-gray-400 mb-0.5">
                            <Cash size={11} />
                            <span className="text-[10px] uppercase font-semibold">Amount</span>
                        </div>
                        <span className="font-bold text-gray-900 truncate">{order.amount}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 bg-gray-50/50 rounded-xl">
                        <div className="flex items-center gap-1 text-gray-400 mb-0.5">
                            <Truck size={11} />
                            <span className="text-[10px] uppercase font-semibold">Dist</span>
                        </div>
                        <span className="font-semibold text-gray-800 truncate">{order.distance}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-1">
                {order.status === 'pending' && (
                    <button
                        onClick={() => onAccept && onAccept(order)}
                        className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm shadow-orange-500/20 cursor-pointer"
                    >
                        Accept Delivery
                    </button>
                )}

                {order.status === 'in-transit' && (
                    <button
                        onClick={() =>  onVerify && onVerify(order)}
                        className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm shadow-blue-600/20 cursor-pointer"
                    >
                        Verify & Complete Delivery
                    </button>
                )}

                {order.status === 'delivered' && (
                    <button
                        disabled
                        className="w-full bg-gray-100 text-gray-400 font-medium py-2.5 px-4 rounded-xl text-sm cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span>Delivered</span>
                    </button>
                )}
            </div>
        </div>
    );
}
