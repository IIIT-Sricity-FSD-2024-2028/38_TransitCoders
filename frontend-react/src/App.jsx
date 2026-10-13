import { Routes, Route } from 'react-router-dom';
import RoleSelector from './RoleSelector';

import AdminLayout from './features/admin/AdminLayout';
import AdminDashboard from './features/admin/AdminDashboard';
import UserManagement from './features/admin/UserManagement';
import SystemConfiguration from './features/admin/SystemConfiguration';
import ComplaintsManagement from './features/admin/ComplaintsManagement';
import FeedbackReview from './features/admin/FeedbackReview';
import CustomerLayout from './features/customer/CustomerLayout';
import CustomerDashboard from './features/customer/CustomerDashboard';
import MerchantLayout from './features/merchant/MerchantLayout';
import MerchantDashboard from './features/merchant/MerchantDashboard';
import BookShipment from './features/merchant/BookShipment';
import MerchantOrders from './features/merchant/MerchantOrders';
import TrackShipment from './features/merchant/TrackShipment';
import AnalyticsReport from './features/merchant/AnalyticsReport';
import MerchantSupport from './features/merchant/MerchantSupport';

import AgentLayout from './features/agent/AgentLayout';
import AgentWorklist from './features/agent/AgentWorklist';


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelector />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="system-configuration" element={<SystemConfiguration />} />
        <Route path="complaints" element={<ComplaintsManagement />} />
        <Route path="feedback" element={<FeedbackReview />} />
      </Route>
      
      <Route path='/customer' element={<CustomerLayout />}>
        <Route path="dashboard" element={<CustomerDashboard />} />        
      </Route>

      <Route path="/merchant" element={<MerchantLayout />}>
        <Route path="dashboard" element={<MerchantDashboard />} />
        <Route path="book" element={<BookShipment />} />
        <Route path="orders" element={<MerchantOrders />} />
        <Route path="track" element={<TrackShipment />} />
        <Route path="analytics" element={<AnalyticsReport />} />
        <Route path="support" element={<MerchantSupport />} />
      </Route>
      
      <Route path="/agent" element={<AgentLayout />}>
      <Route path="/agent/dashboard" element={<AdminDashboard />}>
      <Route path="worklist" element={<AgentWorklist />} />
      </Route>
      </Route>

    </Routes>
  );
}