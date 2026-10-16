import { X, GeoAltFill, Compass, TelephoneFill, ArrowUpRight, Clock, Truck, ShieldCheck } from 'react-bootstrap-icons';

export default function RouteModal({ isOpen, onClose, order }) {
    if (!isOpen || !order) return null;

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(order.origin || 'Hub Central')}&destination=${encodeURIComponent(order.destination || '')}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase font-bold tracking-wider text-blue-100">Live GPS Routing</span>
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">Fastest Route</span>
                        </div>
                        <h3 className="text-lg font-bold flex items-center gap-2 mt-0.5">
                            <Compass className="animate-spin-slow" /> Directions for #{order.orderId || order.id}
                        </h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 text-sm text-gray-700">
                    {/* Route Metric Pills */}
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                        <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100/60">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Estimated ETA</span>
                            <span className="text-base font-extrabold text-blue-900 mt-0.5 block">{order.eta || '25 mins'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Distance</span>
                            <span className="text-base font-extrabold text-gray-800 mt-0.5 block">{order.distance || '4.2 km'}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Traffic</span>
                            <span className="text-base font-extrabold text-emerald-600 mt-0.5 block">Light</span>
                        </div>
                    </div>

                    {/* Step-by-Step Waypoints */}
                    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:to-rose-500">
                        {/* Origin */}
                        <div className="relative">
                            <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100"></span>
                            <div>
                                <span className="text-[11px] font-bold text-blue-600 uppercase">Pickup Location (Hub)</span>
                                <p className="font-semibold text-gray-900 text-sm">{order.origin || 'Central Hub, Zone 4'}</p>
                                <span className="text-xs text-gray-400">Package dispatched & ready</span>
                            </div>
                        </div>

                        {/* Destination */}
                        <div className="relative">
                            <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100"></span>
                            <div>
                                <span className="text-[11px] font-bold text-rose-600 uppercase">Customer Drop Destination</span>
                                <p className="font-semibold text-gray-900 text-sm">{order.destination}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-600 font-medium">{order.customer}</span>
                                    {order.phone && (
                                        <a 
                                            href={`tel:${order.phone}`} 
                                            className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                                        >
                                            <TelephoneFill size={10} /> {order.phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Safety Notice */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                        <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">Live GPS Telematics Active:</span>
                            <span className="ml-1">Speed and arrival proximity are shared with customer for safe delivery handover.</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                    >
                        Close Route
                    </button>

                    <div className="w-full sm:w-auto flex items-center gap-2">
                        {order.phone && (
                            <a
                                href={`tel:${order.phone}`}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <TelephoneFill size={12} className="text-orange-600" />
                                Call Client
                            </a>
                        )}

                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                        >
                            <ArrowUpRight size={14} />
                            Launch Google Maps
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
