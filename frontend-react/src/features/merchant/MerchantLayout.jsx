import { Outlet } from 'react-router-dom';
import Sidebar, { SidebarItem } from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { MerchantProvider, useMerchant } from '../../services/MerchantContext';
import { 
  LayoutTextWindow, 
  PlusCircle, 
  BoxSeam, 
  Search, 
  GraphUp, 
  QuestionCircle,
  BellFill
} from 'react-bootstrap-icons';

function MerchantLayoutInner() {
  const { orders, liveNotification } = useMerchant();
  const pendingOrTransitCount = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;

  const currentMerchant = { 
    name: "Prasanna Raja", 
    role: "Merchant" 
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* ── Live Toast Notification Banner ── */}
      {liveNotification && (
        <div className="fixed top-4 right-4 z-50 bg-orange-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <BellFill size={14} />
          <span>{liveNotification}</span>
        </div>
      )}

      {/* ── Standard frontend-react Sidebar ── */}
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
          alert={pendingOrTransitCount > 0}
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

      {/* ── Main View Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function MerchantLayout() {
  return (
    <MerchantProvider>
      <MerchantLayoutInner />
    </MerchantProvider>
  );
}
