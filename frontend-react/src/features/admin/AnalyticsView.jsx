import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer 
} from 'recharts';
import KPICard from '../../components/shared/KPICard';

export default function AnalyticsView({ data }) {
    if (!data) return <div className="text-gray-500 mt-4">Loading analytics...</div>;

    const hubChartData = Object.entries(data.byHub || {}).map(([hubName, metrics]) => ({
        name: hubName,
        revenue: metrics.revenue,
        orders: metrics.orders
    }));

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard 
                    title="Gross Collections" 
                    value={data.grossCollections} 
                    isCurrency={true} 
                />
                <KPICard 
                    title="Refunds" 
                    value={data.refunds} 
                    isCurrency={true} 
                    valueColor="text-red-500" 
                />
                <KPICard 
                    title="Net Revenue" 
                    value={data.netRevenue} 
                    isCurrency={true} 
                    valueColor="text-blue-600" 
                />
                <KPICard 
                    title="Total Tax/GST" 
                    value={data.totalTax} 
                    isCurrency={true} 
                />
                
                <KPICard 
                    title="Agent Payouts" 
                    value={data.totalAgentPayouts} 
                    isCurrency={true} 
                    valueColor="text-orange-500" 
                />
                <KPICard 
                    title="Operating Expenses" 
                    value={data.totalOperatingExpenses} 
                    isCurrency={true} 
                    valueColor="text-red-500" 
                />
                <KPICard 
                    title="Operating Profit" 
                    value={data.operatingProfit} 
                    isCurrency={true} 
                    valueColor={data.operatingProfit >= 0 ? "text-green-500" : "text-red-500"} 
                />
                <KPICard 
                    title="Profit Margin" 
                    value={`${Number(data.profitMargin).toFixed(2)}%`} 
                    isCurrency={false} 
                    valueColor={data.profitMargin >= 0 ? "text-green-500" : "text-red-500"} 
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Revenue by Hub (Bar Chart) */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Revenue by Hub</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hubChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <Tooltip 
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`₹${value}`, 'Revenue']}
                                />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}