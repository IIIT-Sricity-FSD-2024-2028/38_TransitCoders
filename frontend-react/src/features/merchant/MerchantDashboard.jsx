import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BoxSeam, 
  CheckCircle, 
  ClockHistory, 
  CurrencyRupee, 
  Plus, 
  ArrowRight,
  Truck,
  ArrowUpRight
} from 'react-bootstrap-icons';
import KPICard from '../../components/shared/KPICard';
import AdminTable from '../../components/admin/AdminTable';
import OrderStatusBadge from '../../components/merchant/OrderStatusBadge';
import ShippingLabelModal from '../../components/merchant/ShippingLabelModal';
import { loadOrders, fetchMerchantOrders, setActiveTracking } from '../../services/merchantHelpers';

/**
 * MerchantDashboard
 * 
 * Main overview dashboard for merchants.
 * Displays KPI summary cards, live fleet status distribution,
 * latest shipment widget, and recent shipments table.
 */
export default function MerchantDashboard() {
  // Orders list, label preview modal state, and backend connection indicator
  const [orders, setOrders] = useState([]);
  const [selectedLabelOrder, setSelectedLabelOrder] = useState(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Load orders on mount (instant local render + live backend API sync)
  useEffect(() => {
    // 1. Instant render from local cache
    const savedOrders = loadOrders();
    setOrders(savedOrders);

    // 2. Fetch live database records from backend API
    let isMounted = true;
    fetchMerchantOrders().then((liveOrders) => {
      if (isMounted && Array.isArray(liveOrders)) {
        setOrders(liveOrders);
        setIsBackendConnected(true);
      }
    }).catch(() => {
      if (isMounted) setIsBackendConnected(false);
    });

    return () => { isMounted = false; };
  }, []);

  // Compute overview metrics and status breakdown
  const total = orders.length;
  const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
  const transit = orders.filter((o) => o.status === 'IN_TRANSIT').length;
  const pending = orders.filter((o) => o.status === 'PENDING').length;
  const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;
  const spend = orders.reduce((acc, o) => acc + (Number(o.price) || 0), 0);

  // Dynamic chart percentages
  const deliveredPct = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const transitPct = total > 0 ? Math.round((transit / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;
  const cancelledPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  // Recent shipments table columns
  const recentColumns = [
    {
      header: 'Tracking / Barcode ID',
      render: (row) => (
        <button
          onClick={() => setSelectedLabelOrder(row)}
          className="font-mono font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1.5 text-left"
          title="Click to view Barcode & Shipping Label"
        >
          <span>{row.trackingNumber || row.id}</span>
        </button>
      ),
    },
    {
      header: 'Recipient',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.recipientName || 'Customer'}</div>
          <div className="text-[11px] text-gray-400">{row.recipientPhone}</div>
        </div>
      ),
    },
    {
      header: 'Route',
      render: (row) => (
        <span className="text-gray-500 text-xs">
          {row.origin || 'Origin'} → {row.destination || 'Destination'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <OrderStatusBadge status={row.status} />,
    },
    {
      header: 'Amount',
      headerAlign: 'text-right',
      cellClassName: 'text-right font-semibold text-gray-900',
      render: (row) => `₹${row.price || 0}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Merchant Overview</h1>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              isBackendConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`}></span>
              {isBackendConnected ? 'BACKEND CONNECTED' : 'LOCAL CACHE MODE'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Real-time dispatch metrics and shipment health</p>
        </div>
        {/* New Shipment CTA */}
        <Link
          to="/merchant/book"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span>New Shipment</span>
        </Link>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="TOTAL SHIPMENTS"
          value={total}
          isicon={true}
          icon={<BoxSeam size={20} />}
          color="bg-orange-50 text-orange-600"
        />
        <KPICard
          title="DELIVERED"
          value={delivered}
          isicon={true}
          icon={<CheckCircle size={20} />}
          color="bg-emerald-50 text-emerald-600"
        />
        <KPICard
          title="IN TRANSIT"
          value={transit}
          isicon={true}
          icon={<Truck size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <KPICard
          title="TOTAL SPEND"
          value={`₹${spend.toLocaleString()}`}
          isicon={true}
          icon={<CurrencyRupee size={20} />}
          color="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* ── Live Visual Status Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Status Progress Bar */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Live Fleet Distribution</h2>
              <p className="text-xs text-gray-400">Current share of active, completed, and pending shipments</p>
            </div>
            <span className="text-xs font-semibold text-gray-500">{total} Total Orders</span>
          </div>

          {/* Segmented live progress bar */}
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${deliveredPct}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Delivered: ${deliveredPct}%`}
            />
            <div
              style={{ width: `${transitPct}%` }}
              className="bg-blue-500 transition-all duration-500"
              title={`In Transit: ${transitPct}%`}
            />
            <div
              style={{ width: `${pendingPct}%` }}
              className="bg-amber-400 transition-all duration-500"
              title={`Pending: ${pendingPct}%`}
            />
            <div
              style={{ width: `${cancelledPct}%` }}
              className="bg-rose-500 transition-all duration-500"
              title={`Cancelled: ${cancelledPct}%`}
            />
          </div>

          {/* Status breakdown legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
              <div className="text-emerald-700 font-bold">{delivered} Orders</div>
              <div className="text-emerald-600 text-[11px]">Delivered ({deliveredPct}%)</div>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100">
              <div className="text-blue-700 font-bold">{transit} Orders</div>
              <div className="text-blue-600 text-[11px]">In Transit ({transitPct}%)</div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100">
              <div className="text-amber-700 font-bold">{pending} Orders</div>
              <div className="text-amber-600 text-[11px]">Pending ({pendingPct}%)</div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100">
              <div className="text-rose-700 font-bold">{cancelled} Orders</div>
              <div className="text-rose-600 text-[11px]">Cancelled ({cancelledPct}%)</div>
            </div>
          </div>
        </div>

        {/* Latest Active Shipment Quick Widget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Latest Active Shipment</h2>
            <p className="text-xs text-gray-400">Click to monitor live delivery GPS</p>
          </div>

          {/* First active shipment or empty placeholder */}
          {orders[0] ? (
            <div className="bg-orange-50/60 border border-orange-200/60 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-sm text-orange-600">{orders[0].trackingNumber}</span>
                <OrderStatusBadge status={orders[0].status} />
              </div>
              <div className="text-xs text-gray-600">
                <p className="font-medium text-gray-900">{orders[0].recipientName}</p>
                <p className="truncate">{orders[0].deliveryAddress}</p>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setSelectedLabelOrder(orders[0])}
                  className="flex-1 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>AWB Barcode</span>
                </button>
                <Link
                  to="/merchant/track"
                  onClick={() => setActiveTracking(orders[0])}
                  className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Live Map</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 text-center py-6">No active shipments</div>
          )}

          <div className="text-[11px] text-gray-400 text-center">
            Synced automatically with central dispatch
          </div>
        </div>

      </div>

      {/* ── Recent Shipments Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Shipments</h2>
            <p className="text-xs text-gray-400">Click any tracking ID to view live route animation</p>
          </div>
          <Link
            to="/merchant/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
          >
            <span>View All ({orders.length})</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Display the 5 most recent shipments */}
        <AdminTable
          columns={recentColumns}
          data={orders.slice(0, 5)}
          isLoading={false}
          emptyMessage="No shipments found."
        />
      </div>

      {/* Barcode & Shipping Label Modal */}
      <ShippingLabelModal
        order={selectedLabelOrder}
        isOpen={Boolean(selectedLabelOrder)}
        onClose={() => setSelectedLabelOrder(null)}
      />
    </div>
  );
}
