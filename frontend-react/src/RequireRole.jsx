import { useEffect, useState, useSyncExternalStore } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { API } from './services/api';
import { dashboards, saveSession, subscribeToSession, Token } from './services/session';

export default function RequireRole({ roles }) {
  const location = useLocation();
  const token = useSyncExternalStore(subscribeToSession, Token.get);
  const [attempt, retry] = useState(0);
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    API.auth.me().then(user => {
      if (!active || Token.get() !== token) return;
      saveSession(token, user);
      setSession({ token, attempt, user });
    }, error => {
      if (active) setSession({ token, attempt, error: error.message });
    });
    return () => { active = false; };
  }, [token, attempt]);

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  if (session?.token !== token || session.attempt !== attempt) return <p role="status">Checking your session…</p>;
  if (session.error) {
    return (
      <main>
        <p role="alert">{session.error}</p>
        <button onClick={() => retry(value => value + 1)}>Try again</button>
      </main>
    );
  }
  if (!roles.includes(session.user.role)) {
    return <Navigate to={dashboards[session.user.role] || '/login'} replace />;
  }
  return <Outlet />;
}
