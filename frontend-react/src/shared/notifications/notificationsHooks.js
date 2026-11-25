import { useFetchThunk, useMutationThunk } from '../../app/thunkHooks';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './notificationsThunks';
import { selectNotificationsList, selectUnreadCount } from './notificationsSlice';

export const useNotifications = (options) =>
  useFetchThunk(fetchNotifications, undefined, { select: selectNotificationsList, ...options });
export const useUnreadCount = (options) =>
  useFetchThunk(fetchUnreadCount, undefined, { select: selectUnreadCount, ...options });

export const useMarkNotificationRead = () => useMutationThunk(markNotificationRead);
export const useMarkAllNotificationsRead = () => useMutationThunk(markAllNotificationsRead);
