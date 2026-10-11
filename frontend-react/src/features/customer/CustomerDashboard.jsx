import StatCard from "../../components/customer/StatCard";
import LiveTrackingCard from "../../components/customer/LiveTrackingCard";
import RecentActivity from "../../components/customer/RecentActivity";

export default function CustomerDashboard(){
    const activeOrder={
        id: 'TRK-CD12EF34',
        address: 'ABC, 89 Street',
        status: 'Assigned',
        agent: 'Assigned',
        date: 'Sep 18',
    }
    const recentList=[
        { id: 'TRK-UV34WX56', address: 'A2b road , 88 nagar', status: 'CANCELLED' },
        { id: 'TRK-CD12EF34', address: '45, Ram nagar', status: 'ASSIGNED' },
        { id: 'TRK-EF78GH90', address: '8, Lajpat Nagar ', status: 'PENDING' },
        { id: 'TRK-XK29BL7M', address: '42, Mayalapur, Chennai', status: 'DELIVERED' },
    ]

    return(
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Welcome back</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <StatCard label="ACTIVE SHIPMENTS" value={3} />
                <StatCard label="DELIVERED" value={1} />
                <StatCard label="SUPPORT TICKETS" value={0}/>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <LiveTrackingCard order={activeOrder}></LiveTrackingCard>
                <RecentActivity activities={recentList}></RecentActivity>
            </div>
        </div>
    )
}
