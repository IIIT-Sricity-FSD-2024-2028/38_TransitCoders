import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { IconSearch, IconBell, IconSun, IconMoon } from '../icons.jsx';

const routeTitles = {
  '/': 'SwiftTrack Console',
  '/customer/dashboard': 'Customer Dashboard',
  '/merchant/book': 'Book Shipment',
  '/delivery/worklist': 'Delivery Worklist',
  '/hub/dispatch': 'Dispatch & Assignment Control',
  '/admin/users': 'User Management',
};

/**
 * Shared topbar — mirrors the vanilla app's topbar markup/classes
 * (renderNavbar in front-end/hub-manager/js/hub-manager.js):
 * title · theme toggle · search box · notification bell · avatar.
 * Theme toggling ports the original toggleTheme() body.dark behaviour.
 */
export default function Topbar() {
  const { pathname } = useLocation();
  const title = routeTitles[pathname] || 'SwiftTrack';
  const [isDark, setIsDark] = useState(
    () => document.body.classList.contains('dark')
  );

  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setIsDark((d) => !d)}
        >
          {isDark ? <IconMoon /> : <IconSun />}
          <span>{isDark ? 'Dark' : 'Light'}</span>
        </button>

        <div className="search-box">
          <IconSearch />
          <input type="text" placeholder="Search orders..." />
        </div>

        <div className="icon-wrap">
          <button type="button" className="icon-btn" aria-label="Notifications">
            <IconBell />
          </button>
        </div>

        <div className="user-profile-btn">VK</div>
      </div>
    </header>
  );
}