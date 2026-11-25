import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RequireRole from './RequireRole';
import LandingPage from './features/LandingPage';
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLayout from './features/admin/AdminLayout';
import CustomerLayout from './features/customer/CustomerLayout';
import MerchantLayout from './features/merchant/MerchantLayout';
import AgentLayout from './features/agent/AgentLayout';
import HubManagerLayout from "./features/hub-manager/HubManagerLayout";

const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./features/admin/UserManagement'));
const SystemConfiguration = lazy(() => import('./features/admin/SystemConfiguration'));
const ComplaintsManagement = lazy(() => import('./features/admin/ComplaintsManagement'));
const FeedbackReview = lazy(() => import('./features/admin/FeedbackReview'));
const MerchantTickets = lazy(() => import('./features/admin/MerchantTickets'));
const ReportsAnalytics = lazy(() => import('./features/admin/ReportsAnalytics'));
const FinancialAnalytics = lazy(() => import('./features/admin/FinancialAnalytics'));
const CustomerDashboard = lazy(() => import('./features/customer/CustomerDashboard'));
const CustomerOrders = lazy(() => import('./features/customer/CustomerOrders'));
const CustomerTracking = lazy(() => import('./features/customer/CustomerTracking'));
const CustomerSupport = lazy(() => import('./features/customer/CustomerSupport'));
const MerchantDashboard = lazy(() => import('./features/merchant/MerchantDashboard'));
const BookShipment = lazy(() => import('./features/merchant/BookShipment'));
const MerchantOrders = lazy(() => import('./features/merchant/MerchantOrders'));
const TrackShipment = lazy(() => import('./features/merchant/TrackShipment'));
const AnalyticsReport = lazy(() => import('./features/merchant/AnalyticsReport'));
const MerchantSupport = lazy(() => import('./features/merchant/MerchantSupport'));
const AgentDashboard = lazy(() => import('./features/agent/AgentDashboard'));
const AgentWorklist = lazy(() => import('./features/agent/AgentWorklist'));
const DeliveryHistory = lazy(() => import('./features/agent/DeliveryHistory'));
const ReportIssue = lazy(() => import("./features/agent/ReportIssue"));
const AgentProfile = lazy(() => import('./features/agent/AgentProfile'));
const DashBoard = lazy(() => import('./features/hub-manager/DashBoard'));
const OrderQueue = lazy(() => import("./features/hub-manager/OrderQueue"));
const Warehouse = lazy(() => import("./features/hub-manager/Warehouse"));
const Dispatch = lazy(() => import("./features/hub-manager/Dispatch"));
const HubTransfer = lazy(() => import("./features/hub-manager/HubTransfer"));
const Reports = lazy(() => import("./features/hub-manager/Reports"));

export default function App() {
  return (
    <Suspense fallback={<p role="status" className="p-5 text-sm text-gray-600">Loading page…</p>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireRole roles={['super_user', 'admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="system-configuration" element={<SystemConfiguration />} />
            <Route path="complaints" element={<ComplaintsManagement />} />
            <Route path="feedback" element={<FeedbackReview />} />
            <Route path="tickets" element={<MerchantTickets />} />
            <Route path="reports" element={<ReportsAnalytics />} />
            <Route path="financials" element={<FinancialAnalytics />} />
          </Route>
        </Route>

        <Route element={<RequireRole roles={['customer']} />}>
          <Route path='/customer' element={<CustomerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="orders" element={<CustomerOrders />} />
            <Route path="tracking" element={<CustomerTracking />} />
            <Route path="support" element={<CustomerSupport />} />
          </Route>
        </Route>

        <Route element={<RequireRole roles={['hub_manager']} />}>
          <Route path="/hub" element={<HubManagerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashBoard />} />
            <Route path="queue" element={<OrderQueue />} />
            <Route path="dispatch" element={<Dispatch />} />
            <Route path="transfer" element={<HubTransfer />} />
            <Route path="warehouse" element={<Warehouse />} />
            <Route path="reports" element={<Reports />} />
            <Route path="complaints" element={<ComplaintsManagement />} />
          </Route>
        </Route>

        <Route element={<RequireRole roles={['merchant']} />}>
          <Route path="/merchant" element={<MerchantLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MerchantDashboard />} />
            <Route path="book" element={<BookShipment />} />
            <Route path="orders" element={<MerchantOrders />} />
            <Route path="track" element={<TrackShipment />} />
            <Route path="analytics" element={<AnalyticsReport />} />
            <Route path="support" element={<MerchantSupport />} />
          </Route>
        </Route>

        <Route element={<RequireRole roles={['delivery_agent']} />}>
          <Route path="/agent" element={<AgentLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AgentDashboard />} />
            <Route path="worklist" element={<AgentWorklist />} />
            <Route path="history" element={<DeliveryHistory />} />
            <Route path="report-issue" element={<ReportIssue />} />
            <Route path="profile" element={<AgentProfile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
