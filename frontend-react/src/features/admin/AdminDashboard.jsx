import React, { useEffect,useState } from 'react';
import { People, ClockHistory, ExclamationTriangle, ShieldCheck } from 'react-bootstrap-icons';
import KPICard from '../../components/shared/KPICard';
import API from '../../services/api';

const AdminDashboard = () => {
    const [users, setUsers] =useState(0)
    const [activeShipments, setActiveShipments] = useState(0);
    const [openComplaints, setOpenComplaints] = useState(0);
    const [pendingApprovals, setPendingApprovals] = useState(0);
    const [dbStatus, setDbStatus] = useState('checking...');
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
            } catch (err) {
                console.error("Error fetching data:", err);
                setDbStatus('disconnected');
            }
        }
        loadData();
    }, []);

  return (
    <div className="p-2 bg-gray-100 min-h-screen">
        {/*Header Section*/}
        <div className='flex justify-between items-center mb-6 '>
            <div className="felx mb-4 left-full">
                <h1 className="text-2xl font-bold">System Overview</h1>
                <p className="text-lg font-light text-gray-500 mb-2">Real time system health and administration</p>
            </div>
            <div className="right-full">
                <button 
                onClick={()=>AddNewUser}
                className="bg-orange-500 flex text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">
                    Export full Report
                </button>
            </div>
        </div>
        {/* KPI Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <KPICard
                title="Total Users"
                value={users}
                isicon={true}
                color="bg-blue-50 text-blue-500"
                icon={<People size={22} />}
            />

            {/* Active Shipments */}
            <KPICard
                title="Active Shipments"
                value={activeShipments}
                isicon={true}
                color="bg-orange-50 text-orange-500"
                icon={<ClockHistory size={22} />}
            />

            {/* Open Complaints */}
            <KPICard
                title="Open Complaints"
                value={openComplaints}
                isicon={true}
                color="bg-red-50 text-red-500"
                icon={<ExclamationTriangle size={22} />}
            />

            {/* System Health */}
            <KPICard
                title="System Health"
                value="Good"
                isicon={true}
                color="bg-green-50 text-green-500"
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
            <div className="flex flex-col justify-between">
                <div>
                    <div className="flex flex-row mt-6 bg-white p-4 rounded-md shadow-md justify-between items-center">
                    <h2 className="text-lg font-semibold mb-2">Recent User Activity</h2>
                    <a href="/admin/users" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                    View All
                    </a>
                    </div>

                </div>
            </div>
            <div className="flex flex-col justify-between">
                <div>
                    <div className="flex flex-row mt-6 bg-white p-4 rounded-md shadow-md justify-between items-center">
                    <h2 className="text-lg font-semibold mb-2">Recent complaints</h2>
                    <a href="/admin/complaints" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                    View All
                    </a>
                    </div>

                </div>
            </div>

        </div>

    </div>
  );
};
export default AdminDashboard;