import { Routes, Route } from 'react-router-dom';
import RoleSelector from './RoleSelector';

import AdminLayout from './features/admin/AdminLayout';
import AdminDashboard from './features/admin/AdminDashboard';

import CustomerDashboard from './features/customer/CustomerDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelector />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>

      <Route path="/customer/dashboard" element={<CustomerDashboard />} />
    </Routes>
  );
}