import { useNavigate } from 'react-router-dom';

const roles = [
  { label: 'Admin', path: '/admin/dashboard' },
  { label: 'Customer', path: '/customer/dashboard' },
  { label: 'Agent', path: '/agent/dashboard' },
  { label: 'Hub', path: '/hub/dashboard' },
  { label: 'Merchant', path: '/merchant/dashboard' },
];

export default function RoleSelector() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '50px' }}>
      <h2>Select Role</h2>
      {roles.map((role) => (
        <button
          key={role.label}
          onClick={() => navigate(role.path)}
          style={{ padding: '10px 24px', width: '200px', cursor: 'pointer' }}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
}