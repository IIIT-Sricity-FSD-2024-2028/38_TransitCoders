import { Outlet } from 'react-router-dom';
import Sidebar, { SidebarItem } from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { LayoutTextWindow, People, Gear, ShieldCheck, Cpu, GraphUp, ChatSquareText, Folder, ShieldFillCheck, ExclamationTriangle, ShieldX, Shield, FileEarmarkText } from 'react-bootstrap-icons';

export default function AdminLayout() {
    const currentUser = { name: "Super Admin", role: "Super User" };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar user={currentUser}>
                <SidebarItem icon={<LayoutTextWindow size={20} />} text="Dashboard" to="/admin/dashboard" />
                <SidebarItem icon={<People size={20} />} text="User Management" to="/admin/users" />
                <SidebarItem icon={<Gear size={20} />} text="System Configuration" to="/admin/system-configuration" />
                <SidebarItem icon={<ShieldCheck size={20} />} text="Roles & Permissions" to="/admin/roles&permissions" />
                {/* <SidebarItem icon={<Folder size={20} />} text="Database Management" to="/admin/database" /> */}
                <SidebarItem icon={<Cpu size={20} />} text="Operations Monitoring" to="/admin/operations" />
                <SidebarItem icon={<GraphUp size={20} />} text="Reports & Analytics" to="/admin/reports" />
                {/* <SidebarItem icon={<FileEarmarkText size={20} />} text="Security Logs" to="/admin/security-logs" /> */}
                <SidebarItem icon={<ExclamationTriangle size={20} />} text="Complaints Management" to="/admin/complaints" />
                <SidebarItem icon={<ChatSquareText size={20} />} text="Feedback Review" to="/admin/feedback" />
            </Sidebar>
            <div className="flex-1 flex flex-col overflow-hidden">
                <div>
                    <Topbar />
                </div>
                <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}