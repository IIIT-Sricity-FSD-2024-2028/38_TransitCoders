import Sidebar,{SidebarItem} from "../../components/layout/Sidebar";
import { Outlet } from 'react-router-dom';
import { Grid, GeoAlt, BoxSeam, Headset } from 'react-bootstrap-icons';

function CustomerLayout(){
    const currentUser={name: "Aarav Sharma", role: "Customer"};
    return(
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar user={currentUser}>
                <SidebarItem icon={<Grid size={20} />} text="Dashboard" to="/customer/dashboard" />
                <SidebarItem icon={<GeoAlt size={20} />} text="Live Tracking" to="/customer/tracking" />
                <SidebarItem icon={<BoxSeam size={20} />} text="My Orders" to="/customer/orders" />
                <SidebarItem icon={<Headset size={20} />} text="Help & Support" to="/customer/support" />
            </Sidebar>
            <main className="flex-1 p-8 overflow-y-auto bg-gray-100">
                <Outlet />
            </main>
        </div>
    )
}
export default CustomerLayout