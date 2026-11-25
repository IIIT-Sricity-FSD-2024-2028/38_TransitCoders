import { useFetchThunk, useMutationThunk } from '../../app/thunkHooks';
import {
  completeDelivery,
  fetchAgentProfile,
  fetchAgentWorklist,
  reportMishap,
  updateAgentAvailability,
  updateOrderStatus,
} from './agentThunks';
import { selectAgentProfileEntry, selectAgentWorklistEntry } from './agentSlice';

export const useAgentProfile = (id, options) =>
  useFetchThunk(fetchAgentProfile, id, { select: selectAgentProfileEntry, ...options });
export const useAgentWorklist = (id, options) =>
  useFetchThunk(fetchAgentWorklist, id, { select: selectAgentWorklistEntry, ...options });

export const useUpdateAgentAvailability = () => useMutationThunk(updateAgentAvailability);
export const useUpdateOrderStatus = () => useMutationThunk(updateOrderStatus);
export const useCompleteDelivery = () => useMutationThunk(completeDelivery);
export const useReportMishap = () => useMutationThunk(reportMishap);
