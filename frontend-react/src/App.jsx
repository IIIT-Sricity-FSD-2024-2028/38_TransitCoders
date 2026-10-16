import { Routes, Route } from 'react-router-dom';
import RoleSelector from './RoleSelector';

import AdminLayout from './features/admin/AdminLayout';
import AdminDashboard from './features/admin/AdminDashboard';
import UserManagement from './features/admin/UserManagement';
import SystemConfiguration from './features/admin/SystemConfiguration';
import ComplaintsManagement from './features/admin/ComplaintsManagement';
import FeedbackReview from './features/admin/FeedbackReview';
import ReportsAnalytics from './features/admin/ReportsAnalytics';  
import FinancialAnalytics from './features/admin/FinancialAnalytics';

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
import AgentDashboard from './features/agent/AgentDashboard';
import AgentWorklist from './features/agent/AgentWorklist';
import DeliveryHistory from './features/agent/DeliveryHistory';
import ReportIssue from "./features/agent/ReportIssue";
import AgentProfile from './features/agent/AgentProfile';
import DashBoard from './features/hub-manager/DashBoard';

import Login from "./pages/Login";

// import AgentDashboard from "./components/agent/AgentDashboard"
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      {/* <Route path="/" element={<RoleSelector />} /> */}

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="system-configuration" element={<SystemConfiguration />} />
        <Route path="complaints" element={<ComplaintsManagement />} />
        <Route path="feedback" element={<FeedbackReview />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="financials" element={<FinancialAnalytics />} />
      </Route>
      
      <Route path='/customer' element={<CustomerLayout />}>
        <Route path="dashboard" element={<CustomerDashboard />} />        
      </Route>

      <Route path="/hub/dashboard" element={<DashBoard />} />

      <Route path="/merchant" element={<MerchantLayout />}>
        <Route path="dashboard" element={<MerchantDashboard />} />
        <Route path="book" element={<BookShipment />} />
        <Route path="orders" element={<MerchantOrders />} />
        <Route path="track" element={<TrackShipment />} />
        <Route path="analytics" element={<AnalyticsReport />} />
        <Route path="support" element={<MerchantSupport />} />
      </Route>
      
      <Route path="/agent" element={<AgentLayout />}>
        <Route index element={<AgentDashboard />} />
        <Route path="dashboard" element={<AgentDashboard />} />
        <Route path="worklist" element={<AgentWorklist />} />
        <Route path="history" element={<DeliveryHistory />} />
        <Route path="report-issue" element={<ReportIssue />} />
        <Route path="profile" element={<AgentProfile />} />
      </Route>

    </Routes>
  );
}