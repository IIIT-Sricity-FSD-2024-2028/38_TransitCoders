import { Link } from 'react-router-dom';

const roleLinks = [
  { to: '/customer/dashboard', title: 'Customer', desc: 'Track shipments, raise complaints' },
  { to: '/merchant/book', title: 'Merchant', desc: 'Create and manage delivery orders' },
  { to: '/delivery/worklist', title: 'Delivery Agent', desc: 'Worklist and delivery updates' },
  { to: '/hub/dispatch', title: 'Hub Manager — Dispatch', desc: 'Assign orders to drivers (Lab 2 demo)' },
  { to: '/admin/users', title: 'Admin', desc: 'Users, roles and configuration' },
];

export default function Home() {
  return (
    <div>
      <div className="hm-page-header">
        <div>
          <div className="hm-page-title">Welcome to SwiftTrack</div>
          <div className="hm-page-subtitle">
            React migration — pick a role to continue. The original vanilla app
            under <code>front-end/</code> remains untouched.
          </div>
        </div>
      </div>

      <div className="home-grid">
        {roleLinks.map((link) => (
          <Link key={link.to} to={link.to} className="home-card">
            <div className="home-card-title">{link.title}</div>
            <div className="home-card-desc">{link.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}