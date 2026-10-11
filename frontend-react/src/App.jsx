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
      
      <Route path='/customer' element={<CustomerLayout></CustomerLayout>}>
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />        
      </Route>
    </Routes>
  );
}