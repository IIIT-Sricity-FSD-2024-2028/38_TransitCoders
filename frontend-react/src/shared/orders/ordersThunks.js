// Order data read by every portal, plus the shared messaging and tracking calls.
// Portal-specific order actions live in each portal's own thunks file.
import { createFetchThunk, createMutationThunk } from '../../app/api/createApiThunk';

/** Tracking results are stored under the normalized tracking ID. */
export const trackingKey = (trackingId) => String(trackingId ?? '').trim().toUpperCase();
export const messagesKey = ({ id, channel }) => `${id}:${channel}`;

export const fetchOrders = createFetchThunk(
  'orders/fetchOrders',
  async (_arg, { http }) => (await http({ url: '/orders' })) || [],
  { provides: ['Order'] },
);

export const fetchOrderById = createFetchThunk(
  'orders/fetchOrderById',
  (id, { http }) => http({ url: `/orders/${encodeURIComponent(id)}` }),
  { provides: ['Order'] },
);

// Public: anyone with a tracking ID can look up a shipment, signed in or not.
export const trackOrder = createFetchThunk(
  'orders/trackOrder',
  (trackingId, { http }) => http({ url: `/tracking/${encodeURIComponent(trackingKey(trackingId))}`, isPublic: true }),
  { provides: ['Tracking'] },
);

export const fetchOrderMessages = createFetchThunk(
  'orders/fetchOrderMessages',
  async ({ id, channel }, { http }) =>
    (await http({ url: `/orders/${encodeURIComponent(id)}/messages/${channel}` })) || [],
  { provides: ['OrderMessage'] },
);

export const fetchMishaps = createFetchThunk(
  'orders/fetchMishaps',
  async (_arg, { http }) => (await http({ url: '/orders/mishaps' })) || [],
  { provides: ['Mishap'] },
);

export const sendOrderMessage = createMutationThunk(
  'orders/sendOrderMessage',
  ({ id, channel, body }, { http }) =>
    http({ url: `/orders/${encodeURIComponent(id)}/messages/${channel}`, method: 'POST', body: { body } }),
  { invalidates: ['OrderMessage', 'Notification'] },
);
