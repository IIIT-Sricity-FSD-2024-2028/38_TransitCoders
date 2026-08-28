  import { NavLink } from 'react-router-dom';
import {
  IconLogoTruck,
  IconHome,
  IconUser,
  IconBox,
  IconTruck,
  IconShield,
  IconLogout,
} from '../icons.jsx';

/**
 * Shared sidebar — mirrors the vanilla app's sidebar markup/classes
 * (renderSidebar in front-end/hub-manager/js/hub-manager.js).
 * One navigation entry per role route; teammates add their own
 * feature links under their role section.
 */
const navSections = [
  {
    items: [{ to: '/', label: 'Home', icon: <IconHome />, end: true }],
  },
  {
    label: 'Customer',
    items: [
      { to: '/customer/dashboard', label: 'Dashboard', icon: <IconUser /> },
    ],
  },
  {
    label: 'Merchant',
    items: [{ to: '/merchant/book', label: 'Book Shipment', icon: <IconBox /> }],
  },
  {
    label: 'Delivery Agent',
    items: [{ to: '/delivery/worklist', label: 'My Worklist', icon: <IconTruck /> }],
  },
  {
    label: 'Hub Manager',
    items: [
      { to: '/hub/dispatch', label: 'Dispatch & Assignment', icon: <IconTruck /> },
    ],
  },
  {
    label: 'Admin',
    items: [{ to: '/admin/users', label: 'Manage Users', icon: <IconShield /> }],
  },
];

export default function Sidebar() {
  // Static user until authentication is implemented in a later lab
  const user = { name: 'Vinod', role: 'Hub Manager' };
  const initials = 'VK';

  return (
    <aside className="sidebar">
      <NavLink to="/" className="sidebar-logo">
        <div className="logo-icon">
          <IconLogoTruck />
        </div>
        <div className="logo-name">
          Swift<span>Track</span>
        </div>
      </NavLink>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label || 'main'}>
            {section.label && <div className="nav-label">{section.label}</div>}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `nav-item${isActive ? ' active' : ''}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <span className="u-name">{user.name}</span>
            <span className="u-role">{user.role}</span>
          </div>
          <IconLogout />
        </div>
      </div>
    </aside>
  );
}