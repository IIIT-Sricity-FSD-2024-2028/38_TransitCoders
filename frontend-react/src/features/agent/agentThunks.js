// Server calls owned by the delivery-agent portal.
import { createFetchThunk, createMutationThunk } from '../../app/api/createApiThunk';

const MISHAP_TYPE_MAP = {
  vehicle_breakdown: 'vehicle_breakdown',
  vehicle: 'vehicle_breakdown',
  traffic: 'vehicle_breakdown',
  address_not_found: 'address_not_found',
  address_incorrect: 'address_not_found',
  address: 'address_not_found',
  customer_unavailable: 'customer_unavailable',
  unavailable: 'customer_unavailable',
  package_damaged: 'package_damaged',
  damaged_package: 'package_damaged',
  package: 'package_damaged',
  damaged: 'package_damaged',
  customer_refused: 'other',
  refused: 'other',
  other: 'other',
};

export const fetchAgentProfile = createFetchThunk(
  'agent/fetchAgentProfile',
  (id, { http }) => http({ url: `/agents/${id}` }),
  { provides: ['Agent'] },
);

export const fetchAgentWorklist = createFetchThunk(
  'agent/fetchAgentWorklist',
  (id, { http }) => http({ url: `/agents/${id}/worklist` }),
  { provides: ['Agent', 'Order'] },
);

export const updateAgentAvailability = createMutationThunk(
  'agent/updateAgentAvailability',
  ({ id, availabilityStatus }, { http }) =>
    http({ url: `/agents/${id}/availability`, method: 'PATCH', body: { availabilityStatus } }),
  { invalidates: ['Agent', 'Auth'] },
);

export const updateOrderStatus = createMutationThunk(
  'agent/updateOrderStatus',
  ({ id, status }, { http }) => http({ url: `/orders/${id}/status`, method: 'PATCH', body: { status } }),
  { invalidates: ['Tracking', 'Order', 'Agent', 'Notification'] },
);

export const completeDelivery = createMutationThunk(
  'agent/completeDelivery',
  ({ id, photo }, { http }) => {
    const body = new FormData();
    if (photo) body.append('photo', photo);
    return http({ url: `/orders/${id}/delivery`, method: 'PATCH', body });
  },
  { invalidates: ['Tracking', 'Order', 'Agent', 'Revenue', 'Notification'] },
);

export const reportMishap = createMutationThunk(
  'agent/reportMishap',
  ({ id, type, description }, { http }) => {
    const cleanType = MISHAP_TYPE_MAP[(type || '').trim().toLowerCase()] || 'other';
    return http({
      url: `/orders/${id}/mishap`,
      method: 'POST',
      body: { type: cleanType, description: description || '' },
    });
  },
  { invalidates: ['Tracking', 'Order', 'Mishap', 'Agent', 'Notification'] },
);
