import { useState, useEffect } from 'react';
import { Search, ArrowRight, ArrowClockwise, GeoAlt, CheckCircleFill, ClockFill } from 'react-bootstrap-icons';
import OrderStatusBadge from '../../components/merchant/OrderStatusBadge';
import ShippingLabelModal from '../../components/merchant/ShippingLabelModal';
import { loadOrders, findOrder, getActiveTracking, setActiveTracking } from '../../services/merchantHelpers';

/**
 * TrackShipment — Live GPS Satellite Tracking Interface
 * 
 * Shipment tracking view with interactive route vector,
 * telemetry status overlays, and milestone audit logs.
 */
export default function TrackShipment() {
  // Local component state
  const [orders, setOrders] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedLabelOrder, setSelectedLabelOrder] = useState(null);

  // Load orders and pre-selected tracking from localStorage on mount
  useEffect(() => {
    // Load all orders from localStorage
    const savedOrders = loadOrders();
    setOrders(savedOrders);

    // Check if another page pre-selected an order to track
    const activeOrder = getActiveTracking();
    if (activeOrder) {
      setCurrentOrder(activeOrder);
      setSearchInput(activeOrder.trackingNumber || activeOrder.id);
    } else if (savedOrders.length > 0) {
      // Default to first order if nothing pre-selected
      setCurrentOrder(savedOrders[0]);
      setSearchInput(savedOrders[0].trackingNumber || savedOrders[0].id);
    }
  }, []);

  // Search for an order by tracking ID
  function handleSearch(e) {
    e.preventDefault();
    const trackingId = searchInput.trim();
    if (!trackingId) return;

    setIsSearching(true);
    setSearchError(null);

    // Search in local orders store
    const found = findOrder(trackingId);

    if (found) {
      setCurrentOrder(found);
      setActiveTracking(found);
    } else {
      setSearchError(`No tracking records found for ID: ${trackingId}`);
    }

    setIsSearching(false);
  }

  // Quick-select an order chip
  function handleSelectOrder(order) {
    setCurrentOrder(order);
    setSearchInput(order.trackingNumber || order.id);
    setActiveTracking(order);
    setSearchError(null);
  }

  // GPS telemetry marker position based on status
  let markerPos;
  if (currentOrder) {
    if (currentOrder.status === 'DELIVERED') {
      markerPos = { x: 460, y: 160, label: 'Delivered at Destination' };
    } else if (currentOrder.status === 'IN_TRANSIT') {
      markerPos = { x: 320, y: 210, label: 'En-route Highway NH-48' };
    } else if (currentOrder.status === 'CANCELLED') {
      markerPos = { x: 150, y: 280, label: 'Cancelled at Origin' };
    } else {
      markerPos = { x: 200, y: 250, label: 'At Origin Logistics Hub' };
    }
  } else {
    markerPos = { x: 200, y: 250, label: 'No shipment selected' };
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#111827]">Live Satellite Tracking</h1>
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              GPS TRACKING ACTIVE
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">Real-time GPS coordinates and milestone audit stream</p>
        </div>

        {/* Refresh GPS telemetry */}
        {currentOrder && (
          <button
            onClick={() => handleSelectOrder(currentOrder)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <ArrowClockwise size={14} />
            <span>Refresh GPS</span>
          </button>
        )}
      </div>

      {/* ── Tracking ID Search ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2.5">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            {/* Tracking search input */}
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter tracking ID e.g. SWT-2026-98471"
              className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#F97316] font-mono text-[#111827]"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2 bg-[#F97316] hover:bg-[#EA6C0A] disabled:bg-orange-300 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <span>{isSearching ? 'Searching...' : 'Track'}</span>
          </button>
        </form>

        {/* Search error alert */}
        {searchError && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            {searchError}
          </div>
        )}

        {/* Quick select order chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-[#6B7280] pt-1">
          <span className="font-semibold text-gray-400">Saved Shipments:</span>
          {orders.map((o) => (
            <button
              key={o.id}
              onClick={() => handleSelectOrder(o)}
              className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold transition-all ${
                currentOrder?.id === o.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {o.trackingNumber || o.id} • {o.status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active Tracking Results ── */}
      {currentOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Interactive Route Map */}
          <div className="lg:col-span-2 bg-[#E8F0E8] border border-[#E5E7EB] rounded-xl overflow-hidden relative min-h-[420px] flex items-center justify-center shadow-sm">
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 600 400" preserveAspectRatio="none">
              <rect width="600" height="400" fill="#E8F0E8" />
              {/* Roads */}
              <path d="M0 200 Q150 180 300 220 Q450 260 600 200" fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" />
              <path d="M0 200 Q150 180 300 220 Q450 260 600 200" fill="none" stroke="#D4D4AA" strokeWidth="3" strokeDasharray="6,4" />
              <path d="M50 300 Q200 280 350 310 Q450 330 550 320" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
              
              {/* Hub Locations */}
              <rect x="120" y="150" width="60" height="40" rx="4" fill="#C8D8C8" />
              <rect x="350" y="120" width="50" height="35" rx="4" fill="#C8D8C8" />
              <rect x="450" y="230" width="40" height="30" rx="4" fill="#C8D8C8" />
              
              {/* Highway Route */}
              <path
                d="M150 280 Q250 200 320 210 Q400 220 460 160"
                fill="none"
                stroke={currentOrder.status === 'CANCELLED' ? '#EF4444' : '#F97316'}
                strokeWidth="4"
                strokeDasharray="8,5"
              />

              {/* Dynamic GPS Beacon */}
              <g transform={`translate(${markerPos.x}, ${markerPos.y})`}>
                <circle r="14" fill={currentOrder.status === 'CANCELLED' ? '#FEE2E2' : '#FFEDD5'} className="animate-ping" />
                <circle r="9" fill={currentOrder.status === 'CANCELLED' ? '#EF4444' : '#F97316'} />
                <circle r="3.5" fill="#FFFFFF" />
              </g>
            </svg>

            {/* GPS Telemetry Overlay */}
            <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md text-white text-[11px] p-2.5 rounded-lg font-mono space-y-1">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>GPS LOCK ACTIVE</span>
              </div>
              <div className="text-gray-300">Lat: 13.0827° N | Lon: 80.2707° E</div>
              <div className="text-orange-400 font-semibold">{markerPos.label}</div>
            </div>

            {/* Map Overlay Info Card */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div>
                <div className="text-[10px] font-bold text-[#6B7280] uppercase">Tracking Vector</div>
                <div className="font-mono font-bold text-sm text-[#F97316]">{currentOrder.trackingNumber || currentOrder.id}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#6B7280] uppercase mb-0.5">Live Status</div>
                {/* Status Badge */}
                <OrderStatusBadge status={currentOrder.status} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#6B7280] uppercase">Routing Hubs</div>
                <div className="text-xs font-semibold text-[#111827]">
                  {currentOrder.origin} → {currentOrder.destination}
                </div>
              </div>
              <button
                onClick={() => setSelectedLabelOrder(currentOrder)}
                className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Print Barcode Label</span>
              </button>
            </div>
          </div>

          {/* Milestone Audit Trail (1 col) */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <div className="text-sm font-bold text-[#111827]">
                Recipient: <span className="text-[#F97316]">{currentOrder.recipientName}</span>
              </div>
              <div className="text-xs text-[#6B7280] mt-0.5">
                Address: {currentOrder.deliveryAddress}
              </div>
              <div className="text-xs text-[#6B7280]">
                Phone: {currentOrder.recipientPhone}
              </div>
            </div>

            <div className="border-t border-[#E5E7EB] pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Milestone Audit Log</h3>
                <span className="text-[10px] font-semibold text-gray-400">Server Time</span>
              </div>
              
              {/* Milestone Audit Log Timeline */}
              {currentOrder.timeline ? (
                currentOrder.timeline.map((step, idx) => {
                  const isDone = step.status === 'done';
                  const isActive = step.status === 'active';
                  const isCancelled = step.status === 'cancelled';

                  return (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {/* Step status indicator */}
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] ${
                            isDone
                              ? 'bg-emerald-500'
                              : isActive
                              ? 'bg-orange-500 ring-4 ring-orange-100 animate-pulse'
                              : isCancelled
                              ? 'bg-rose-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          {isDone ? '✓' : ''}
                        </div>
                        {idx !== currentOrder.timeline.length - 1 && (
                          <div
                            className={`w-0.5 h-10 my-1 ${
                              isDone ? 'bg-emerald-400' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                      <div className="pb-2">
                        <div
                          className={`text-xs font-bold ${
                            isActive ? 'text-orange-600' : isDone ? 'text-gray-900' : isCancelled ? 'text-rose-600' : 'text-gray-400'
                          }`}
                        >
                          {step.title}
                        </div>
                        <div className="text-[11px] text-[#6B7280]">{step.time}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-gray-400">No milestone data recorded.</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Barcode & Shipping Label Modal */}
      <ShippingLabelModal
        order={selectedLabelOrder}
        isOpen={Boolean(selectedLabelOrder)}
        onClose={() => setSelectedLabelOrder(null)}
      />
    </div>
  );
}
