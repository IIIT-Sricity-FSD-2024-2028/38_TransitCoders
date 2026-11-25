// Hub data read by several portals. Creating, editing and deleting hubs belongs to the admin
// portal; per-hub agent lists belong to the hub-manager portal.
import { createFetchThunk } from '../../app/api/createApiThunk';

export const fetchHubs = createFetchThunk('hubs/fetchHubs', async (_arg, { http }) => (await http({ url: '/hubs' })) || [], {
  provides: ['Hub'],
});

export const fetchHubById = createFetchThunk(
  'hubs/fetchHubById',
  (id, { http }) => http({ url: `/hubs/${encodeURIComponent(id)}` }),
  { provides: ['Hub'] },
);
