// Server calls owned by the merchant portal.
import { createMutationThunk } from '../../app/api/createApiThunk';

export const requestPricingQuote = createMutationThunk(
  'merchant/requestPricingQuote',
  ({ serviceLevel, weightKg, paymentMode }, { http }) =>
    http({ url: '/pricing/quote', method: 'POST', body: { serviceLevel, weightKg, paymentMode } }),
);

export const createOrder = createMutationThunk(
  'merchant/createOrder',
  (data, { http }) => http({ url: '/orders', method: 'POST', body: data }),
  { invalidates: ['Order', 'Hub', 'Revenue', 'Notification'] },
);

export const cancelOrder = createMutationThunk(
  'merchant/cancelOrder',
  (id, { http }) => http({ url: `/orders/${id}/cancel`, method: 'PATCH' }),
  { invalidates: ['Tracking', 'Order', 'Agent', 'Revenue', 'Notification'] },
);

export const createTicket = createMutationThunk(
  'merchant/createTicket',
  (data, { http }) => http({ url: '/tickets', method: 'POST', body: data }),
  { invalidates: ['Ticket', 'Notification'] },
);
