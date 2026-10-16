import Sidebar, { SidebarItem } from "../../components/layout/Sidebar";
import { Outlet } from 'react-router-dom';
import { Grid, GeoAlt, BoxSeam, Headset } from 'react-bootstrap-icons';

export default function CustomerLayout() {
    const currentUser = { name: "Aarav Sharma", role: "Customer" };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar user={currentUser}>
                <SidebarItem icon={<Grid size={20} />} text="Dashboard" to="/customer/dashboard" />
                <SidebarItem icon={<GeoAlt size={20} />} text="Live Tracking" to="/customer/tracking" />
                <SidebarItem icon={<BoxSeam size={20} />} text="My Orders" to="/customer/orders" />
                <SidebarItem icon={<Headset size={20} />} text="Help & Support" to="/customer/support" />
            </Sidebar>

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Customer Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-base">Customer Portal</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            SwiftTrack Live
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-gray-800 leading-tight">{currentUser.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Verified Customer</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-xs border border-orange-200">
                            AS
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8 overflow-y-auto bg-gray-100">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}