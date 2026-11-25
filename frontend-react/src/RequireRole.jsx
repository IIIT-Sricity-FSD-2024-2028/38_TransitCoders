import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from './app/hooks';
import { DASHBOARDS } from './shared/auth/authThunks';
import { useSessionCheck } from './shared/auth/authHooks';
import { selectAuthToken } from './shared/auth/authSlice';

export default function RequireRole({ roles }) {
  const location = useLocation();
  const token = useAppSelector(selectAuthToken);
  const {
    data: user,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useSessionCheck({ skip: !token });

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  if (isLoading || (isFetching && !user)) return <p role="status">Checking your session…</p>;
  if (error || !user) {
    return (
      <main>
        <p role="alert">{error?.message || 'Session verification failed'}</p>
        <button onClick={refetch}>Try again</button>
      </main>
    );
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={DASHBOARDS[user.role] || '/login'} replace />;
  }
  return <Outlet />;
}
