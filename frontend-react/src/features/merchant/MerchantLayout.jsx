import { Outlet } from 'react-router-dom';
import Sidebar, { SidebarItem } from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { 
  LayoutTextWindow, 
  PlusCircle, 
  BoxSeam, 
  Search, 
  GraphUp, 
  QuestionCircle
} from 'react-bootstrap-icons';

/**
 * MerchantLayout
 * 
 * Persistent layout shell for all merchant portal pages.
 * Renders the persistent navigation Sidebar and Topbar with an <Outlet />
 * for child route views.
 */
export default function MerchantLayout() {
  // Current authenticated merchant profile details from database session
  const storedUser = (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (_) {
      return null;
    }
  })();

  const currentMerchant = { 
    name: storedUser?.name || 'Merchant Portal', 
    role: storedUser?.role ? storedUser.role.charAt(0).toUpperCase() + storedUser.role.slice(1) : 'Merchant' 
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Navigation Sidebar */}
      <Sidebar user={currentMerchant}>
        <SidebarItem 
          icon={<LayoutTextWindow size={20} />} 
          text="Dashboard" 
          to="/merchant/dashboard" 
        />
        <SidebarItem 
          icon={<PlusCircle size={20} />} 
          text="Book Shipment" 
          to="/merchant/book" 
        />
        <SidebarItem 
          icon={<BoxSeam size={20} />} 
          text="My Orders" 
          to="/merchant/orders" 
        />
        <SidebarItem 
          icon={<Search size={20} />} 
          text="Track Shipment" 
          to="/merchant/track" 
        />
        <SidebarItem 
          icon={<GraphUp size={20} />} 
          text="Analytics Report" 
          to="/merchant/analytics" 
        />
        <SidebarItem 
          icon={<QuestionCircle size={20} />} 
          text="Support Center" 
          to="/merchant/support" 
        />
      </Sidebar>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        
        {/* <Outlet /> renders whatever child route matches the current URL */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
