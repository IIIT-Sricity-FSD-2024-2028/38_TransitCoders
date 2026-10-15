import React, { useEffect,useState } from 'react';
import { People, ClockHistory, ExclamationTriangle, ShieldCheck } from 'react-bootstrap-icons';
import KPICard from '../../components/shared/KPICard';
import API from '../../services/api';
import RecentActivityCard from '../../components/admin/RecentActivityCard';

const AdminDashboard = () => {
    const [users, setUsers] =useState(0)
    const [activeShipments, setActiveShipments] = useState(0);
    const [openComplaints, setOpenComplaints] = useState(0);
    const [pendingApprovals, setPendingApprovals] = useState(0);
    const [dbStatus, setDbStatus] = useState('checking...');

    const [recentUsers, setRecentUsers] = useState([]);
    const [recentComplaints, setRecentComplaints] = useState([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [users, shipments, complaints] = await Promise.all([
                    API.users.getAll().catch(() => []),
                    API.shipments.getAll().catch(() => []),
                    API.complaints.getAll().catch(() => []),
                ]);

                if (Array.isArray(users) && users.length > 0) {
                    setUsers(users.length);
                    setPendingApprovals(users.filter((u) => !u.isActive).length);
                    setDbStatus('connected');

                    const sortedUsers = [...users]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5);
                    setRecentUsers(sortedUsers);
                } else {
                    setUsers(0);
                    setPendingApprovals(0);
                    setDbStatus('disconnected');
                }

                setActiveShipments(
                    Array.isArray(shipments)
                        ? shipments.filter((s) => s.status === 'processing' || s.status === 'in-transit').length
                        : 0
                );

                setOpenComplaints(
                    Array.isArray(complaints)
                        ? complaints.filter((c) => c.status === 'Open' || c.status === 'In Progress').length
                        : 0
                );
                if (Array.isArray(complaints) && complaints.length > 0) {
                    const sortedComplaints = [...complaints]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5);
                    setRecentComplaints(sortedComplaints);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setDbStatus('disconnected');
            }
        }
        loadData();
    }, []);

  return (
    <div className="p-2 bg-gray-50 min-h-screen">
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
                <KPICard
                    title="Server Load(CPU)"
                    value="67%"
                    isicon={false}
                />
                <KPICard
                    title="Pending Approvals"
                    value={pendingApprovals}
                    isicon={false}
                />
                <KPICard
                    title="System Alerts"
                    value="0"
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