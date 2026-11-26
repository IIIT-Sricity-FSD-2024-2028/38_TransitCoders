import { useMemo, useState } from 'react';
import { useOrders } from '../../shared/orders/ordersHooks';
import { useTickets } from '../../shared/support/supportHooks';
import { normalizeMerchantOrder, normalizeMerchantTicket } from './merchantSelectors';

/**
 * AnalyticsReport
 * 
 * Merchant shipment analytics and reporting view:
 * - Timeframe selector (Last 30 Days, Last 90 Days, This Year, All Time)
 * - Analytics KPI summary cards (Total, Delivered, In Transit, Revenue)
 * - Top performing shipping routes table computed from database orders
 * - Dispatch issue summary breakdown table computed from database tickets & orders
 */
export default function AnalyticsReport() {
  const [timeframe, setTimeframe] = useState('All Time');
  const [now] = useState(Date.now);

  const {
    data: rawOrders = [],
    isLoading: ordersLoading,
    error: ordersError,
  } = useOrders();
  const {
    data: rawTickets = [],
    isLoading: ticketsLoading,
    error: ticketsError,
  } = useTickets();

  const isLoading = ordersLoading || ticketsLoading;
  const error = ordersError?.message || ticketsError?.message || '';
  const orders = useMemo(() => rawOrders.map(normalizeMerchantOrder), [rawOrders]);
  const tickets = useMemo(() => rawTickets.map(normalizeMerchantTicket), [rawTickets]);

  if (error) return <p role="alert" className="text-red-700">Could not load analytics. {error}</p>;

  // Filter orders by selected timeframe
  const filteredOrders = orders.filter((order) => {
    if (timeframe === 'All Time') return true;
    if (!order.createdAt) return false;

    const orderTime = new Date(order.createdAt).getTime();
    if (Number.isNaN(orderTime)) return false;

    if (timeframe === 'Last 30 Days') {
      return now - orderTime <= 30 * 24 * 60 * 60 * 1000;
    }
    if (timeframe === 'Last 90 Days') {
      return now - orderTime <= 90 * 24 * 60 * 60 * 1000;
    }
    if (timeframe === 'This Year') {
      return new Date(orderTime).getFullYear() === new Date(now).getFullYear();
    }
    return true;
  });

  // Dynamic KPI computations
  const totalShipments = filteredOrders.length;
  const deliveredCount = filteredOrders.filter((o) => o.status === 'DELIVERED').length;
  const inTransitCount = filteredOrders.filter((o) => ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
  const paidShipping = filteredOrders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? Number(o.price) || 0 : 0), 0);

  // Group top routes dynamically from filtered orders
  const routeCounts = {};
  filteredOrders.forEach((o) => {
    const origin = o.origin || 'Origin Hub';
    const dest = o.destination || 'Destination Hub';
    const key = `${origin} → ${dest}`;
    if (!routeCounts[key]) {
      routeCounts[key] = { name: key, count: 0, delivered: 0 };
    }
    routeCounts[key].count += 1;
    if (o.status === 'DELIVERED') {
      routeCounts[key].delivered += 1;
    }
  });

  const routesList = Object.values(routeCounts)
    .map((r) => ({
      ...r,
      successRate: r.count > 0 ? Math.round((r.delivered / r.count) * 100) : 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Dynamic issue and exception breakdown from database orders & tickets
  const issuesList = [];

  // 1. Cancelled orders
  const cancelledOrders = filteredOrders.filter((o) => o.status === 'CANCELLED');
  if (cancelledOrders.length > 0) {
    issuesList.push({
      type: 'Cancelled Shipments',
      count: cancelledOrders.length,
      status: 'Cancelled',
      badgeClass: 'bg-rose-100 text-rose-700',
    });
  }

  // 2. Pending Induction
  const pendingOrders = filteredOrders.filter((o) => o.status === 'PENDING');
  if (pendingOrders.length > 0) {
    issuesList.push({
      type: 'Awaiting Hub Induction',
      count: pendingOrders.length,
      status: 'Processing',
      badgeClass: 'bg-amber-100 text-amber-700',
    });
  }

  // 3. Database Support Tickets
  const ticketCategories = {};
  tickets.forEach((t) => {
    const cat = t.category || 'Support Inquiry';
    ticketCategories[cat] = (ticketCategories[cat] || 0) + 1;
  });

  Object.entries(ticketCategories).forEach(([category, count]) => {
    issuesList.push({
      type: `${category} Ticket`,
      count,
      status: 'Logged',
      badgeClass: 'bg-blue-100 text-blue-700',
    });
  });

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Analytics Report</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Real-time performance metrics computed directly from database orders
          </p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-xs border border-[#E5E7EB] bg-white rounded-lg px-3 py-1.5 font-semibold text-[#111827] outline-none focus:border-[#F97316]"
        >
          <option>All Time</option>
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
          <option>This Year</option>
        </select>
      </div>

      {/* ── Analytics KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-[#111827] font-condensed">
            {isLoading && totalShipments === 0 ? '...' : totalShipments.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">Total Shipments</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-[#059669] font-condensed">
            {isLoading && deliveredCount === 0 ? '...' : deliveredCount.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">Delivered</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-[#2563EB] font-condensed">
            {isLoading && inTransitCount === 0 ? '...' : inTransitCount.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">In Transit</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-[#F97316] font-condensed">
            ₹{paidShipping.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">Paid shipping charges</div>
        </div>
      </div>

      {/* ── Top Routes & Issue Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Routes */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111827]">Top Routes</h2>
            <span className="text-[11px] font-semibold text-[#6B7280]">
              {routesList.length} Active {routesList.length === 1 ? 'Route' : 'Routes'}
            </span>
          </div>
          {routesList.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-[11px] font-bold uppercase text-[#6B7280] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Shipments</th>
                  <th className="px-5 py-3">Delivered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {routesList.map((route, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB]">
                    <td className="px-5 py-3.5 font-medium text-[#111827]">{route.name}</td>
                    <td className="px-5 py-3.5 text-[#6B7280]">{route.count}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        route.successRate >= 90
                          ? 'bg-[#D1FAE5] text-[#059669]'
                          : route.successRate >= 70
                          ? 'bg-[#FEF3C7] text-[#D97706]'
                          : 'bg-[#FEE2E2] text-[#DC2626]'
                      }`}>
                        {route.delivered}/{route.count} ({route.successRate}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-xs text-[#6B7280]">
              No shipping route data available in database yet.
            </div>
          )}
        </div>

        {/* Issue Summary */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111827]">Exceptions & Ticket Summary</h2>
            <span className="text-[11px] font-semibold text-[#6B7280]">
              {issuesList.length} {issuesList.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          {issuesList.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-[11px] font-bold uppercase text-[#6B7280] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Count</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {issuesList.map((issue, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB]">
                    <td className="px-5 py-3.5 font-medium text-[#111827]">{issue.type}</td>
                    <td className="px-5 py-3.5 text-[#6B7280]">{issue.count}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${issue.badgeClass}`}>
                        {issue.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-xs text-emerald-600 font-medium">
              ✓ No active issues, tickets, or cancellations recorded in database.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
