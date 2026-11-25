import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import {
  readStoredToken,
  readStoredUser,
  setCredentials,
  syncSessionFromStorage,
} from './authSlice';
import { fetchMe, updateProfile } from './authThunks';
import { sessionCleared, sessionDataReset } from './sessionActions';

const SESSION_CHANGE_EVENT = 'swifttrack-session-change';

export const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
  actionCreator: setCredentials,
  effect: (action, listenerApi) => {
    const previousUserId = listenerApi.getOriginalState().auth?.user?.id;
    const { token, user } = action.payload;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('x-auth-token', token);
    if (previousUserId && previousUserId !== user?.id) {
      listenerApi.dispatch(sessionDataReset());
    }
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  },
});

authListenerMiddleware.startListening({
  matcher: isAnyOf(fetchMe.fulfilled, updateProfile.fulfilled),
  effect: (action) => {
    const user = action.payload;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },
});

authListenerMiddleware.startListening({
  actionCreator: sessionCleared,
  effect: () => {
    localStorage.removeItem('x-auth-token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  },
});

authListenerMiddleware.startListening({
  matcher: isAnyOf(syncSessionFromStorage),
  effect: (_action, listenerApi) => {
    const prev = listenerApi.getOriginalState().auth;
    const next = listenerApi.getState().auth;
    if (prev.token !== next.token || prev.user?.id !== next.user?.id) {
      listenerApi.dispatch(sessionDataReset());
    }
  },
});

export function attachStorageSync(store) {
  const syncIfChanged = () => {
    const storedToken = readStoredToken();
    const storedUser = readStoredUser();
    const current = store.getState().auth;
    const userChanged = JSON.stringify(current.user) !== JSON.stringify(storedUser);
    if (current.token !== storedToken || userChanged) {
      store.dispatch(syncSessionFromStorage({ token: storedToken, user: storedUser }));
    }
  };

  window.addEventListener('storage', syncIfChanged);
  window.addEventListener(SESSION_CHANGE_EVENT, syncIfChanged);
  return () => {
    window.removeEventListener('storage', syncIfChanged);
    window.removeEventListener(SESSION_CHANGE_EVENT, syncIfChanged);
  };
}
