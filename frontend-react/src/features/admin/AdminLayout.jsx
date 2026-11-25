import { Outlet } from 'react-router-dom';
import Sidebar, { SidebarItem } from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { LayoutTextWindow, People, Gear, GraphUp, ChatSquareText, Bank, ExclamationTriangle, LifePreserver } from 'react-bootstrap-icons';
import { getSessionUser } from '../../services/session';

export default function AdminLayout() {
    const user = getSessionUser();
    const currentUser = { name: user.name, role: user.role === 'super_user' ? 'Super User' : 'Admin' };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar user={currentUser}>
                <SidebarItem icon={<LayoutTextWindow size={20} />} text="Dashboard" to="/admin/dashboard" />
                <SidebarItem icon={<People size={20} />} text="User Management" to="/admin/users" />
                <SidebarItem icon={<Gear size={20} />} text="System Configuration" to="/admin/system-configuration" />
                <SidebarItem icon={<GraphUp size={20} />} text="Reports & Analytics" to="/admin/reports" />
                <SidebarItem icon={<Bank size={20} />} text="Financial Analytics" to="/admin/financials" />
                <SidebarItem icon={<ExclamationTriangle size={20} />} text="Complaints Management" to="/admin/complaints" />
                <SidebarItem icon={<ChatSquareText size={20} />} text="Feedback Review" to="/admin/feedback" />
            </Sidebar>
            <div className="flex-1 flex flex-col overflow-hidden">
                <div>
                    <Topbar title="Administration" />
                </div>
                <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
