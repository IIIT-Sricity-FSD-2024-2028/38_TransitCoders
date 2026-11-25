import { createFetchThunk, createMutationThunk } from '../../app/api/createApiThunk';
import { sessionCleared } from './sessionActions';

export const DASHBOARDS = {
  super_user: '/admin/dashboard',
  admin: '/admin/dashboard',
  customer: '/customer/dashboard',
  hub_manager: '/hub/dashboard',
  merchant: '/merchant/dashboard',
  delivery_agent: '/agent/dashboard',
};

export const login = createMutationThunk('auth/login', ({ email, password }, { http }) =>
  http({ url: '/auth/login', method: 'POST', body: { email, password }, isPublic: true }),
);

export const register = createMutationThunk('auth/register', (data, { http }) =>
  http({ url: '/auth/register', method: 'POST', body: data, isPublic: true }),
);

export const fetchMe = createFetchThunk('auth/fetchMe', (_arg, { http }) => http({ url: '/auth/me' }), {
  provides: ['Auth'],
});

export const updateProfile = createMutationThunk(
  'auth/updateProfile',
  (profile, { http }) => http({ url: '/auth/me', method: 'PATCH', body: profile }),
  { invalidates: ['Auth', 'Agent', 'User'] },
);

export const logout = createMutationThunk('auth/logout', async (_arg, { http, dispatch }) => {
  try {
    await http({ url: '/auth/logout', method: 'POST' });
  } catch {
    // Always clear the client session on logout, even if the network call fails.
  } finally {
    dispatch(sessionCleared());
  }
});
