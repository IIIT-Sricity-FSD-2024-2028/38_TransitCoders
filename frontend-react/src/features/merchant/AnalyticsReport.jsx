import { useState } from 'react';

/**
 * AnalyticsReport
 * 100% Exact Replica of vanilla #view-analytics:
 * - Timeframe dropdown (Last 30 Days, Last 90 Days, This Year)
 * - 4 Analytics KPI Cards (Total, Delivered, In Transit, Revenue)
 * - Top Routes Table (with On-Time percentage badges)
 * - Issue Summary Table (Weather, Address, Damaged, etc. with trends)
 */
export default function AnalyticsReport() {
  const [timeframe, setTimeframe] = useState('Last 30 Days');

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Analytics Report</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">Performance overview for your account</p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-xs border border-[#E5E7EB] bg-white rounded-lg px-3 py-1.5 font-semibold text-[#111827] outline-none focus:border-[#F97316]"
        >
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
          <option>This Year</option>
        </select>
      </div>

      {/* ── Analytics KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-[#111827] font-condensed">1,420</div>
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">Total Shipments</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-[#059669] font-condensed">1,280</div>
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">Delivered</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-[#2563EB] font-condensed">114</div>
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">In Transit</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-[#F97316] font-condensed">₹4,82,500</div>
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">Revenue</div>
        </div>
      </div>

      {/* ── Top Routes & Issue Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Routes */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#E5E7EB]">
            <h2 className="text-sm font-bold text-[#111827]">Top Routes</h2>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] text-[11px] font-bold uppercase text-[#6B7280] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-5 py-3">Route</th>
                <th className="px-5 py-3">Shipments</th>
                <th className="px-5 py-3">On-Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              <tr className="hover:bg-[#F9FAFB]">
                <td className="px-5 py-3.5 font-medium text-[#111827]">Chennai → Bengaluru</td>
                <td className="px-5 py-3.5 text-[#6B7280]">1,240</td>
                <td className="px-5 py-3.5">
                  <span className="bg-[#D1FAE5] text-[#059669] px-2 py-0.5 rounded-full font-bold text-[10px]">98%</span>
                </td>
              </tr>
              <tr className="hover:bg-[#F9FAFB]">
                <td className="px-5 py-3.5 font-medium text-[#111827]">Hyderabad → Visakhapatnam</td>
                <td className="px-5 py-3.5 text-[#6B7280]">890</td>
                <td className="px-5 py-3.5">
                  <span className="bg-[#D1FAE5] text-[#059669] px-2 py-0.5 rounded-full font-bold text-[10px]">95%</span>
                </td>
              </tr>
              <tr className="hover:bg-[#F9FAFB]">
                <td className="px-5 py-3.5 font-medium text-[#111827]">Madurai → Chennai</td>
                <td className="px-5 py-3.5 text-[#6B7280]">640</td>
                <td className="px-5 py-3.5">
                  <span className="bg-[#FEF3C7] text-[#D97706] px-2 py-0.5 rounded-full font-bold text-[10px]">87%</span>
                </td>
              </tr>
              <tr className="hover:bg-[#F9FAFB]">
                <td className="px-5 py-3.5 font-medium text-[#111827]">Bengaluru → Hyderabad</td>
                <td className="px-5 py-3.5 text-[#6B7280]">520</td>
                <td className="px-5 py-3.5">
                  <span className="bg-[#D1FAE5] text-[#059669] px-2 py-0.5 rounded-full font-bold text-[10px]">92%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Issue Summary */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#E5E7EB]">
            <h2 className="text-sm font-bold text-[#111827]">Issue Summary</h2>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] text-[11px] font-bold uppercase text-[#6B7280] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-5 py-3">Issue Type</th>
                <th className="px-5 py-3">Count</th>
                <th className="px-5 py-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              <tr className="hover:bg-[#F9FAFB]">
                <td className="px-5 py-3.5 font-medium text-[#111827]">Weather Delays</td>
                <td className="px-5 py-3.5 text-[#6B7280]">142</td>
                <td className="px-5 py-3.5 font-semibold text-[#EF4444]">▼ 5%</td>
              </tr>
              <tr className="hover:bg-[#F9FAFB]">
                <td className="px-5 py-3.5 font-medium text-[#111827]">Address Issues</td>
                <td className="px-5 py-3.5 text-[#6B7280]">87</td>
                <td className="px-5 py-3.5 font-semibold text-[#10B981]">▲ 2%</td>
              </tr>
              <tr className="hover:bg-[#F9FAFB]">
                <td className="px-5 py-3.5 font-medium text-[#111827]">Damaged Packages</td>
                <td className="px-5 py-3.5 text-[#6B7280]">34</td>
                <td className="px-5 py-3.5 font-semibold text-[#EF4444]">▼ 12%</td>
              </tr>
              <tr className="hover:bg-[#F9FAFB]">
                <td className="px-5 py-3.5 font-medium text-[#111827]">Lost Packages</td>
                <td className="px-5 py-3.5 text-[#6B7280]">7</td>
                <td className="px-5 py-3.5 font-semibold text-[#EF4444]">▼ 30%</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
