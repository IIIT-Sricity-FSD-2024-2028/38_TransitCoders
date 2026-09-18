import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import Home from './components/Home.jsx';

// Feature pages — one per team member (Lab 2: only hub/dispatch is implemented)
import Login from './features/auth/Login.jsx';
import CustomerDashboard from './features/customer/CustomerDashboard.jsx';
import MerchantBook from './features/merchant/MerchantBook.jsx';
import DeliveryWorklist from './features/delivery/DeliveryWorklist.jsx';
import Dispatch from './features/hub/Dispatch.jsx';
import AdminUsers from './features/admin/AdminUsers.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/merchant/book" element={<MerchantBook />} />
        <Route path="/delivery/worklist" element={<DeliveryWorklist />} />
        <Route path="/hub/dispatch" element={<Dispatch />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}