import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

/**
 * Shared application shell for every role.
 * Responsibilities only: layout + navigation + <Outlet />.
 * Authentication is intentionally NOT implemented yet (Lab 2).
 */
export default function AppShell() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}