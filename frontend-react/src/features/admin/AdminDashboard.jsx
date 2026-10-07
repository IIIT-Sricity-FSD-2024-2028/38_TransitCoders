import React from 'react';
import { People, ClockHistory, ExclamationTriangle, ShieldCheck } from 'react-bootstrap-icons';

const AdminDashboard = () => {
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
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                    <People size={22} />
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
            </div>

            {/* Active Shipments */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                    <ClockHistory size={22} />
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500">Active Shipments</p>
                    <p className="text-2xl font-bold text-gray-900">1,248</p>
                </div>
            </div>

            {/* Open Complaints */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <ExclamationTriangle size={22} />
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500">Open Complaints</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
            </div>

            {/* System Health */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                    <ShieldCheck size={22} />
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500">System Health</p>
                    <p className="text-2xl font-bold text-gray-900">99.9%</p>
                </div>
            </div>
        </div>
        
        {/* Infrastructure Monitoring Section */}
        <div className="mt-6 bg-white p-4 rounded-md shadow-md">
            <h2 className="text-lg font-semibold mb-2">Infrastructure Monitoring</h2>

            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-md shadow-md">
                    <h3 className="text-lg text-gray-500 mb-2">Database Status</h3>
                    <p className="text-xl font-light">connected</p>
                </div>  
                <div className="bg-white p-4 rounded-md shadow-md">
                    <h2 className="text-lg text-gray-500 mb-2">Server Load(CPU)</h2>
                    <p className="text-xl font-light">67%</p>
                </div>
                <div className="bg-white p-4 rounded-md shadow-md">
                    <h2 className="text-lg text-gray-500 mb-2">Pending Approvals</h2>
                    <p className="text-xl font-light">45ms</p>
                </div>
                <div className="bg-white p-4 rounded-md shadow-md">
                    <h2 className="text-lg text-gray-500 mb-2">System Alerts</h2>
                    <p className="text-xl font-light">0</p>
                </div>
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