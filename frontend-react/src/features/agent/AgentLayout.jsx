import { Outlet } from 'react-router-dom';
import Sidebar, { SidebarItem } from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { 
    Speedometer2, 
    BoxSeam, 
    ClockHistory, 
    ExclamationTriangle, 
    Person 
} from 'react-bootstrap-icons';

export default function AgentLayout() {
    const currentUser = {
        name: "JS",
        role: "Delivery Agent"
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar user={currentUser}>
                <SidebarItem icon={<Speedometer2 size={20} />} text="Dashboard" to="/agent/dashboard" />
                <SidebarItem icon={<BoxSeam size={20} />} text="My Deliveries" to="/agent/worklist" />
                <SidebarItem icon={<ClockHistory size={20} />} text="Delivery History" to="/agent/history" />
                <SidebarItem icon={<ExclamationTriangle size={20} />} text="Report Issue" to="/agent/report-issue" />
                <SidebarItem icon={<Person size={20} />} text="Profile" to="/agent/profile" />
            </Sidebar>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-100">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}