// Server calls owned by the hub-manager portal: warehouse scans, dispatch, transfers, returns.
import { createFetchThunk, createMutationThunk } from '../../app/api/createApiThunk';

export const fetchAgentsForHub = createFetchThunk(
  'hubManager/fetchAgentsForHub',
  async (hubId, { http }) => (await http({ url: `/hubs/${encodeURIComponent(hubId)}/agents` })) || [],
  { provides: ['Agent', 'Hub'] },
);

export const updateOrder = createMutationThunk(
  'hubManager/updateOrder',
  ({ id, ...data }, { http }) => http({ url: `/orders/${id}`, method: 'PUT', body: data }),
  { invalidates: ['Order', 'Tracking'] },
);

export const assignAgent = createMutationThunk(
  'hubManager/assignAgent',
  ({ id, agentId }, { http }) => http({ url: `/orders/${id}/assign`, method: 'PATCH', body: { agentId } }),
  { invalidates: ['Tracking', 'Order', 'Agent', 'Hub', 'Notification'] },
);

export const autoAssignAgent = createMutationThunk(
  'hubManager/autoAssignAgent',
  (id, { http }) => http({ url: `/orders/${id}/auto-assign`, method: 'PATCH' }),
  { invalidates: ['Tracking', 'Order', 'Agent', 'Hub', 'Notification'] },
);

export const scanWarehouse = createMutationThunk(
  'hubManager/scanWarehouse',
  ({ reference, action, autoAssign }, { http }) =>
    http({
      url: `/orders/${encodeURIComponent(reference)}/warehouse`,
      method: 'PATCH',
      body: { action, autoAssign },
    }),
  { invalidates: ['Order', 'Tracking', 'Agent', 'Hub', 'Notification'] },
);

export const transferOrder = createMutationThunk(
  'hubManager/transferOrder',
  ({ id, toHubId, reason }, { http }) =>
    http({ url: `/orders/${id}/transfer`, method: 'PATCH', body: { toHubId, reason } }),
  { invalidates: ['Tracking', 'Order', 'Hub', 'Notification'] },
);

export const authorizeReturn = createMutationThunk(
  'hubManager/authorizeReturn',
  ({ id, reason }, { http }) => http({ url: `/orders/${id}/return`, method: 'PATCH', body: { reason } }),
  { invalidates: ['Tracking', 'Order', 'Revenue', 'Notification'] },
);
