import { createFetchThunk, createMutationThunk } from '../../app/api/createApiThunk';

export const fetchNotifications = createFetchThunk(
  'notifications/fetchNotifications',
  async (_arg, { http }) => (await http({ url: '/notifications' })) || [],
  { provides: ['Notification'] },
);

export const fetchUnreadCount = createFetchThunk(
  'notifications/fetchUnreadCount',
  async (_arg, { http }) => (await http({ url: '/notifications/unread-count' }))?.count ?? 0,
  { provides: ['Notification'] },
);

export const markNotificationRead = createMutationThunk(
  'notifications/markRead',
  (id, { http }) => http({ url: `/notifications/${id}/read`, method: 'PATCH' }),
  { invalidates: ['Notification'] },
);

export const markAllNotificationsRead = createMutationThunk(
  'notifications/markAllRead',
  (_arg, { http }) => http({ url: '/notifications/read-all', method: 'PATCH' }),
  { invalidates: ['Notification'] },
);
