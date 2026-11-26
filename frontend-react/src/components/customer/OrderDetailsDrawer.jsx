import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, GeoAltFill, BoxSeam, Truck, CheckCircleFill, CurrencyRupee, ExclamationCircle, Person } from 'react-bootstrap-icons';
import StatusBadge from './StatusBadge';

const TIMELINE_STAGES = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'assigned', label: 'Assigned to Agent' },
    { key: 'pickedup', label: 'Picked Up' },
    { key: 'intransit', label: 'In Transit' },
    { key: 'outfordelivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' }
];

function getStageIndex(status) {
    const s = (status || '').toLowerCase().replace(/[\s_-]/g, '');
    if (s.includes('deliver')) return 5;
    if (s.includes('out')) return 4;
    if (s.includes('transit')) return 3;
    if (s.includes('pick')) return 2;
    if (s.includes('assign')) return 1;
    return 0; // pending
}

export default function OrderDetailsDrawer({ order, onClose }) {
    const navigate = useNavigate();

    // Close drawer on pressing Escape key (Side Effect / useEffect)
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!order) return null;

    const isCancelled = (order.status || '').toLowerCase().includes('cancel');
    const currentIndex = getStageIndex(order.status);

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Dark Backdrop (clicking closes drawer) */}
            <div 
                onClick={onClose}
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            />

            {/* Slide-out Drawer Container */}
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-900">
                                {order.trackingId || order.id}
                            </h2>
                            <StatusBadge status={order.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Order ID: <span className="font-mono">{order.id}</span>
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                        title="Close Drawer (Esc)"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-6 flex-1">
                    {/* Status Stepper Progression */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                            Delivery Progress
                        </h3>

                        {isCancelled ? (
                            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2 font-medium">
                                <ExclamationCircle size={18} />
                                This order was cancelled.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {TIMELINE_STAGES.map((stage, idx) => {
                                    const isDone = idx <= currentIndex;
                                    const isCurrent = idx === currentIndex;

                                    return (
                                        <div key={stage.key} className="flex items-start gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                                    isDone 
                                                        ? 'bg-orange-500 text-white shadow-xs' 
                                                        : 'bg-gray-200 text-gray-400'
                                                }`}>
                                                    {isDone ? <CheckCircleFill size={14} /> : idx + 1}
                                                </div>
                                                {idx < TIMELINE_STAGES.length - 1 && (
                                                    <div className={`w-0.5 h-6 my-1 ${
                                                        idx < currentIndex ? 'bg-orange-500' : 'bg-gray-200'
                                                    }`} />
                                                )}
                                            </div>

                                            <div className="pt-0.5">
                                                <p className={`text-sm font-semibold ${
                                                    isCurrent ? 'text-orange-600' : isDone ? 'text-gray-900' : 'text-gray-400'
                                                }`}>
                                                    {stage.label}
                                                </p>
                                                {isCurrent && (
                                                    <p className="text-xs text-orange-500 font-medium mt-0.5">
                                                        Current Status
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Delivery & Routing Info */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Shipment Details
                        </h3>

                        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-xs">
                            <div className="flex items-start gap-3">
                                <GeoAltFill className="text-orange-500 mt-1 shrink-0" size={16} />
                                <div>
                                    <span className="text-xs text-gray-400 block font-medium">Delivery Destination</span>
                                    <p className="text-sm font-semibold text-gray-800">{order.deliveryAddress}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-50 pt-2 flex items-start gap-3">
                                <BoxSeam className="text-blue-500 mt-1 shrink-0" size={16} />
                                <div>
                                    <span className="text-xs text-gray-400 block font-medium">Package Information</span>
                                    <p className="text-sm font-medium text-gray-700">
                                        {order.packageType} &bull; {order.weight} kg &bull; <span className="capitalize">{order.serviceLevel} Service</span>
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-gray-50 pt-2 flex items-start gap-3">
                                <Person className="text-emerald-500 mt-1 shrink-0" size={16} />
                                <div>
                                    <span className="text-xs text-gray-400 block font-medium">Assigned Delivery Agent</span>
                                    <p className="text-sm font-medium text-gray-700">{order.assignedAgent || 'Awaiting assignment'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Backend Authoritative Payment Summary */}
                    <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs text-orange-800 font-semibold uppercase block">
                                    Total Amount ({order.paymentMode})
                                </span>
                                <span className="text-2xl font-black text-gray-900 flex items-center mt-0.5">
                                    <CurrencyRupee size={20} />{order.amount}
                                </span>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-white border border-orange-200 text-orange-600 shadow-xs">
                                {order.paymentStatus}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 sticky bottom-0">
                    <button
                        onClick={() => navigate(`/customer/support?orderId=${order.trackingId || order.id}`)}
                        className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-white transition-colors cursor-pointer text-center"
                    >
                        Report an Issue
                    </button>
                    <button
                        onClick={() => navigate(`/customer/tracking?id=${order.trackingId || order.id}`)}
                        className="flex-1 py-2.5 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer text-center shadow-xs"
                    >
                        Live Tracking View →
                    </button>
                </div>
            </div>
        </div>
    );
}
