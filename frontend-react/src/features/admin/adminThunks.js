// Server calls owned by the admin portal: users, pricing, revenue, expenses, delivery zones
// (hubs), and moderation of complaints, feedback and tickets.
import { createFetchThunk, createMutationThunk } from '../../app/api/createApiThunk';

// ---- Users ----------------------------------------------------------------------------------

export const fetchUsers = createFetchThunk('admin/fetchUsers', async (_arg, { http }) => (await http({ url: '/users' })) || [], {
  provides: ['User'],
});

export const createUser = createMutationThunk('admin/createUser', (data, { http }) => http({ url: '/users', method: 'POST', body: data }), {
  invalidates: ['User', 'Agent', 'Hub'],
});

export const updateUser = createMutationThunk(
  'admin/updateUser',
  ({ id, ...data }, { http }) => http({ url: `/users/${id}`, method: 'PUT', body: data }),
  { invalidates: ['User', 'Agent', 'Hub'] },
);

export const deleteUser = createMutationThunk('admin/deleteUser', (id, { http }) => http({ url: `/users/${id}`, method: 'DELETE' }), {
  invalidates: ['User', 'Agent', 'Hub'],
});

export const approveUser = createMutationThunk('admin/approveUser', (id, { http }) => http({ url: `/users/${id}/approve`, method: 'PATCH' }), {
  invalidates: ['User', 'Agent', 'Hub', 'Notification'],
});

// ---- Finance --------------------------------------------------------------------------------

export const fetchPricingConfig = createFetchThunk(
  'admin/fetchPricingConfig',
  (_arg, { http }) => http({ url: '/pricing/config' }),
  { provides: ['Pricing'] },
);

export const updatePricingConfig = createMutationThunk(
  'admin/updatePricingConfig',
  (changes, { http }) => http({ url: '/pricing/config', method: 'PUT', body: changes }),
  { invalidates: ['Pricing'] },
);

export const fetchRevenueReport = createFetchThunk(
  'admin/fetchRevenueReport',
  (_arg, { http }) => http({ url: '/reports/revenue' }),
  { provides: ['Revenue'] },
);

export const fetchExpenses = createFetchThunk(
  'admin/fetchExpenses',
  async (_arg, { http }) => (await http({ url: '/expenses' })) || [],
  { provides: ['Expense'] },
);

export const createExpense = createMutationThunk(
  'admin/createExpense',
  (data, { http }) => http({ url: '/expenses', method: 'POST', body: data }),
  { invalidates: ['Expense', 'Revenue'] },
);

export const deleteExpense = createMutationThunk(
  'admin/deleteExpense',
  (id, { http }) => http({ url: `/expenses/${id}`, method: 'DELETE' }),
  { invalidates: ['Expense', 'Revenue'] },
);

// ---- Delivery zones (hubs) ------------------------------------------------------------------

export const createHub = createMutationThunk('admin/createHub', (data, { http }) => http({ url: '/hubs', method: 'POST', body: data }), {
  invalidates: ['Hub'],
});

export const updateHub = createMutationThunk(
  'admin/updateHub',
  ({ id, ...data }, { http }) => http({ url: `/hubs/${encodeURIComponent(id)}`, method: 'PUT', body: data }),
  { invalidates: ['Hub'] },
);

export const deleteHub = createMutationThunk(
  'admin/deleteHub',
  (id, { http }) => http({ url: `/hubs/${encodeURIComponent(id)}`, method: 'DELETE' }),
  { invalidates: ['Hub', 'Order'] },
);

// ---- Support moderation ---------------------------------------------------------------------

export const updateComplaint = createMutationThunk(
  'admin/updateComplaint',
  ({ id, ...data }, { http }) => http({ url: `/complaints/${id}`, method: 'PUT', body: data }),
  { invalidates: ['Complaint', 'Notification'] },
);

export const updateFeedback = createMutationThunk(
  'admin/updateFeedback',
  ({ id, ...data }, { http }) => http({ url: `/feedback/${id}`, method: 'PUT', body: data }),
  { invalidates: ['Feedback'] },
);

export const updateTicket = createMutationThunk(
  'admin/updateTicket',
  ({ id, ...data }, { http }) => http({ url: `/tickets/${id}`, method: 'PUT', body: data }),
  { invalidates: ['Ticket', 'Notification'] },
);
