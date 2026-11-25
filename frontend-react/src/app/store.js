import { configureStore } from '@reduxjs/toolkit';
import { invalidationListenerMiddleware } from './api/invalidationListener';
// Shared data, used by several portals.
import authReducer from '../shared/auth/authSlice';
import { authListenerMiddleware, attachStorageSync } from '../shared/auth/authListeners';
import hubsReducer from '../shared/hubs/hubsSlice';
import notificationsReducer from '../shared/notifications/notificationsSlice';
import ordersReducer from '../shared/orders/ordersSlice';
import supportReducer from '../shared/support/supportSlice';
import uiReducer from '../shared/ui/uiSlice';
// Portal-owned state.
import adminReducer from '../features/admin/adminSlice';
import agentReducer from '../features/agent/agentSlice';
import hubManagerReducer from '../features/hub-manager/hubManagerSlice';

export function createAppStore(preloadedState) {
  return configureStore({
    reducer: {
      // shared
      auth: authReducer,
      hubs: hubsReducer,
      notifications: notificationsReducer,
      orders: ordersReducer,
      support: supportReducer,
      ui: uiReducer,
      // portals
      admin: adminReducer,
      agent: agentReducer,
      hubManager: hubManagerReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // `completeDelivery` takes the proof-of-delivery File as a thunk argument. It is never
        // stored in state, but it does appear in the action's `meta.arg`.
        serializableCheck: { ignoredActionPaths: ['meta.arg.photo'] },
      }).prepend(authListenerMiddleware.middleware, invalidationListenerMiddleware.middleware),
    devTools: import.meta.env.DEV,
    preloadedState,
  });
}

export const store = createAppStore();

if (typeof window !== 'undefined') {
  attachStorageSync(store);
}
