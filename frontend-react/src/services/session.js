const SESSION_CHANGE = 'swifttrack-session-change';

export const Token = {
  get: () => localStorage.getItem('x-auth-token'),
};

export const dashboards = {
  super_user: '/admin/dashboard',
  admin: '/admin/dashboard',
  hub_manager: '/hub/dashboard',
  customer: '/customer/dashboard',
  merchant: '/merchant/dashboard',
  delivery_agent: '/agent/dashboard',
};

export function getSessionUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('x-auth-token', token);
  window.dispatchEvent(new Event(SESSION_CHANGE));
}

export function clearSession(token = Token.get()) {
  if (token !== Token.get()) return;
  localStorage.removeItem('x-auth-token');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  window.dispatchEvent(new Event(SESSION_CHANGE));
}

export function subscribeToSession(onChange) {
  window.addEventListener(SESSION_CHANGE, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(SESSION_CHANGE, onChange);
    window.removeEventListener('storage', onChange);
  };
}
