import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useMerchant } from '../../services/MerchantContext';
import { useState } from 'react';

/**
 * MerchantDashboard
 * 100% Dynamic & Live:
 * - Subscribed to global useMerchant() context
 * - Updates instantly when any order is booked, cancelled, or advanced
 * - Dynamic charts deriving heights directly from live orders
 */
export default function MerchantDashboard() {
  const navigate = useNavigate();
  const { orders, setActiveTrackingOrder } = useMerchant();
  const [selectedLabelOrder, setSelectedLabelOrder] = useState(null);

  // Dynamic statistics calculated directly from live orders
  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    const transit = orders.filter((o) => o.status === 'IN_TRANSIT').length;
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;
    const spend = orders.reduce((acc, o) => acc + (Number(o.price) || 0), 0);
    return { total, delivered, transit, pending, cancelled, spend };
  }, [orders]);

  // Dynamic chart calculations based on current live orders
  const deliveredPct = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;
  const transitPct = stats.total > 0 ? Math.round((stats.transit / stats.total) * 100) : 0;
  const pendingPct = stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0;
  const cancelledPct = stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0;

  // Recent shipments columns
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
          {row.origin || 'Chennai'} → {row.destination || 'Bengaluru'}
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
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              LIVE DATA
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Real-time dispatch metrics and shipment health</p>
        </div>
        <button
          onClick={() => navigate('/merchant/book')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span>New Shipment</span>
        </button>
      </div>

      {/* ── 4 KPICards (Synchronized live) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="TOTAL SHIPMENTS"
          value={stats.total}
          isicon={true}
          icon={<BoxSeam size={20} />}
          color="bg-orange-50 text-orange-600"
        />
        <KPICard
          title="DELIVERED"
          value={stats.delivered}
          isicon={true}
          icon={<CheckCircle size={20} />}
          color="bg-emerald-50 text-emerald-600"
        />
        <KPICard
          title="IN TRANSIT"
          value={stats.transit}
          isicon={true}
          icon={<Truck size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <KPICard
          title="TOTAL SPEND"
          value={`₹${stats.spend.toLocaleString()}`}
          isicon={true}
          icon={<CurrencyRupee size={20} />}
          color="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* ── Live Visual Status Breakdown (Dynamic Bar & Donut representation) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Status Progress Bar */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Live Fleet Distribution</h2>
              <p className="text-xs text-gray-400">Current share of active, completed, and pending shipments</p>
            </div>
            <span className="text-xs font-semibold text-gray-500">{stats.total} Total Orders</span>
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

          {/* Interactive Legend with Live Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
              <div className="text-emerald-700 font-bold">{stats.delivered} Orders</div>
              <div className="text-emerald-600 text-[11px]">Delivered ({deliveredPct}%)</div>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100">
              <div className="text-blue-700 font-bold">{stats.transit} Orders</div>
              <div className="text-blue-600 text-[11px]">In Transit ({transitPct}%)</div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100">
              <div className="text-amber-700 font-bold">{stats.pending} Orders</div>
              <div className="text-amber-600 text-[11px]">Pending ({pendingPct}%)</div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100">
              <div className="text-rose-700 font-bold">{stats.cancelled} Orders</div>
              <div className="text-rose-600 text-[11px]">Cancelled ({cancelledPct}%)</div>
            </div>
          </div>
        </div>

        {/* Live Tracking Quick Widget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Latest Active Shipment</h2>
            <p className="text-xs text-gray-400">Click to monitor live delivery GPS</p>
          </div>

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
                <button
                  onClick={() => {
                    setActiveTrackingOrder(orders[0]);
                    navigate('/merchant/track');
                  }}
                  className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Live Map</span>
                  <ArrowRight size={12} />
                </button>
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

      {/* ── Table with Declarative React AdminTable ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Shipments</h2>
            <p className="text-xs text-gray-400">Click any tracking ID to view live route animation</p>
          </div>
          <button
            onClick={() => navigate('/merchant/orders')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
          >
            <span>View All ({orders.length})</span>
            <ArrowRight size={14} />
          </button>
        </div>

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
