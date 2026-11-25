import { useMemo } from 'react';
import { People, ClockHistory, ExclamationTriangle, ShieldCheck } from 'react-bootstrap-icons';
import KPICard from '../../components/shared/KPICard';
import { isActiveOrder } from '../../services/orderStatus';
import { useUsers } from './adminHooks';
import { useOrders } from '../../shared/orders/ordersHooks';
import { useComplaints } from '../../shared/support/supportHooks';
import { useHubs } from '../../shared/hubs/hubsHooks';
import RecentActivityCard from '../../components/admin/RecentActivityCard';

const AdminDashboard = () => {
    const usersQuery = useUsers();
    const ordersQuery = useOrders();
    const complaintsQuery = useComplaints();
    const hubsQuery = useHubs();

    const error =
        usersQuery.error?.message ||
        ordersQuery.error?.message ||
        complaintsQuery.error?.message ||
        hubsQuery.error?.message ||
        '';

    const {
        users,
        activeShipments,
        openComplaints,
        pendingApprovals,
        dbStatus,
        recentUsers,
        recentComplaints,
        apiLatency,
        activeHubs,
    } = useMemo(() => {
        const usersList = usersQuery.data;
        const shipmentsList = ordersQuery.data;
        const complaintsList = complaintsQuery.data;
        const hubsList = hubsQuery.data;

        const isChecking =
            usersQuery.isLoading ||
            ordersQuery.isLoading ||
            complaintsQuery.isLoading ||
            hubsQuery.isLoading;

        const hasError = Boolean(
            usersQuery.error || ordersQuery.error || complaintsQuery.error || hubsQuery.error,
        );

        let computedDbStatus = 'checking...';
        if (hasError) {
            computedDbStatus = 'disconnected';
        } else if (!isChecking) {
            computedDbStatus = Array.isArray(usersList) && usersList.length > 0 ? 'connected' : 'disconnected';
        }

        const durations = [usersQuery, ordersQuery, complaintsQuery, hubsQuery]
            .filter((q) => q.fulfilledTimeStamp && q.startedTimeStamp)
            .map((q) => q.fulfilledTimeStamp - q.startedTimeStamp);

        const latency = durations.length
            ? `${Math.max(1, Math.round(Math.max(...durations)))} ms`
            : 'Measuring...';

        const sortedUsers = Array.isArray(usersList) && usersList.length > 0
            ? [...usersList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
            : [];

        const sortedComplaints = Array.isArray(complaintsList) && complaintsList.length > 0
            ? [...complaintsList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
            : [];

        return {
            users: Array.isArray(usersList) ? usersList.length : 0,
            pendingApprovals: Array.isArray(usersList) ? usersList.filter((u) => !u.isActive).length : 0,
            dbStatus: computedDbStatus,
            recentUsers: sortedUsers,
            activeShipments: Array.isArray(shipmentsList)
                ? shipmentsList.filter((shipment) => isActiveOrder(shipment.status)).length
                : 0,
            openComplaints: Array.isArray(complaintsList)
                ? complaintsList.filter((c) => c.status === 'Open' || c.status === 'In Progress').length
                : 0,
            recentComplaints: sortedComplaints,
            apiLatency: latency,
            activeHubs: Array.isArray(hubsList)
                ? hubsList.filter((h) => (h.status ? h.status.toLowerCase() === 'active' : true)).length
                : 0,
        };
    }, [usersQuery, ordersQuery, complaintsQuery, hubsQuery]);

  return (
    <div className="p-2 bg-gray-50 min-h-screen">
        {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
        {/*Header Section*/}
        <div className='flex justify-between items-center mb-6 '>
            <div className="felx mb-4 left-full">
                <h1 className="text-2xl font-bold">System Overview</h1>
                <p className="text-lg font-light text-gray-500 mb-2">Real time system health and administration</p>
            </div>
        </div>
        {/* KPI Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <KPICard
                title="Total Users"
                value={users}
                isicon={true}
                iconcolor="bg-blue-50 text-blue-500"
                icon={<People size={22} />}
            />

            {/* Active Shipments */}
            <KPICard
                title="Active Shipments"
                value={activeShipments}
                isicon={true}
                iconcolor="bg-orange-50 text-orange-500"
                icon={<ClockHistory size={22} />}
            />

            {/* Open Complaints */}
            <KPICard
                title="Open Complaints"
                value={openComplaints}
                isicon={true}
                iconcolor="bg-red-50 text-red-500"
                icon={<ExclamationTriangle size={22} />}
            />

            {/* System Health */}
            <KPICard
                title="System Health"
                value="Good"
                isicon={true}
                iconcolor="bg-green-50 text-green-500"
                icon={<ShieldCheck size={22} />}
            />
        </div>
        
        {/* Infrastructure Monitoring Section */}
        <div className="mt-6 bg-white p-6 rounded-md shadow-md">
            <h2 className="text-lg font-semibold mb-4">Infrastructure Monitoring</h2>

            <div className="grid grid-cols-4 gap-4">
                <KPICard
                    title="Database Status"
                    value={dbStatus}
                    isicon={false}
                />
                {/* computed using performance.now() to measure the time taken for API calls */}
                <KPICard
                    title="API Latency"
                    value={apiLatency}
                    isicon={false}
                />
                <KPICard
                    title="Pending Approvals"
                    value={pendingApprovals}
                    isicon={false}
                />
                <KPICard
                    title="Active Hubs"
                    value={activeHubs}
                    isicon={false}
                />
            </div>
        </div>
        {/* Recent Activity Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <RecentActivityCard title="Recent User Activity" viewAllLink="/admin/users">
                {recentUsers.length > 0 ? (
                    recentUsers.map((user) => (
                        <div key={user.id} className="flex justify-between items-center p-2 border-b border-gray-100">
                            <span>{user.name}</span>
                            <span className="text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500">No recent users found.</p>
                )}
            </RecentActivityCard>
            <RecentActivityCard title="Recent Complaints" viewAllLink="/admin/complaints">
                {recentComplaints.length > 0 ? (
                    recentComplaints.map((complaint) => (
                        <div key={complaint.id} className="flex justify-between items-center p-2 border-b border-gray-100">
                            <span>{complaint.type}</span>
                            <span className="text-sm text-gray-500">{(complaint.status)}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500">No recent complaints found.</p>
                )}
            </RecentActivityCard>

        </div>

    </div>
  );
};
export default AdminDashboard;