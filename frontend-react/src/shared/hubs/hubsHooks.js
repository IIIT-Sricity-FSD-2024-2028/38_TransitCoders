import { useFetchThunk } from '../../app/thunkHooks';
import { fetchHubById, fetchHubs } from './hubsThunks';
import { selectHubEntry, selectHubsList } from './hubsSlice';

export const useHubs = (options) => useFetchThunk(fetchHubs, undefined, { select: selectHubsList, ...options });
export const useHub = (id, options) => useFetchThunk(fetchHubById, id, { select: selectHubEntry, ...options });
