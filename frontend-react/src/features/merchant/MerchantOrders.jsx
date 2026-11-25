import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  XCircle, 
  UpcScan, 
  ArrowUpRight 
} from 'react-bootstrap-icons';
import AdminTable from '../../components/admin/AdminTable';
import OrderStatusBadge from '../../components/merchant/OrderStatusBadge';
import ShippingLabelModal from '../../components/merchant/ShippingLabelModal';
import { fetchMerchantOrders, cancelMerchantOrder } from '../../services/merchantHelpers';

/**
 * MerchantOrders — Order Management & Actions
 * 
 * Order listing and management view for merchants.
 * Supports keyword searching, status filtering, order cancellation,
 * dispatch progression, and shipping label modal preview.
 */
export default function MerchantOrders() {
  // Component state for orders, search, filter, and modal
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLabelOrder, setSelectedLabelOrder] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    let active = true;
    fetchMerchantOrders().then(data => {
      if (active) setOrders(data);
    }, err => {
      if (active) setError(err.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  // Filter orders by search keyword and status
  const filteredOrders = orders.filter((order) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(q)) ||
      (order.recipientName && order.recipientName.toLowerCase().includes(q)) ||
      (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (order.status && order.status.toUpperCase() === statusFilter);

    return matchesSearch && matchesStatus;
  });

  async function handleCancelOrder(order) {
    if (cancelling) return;
    setCancelling(order.backendId);
    setError('');
    try {
      const updated = await cancelMerchantOrder(order.backendId);
      setOrders(previous => previous.map(item => item.backendId === updated.backendId ? updated : item));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(null);
    }
  }

  // AdminTable column definitions
  const orderColumns = [
    {
      header: 'Tracking / Barcode ID',
      render: (row) => (
        <button
          onClick={() => setSelectedLabelOrder(row)}
          className="font-mono font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1.5 group text-left"
          title="Click to view Barcode & Shipping Label"
        >
          <UpcScan size={15} className="text-gray-400 group-hover:text-orange-600 transition-colors" />
          <span>{row.trackingNumber || row.id}</span>
        </button>
      ),
    },
    {
      header: 'Recipient',
      render: (row) => (
        <div 
          onClick={() => setSelectedLabelOrder(row)} 
          className="cursor-pointer group"
          title="Click to view Barcode Label"
        >
          <div className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
            {row.recipientName}
          </div>
          <div className="text-xs text-gray-400">{row.recipientPhone}</div>
        </div>
      ),
    },
    {
      header: 'Destination Address',
      render: (row) => (
        <span 
          onClick={() => setSelectedLabelOrder(row)}
          className="text-gray-500 max-w-xs truncate block text-xs cursor-pointer hover:text-gray-800"
          title="Click to view Barcode Label"
        >
          {row.deliveryAddress}
        </span>
      ),
    },
    {
      header: 'Date',
      render: (row) => <span className="text-gray-400 text-xs">{row.date || 'Recent'}</span>,
    },
    {
      header: 'Status',
      render: (row) => <OrderStatusBadge status={row.status} />,
    },
    {
      header: 'Amount',
      cellClassName: 'font-semibold text-gray-900',
      render: (row) => `₹${row.price || 0}`,
    },
    {
      header: 'Actions',
      headerAlign: 'text-right',
      cellClassName: 'text-right',
      render: (row) => {
        // Status-based actions
        const isCancellable = ['PENDING', 'ASSIGNED'].includes(row.status);

        return (
          <div className="flex items-center justify-end gap-2">
            {/* View Barcode Label Button */}
            <button
              onClick={() => setSelectedLabelOrder(row)}
              className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1"
              title="View & Print Barcode Label"
            >
              <UpcScan size={13} />
              <span>Label</span>
            </button>

            {/* GPS Track Link */}
            <Link
              to={`/merchant/track?id=${encodeURIComponent(row.trackingNumber || row.id)}`}
              className="px-2 py-1 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors flex items-center gap-1"
              title="Live GPS Track"
            >
              <ArrowUpRight size={11} />
              <span>Track</span>
            </Link>

            {/* Cancel order button */}
            {isCancellable && (
              <button
                onClick={() => handleCancelOrder(row)}
                disabled={Boolean(cancelling)}
                className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors flex items-center gap-1"
                title="Cancel Shipment"
              >
                <XCircle size={12} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Shipments</h1>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {orders.length} Total
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Click on any order or tracking ID to view and print its official Barcode Shipping Label
          </p>
        </div>
        <Link
          to="/merchant/book"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus size={18} />
          <span>Book Shipment</span>
        </Link>
      </div>

      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}

      {/* ── Card with Search, Filter & AdminTable ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        {/* Search and status filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            {/* Search Input */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, name, city..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'FAILED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === s
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Shipments Data Table */}
        <AdminTable
          columns={orderColumns}
          data={filteredOrders}
          isLoading={loading}
          emptyMessage="No shipments found matching your filters."
        />
      </div>

      {/* ── Barcode & Shipping Label Modal ── */}
      <ShippingLabelModal
        order={selectedLabelOrder}
        isOpen={Boolean(selectedLabelOrder)}
        onClose={() => setSelectedLabelOrder(null)}
      />
    </div>
  );
}
