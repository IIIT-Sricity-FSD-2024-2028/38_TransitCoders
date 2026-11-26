// Server calls owned by the customer portal.
import { createMutationThunk } from '../../app/api/createApiThunk';

export const confirmDelivery = createMutationThunk(
  'customer/confirmDelivery',
  (id, { http }) => http({ url: `/orders/${id}/confirm`, method: 'PATCH' }),
  { invalidates: ['Tracking', 'Order', 'Notification'] },
);

export const createComplaint = createMutationThunk(
  'customer/createComplaint',
  (data, { http }) =>
    http({
      url: '/complaints',
      method: 'POST',
      body: {
        orderId: data.orderId,
        type: data.type || 'General Issue',
        description: data.description || data.details || data.comment || data.message || '',
        priority: data.priority || 'Medium',
      },
    }),
  { invalidates: ['Complaint', 'Order', 'Notification'] },
);

export const createFeedback = createMutationThunk(
  'customer/createFeedback',
  (data, { http }) =>
    http({
      url: '/feedback',
      method: 'POST',
      body: {
        orderId: data.orderId,
        rating: Number(data.rating),
        comments: data.comments || data.comment || data.feedback || '',
      },
    }),
  { invalidates: ['Feedback'] },
);
