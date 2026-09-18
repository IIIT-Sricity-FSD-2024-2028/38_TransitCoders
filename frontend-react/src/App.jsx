import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './features/admin/AdminLayout';
import AdminDashboard from './features/admin/AdminDashboard';
import CustomerDashboard from './features/customer/CustomerDashboard';
const Users = () => <h1 className="text-2xl font-bold text-gray-800">User Management Content</h1>;
const Settings = () => <h1 className="text-2xl font-bold text-gray-800">Settings Content</h1>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/customer/dashboard" element={<CustomerDashboard></CustomerDashboard>}></Route>      

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}