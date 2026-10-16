import { useState, useEffect } from "react";
import StatCard from "../../components/customer/StatCard";
import LiveTrackingCard from "../../components/customer/LiveTrackingCard";
import RecentActivity from "../../components/customer/RecentActivity";
import { customerService } from "../../services/customerService";

export default function CustomerDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchDashboard() {
            try {
                setLoading(true);
                const data = await customerService.getDashboardData();
                if (isMounted) setDashboardData(data);
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchDashboard();
        return () => { isMounted = false; };
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Connecting to SwiftTrack backend...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 animate-pulse h-24" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-64" />
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-64" />
                </div>
            </div>
        );
    }

    const { stats, activeOrder, recentOrders } = dashboardData || {
        stats: { activeShipments: 0, delivered: 0, supportTickets: 0 },
        activeOrder: null,
        recentOrders: []
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Welcome back! Live overview of your shipments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="ACTIVE SHIPMENTS" value={stats.activeShipments} />
                <StatCard label="DELIVERED" value={stats.delivered} />
                <StatCard label="SUPPORT TICKETS" value={stats.supportTickets} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeOrder ? (
                    <LiveTrackingCard order={activeOrder} />
                ) : (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
                        No active shipments right now.
                    </div>
                )}
                <RecentActivity activities={recentOrders} />
            </div>
        </div>
    );
}
