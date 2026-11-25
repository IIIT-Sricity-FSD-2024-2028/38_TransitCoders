import { useFetchThunk, useMutationThunk } from '../../app/thunkHooks';
import {
  assignAgent,
  authorizeReturn,
  autoAssignAgent,
  fetchAgentsForHub,
  scanWarehouse,
  transferOrder,
  updateOrder,
} from './hubManagerThunks';
import { selectHubAgentsEntry } from './hubManagerSlice';

export const useHubAgents = (hubId, options) =>
  useFetchThunk(fetchAgentsForHub, hubId, { select: selectHubAgentsEntry, ...options });

export const useUpdateOrder = () => useMutationThunk(updateOrder);
export const useAssignAgent = () => useMutationThunk(assignAgent);
export const useAutoAssignAgent = () => useMutationThunk(autoAssignAgent);
export const useScanWarehouse = () => useMutationThunk(scanWarehouse);
export const useTransferOrder = () => useMutationThunk(transferOrder);
export const useAuthorizeReturn = () => useMutationThunk(authorizeReturn);
