import { Outlet } from 'react-router-dom';
import Sidebar, { SidebarItem } from '../../components/layout/Sidebar';
import { LayoutTextWindow, People, Gear } from 'react-bootstrap-icons';

export default function AdminLayout() {
    const currentUser = { name: "Shazil", role: "Super User" };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar user={currentUser}>
                <SidebarItem icon={<LayoutTextWindow size={20} />} text="Dashboard" to="/admin/dashboard" />
                <SidebarItem icon={<People size={20} />} text="User Management" to="/admin/users" />
                <SidebarItem icon={<Gear size={20} />} text="Settings" to="/admin/settings" />
            </Sidebar>
            
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet /> 
            </main>
        </div>
    );
}