import { useFetchThunk } from '../../app/thunkHooks';
import { fetchComplaints, fetchFeedback, fetchTickets } from './supportThunks';
import { selectComplaints, selectFeedback, selectTickets } from './supportSlice';

export const useComplaints = (options) =>
  useFetchThunk(fetchComplaints, undefined, { select: selectComplaints, ...options });
export const useFeedback = (options) =>
  useFetchThunk(fetchFeedback, undefined, { select: selectFeedback, ...options });
export const useTickets = (options) =>
  useFetchThunk(fetchTickets, undefined, { select: selectTickets, ...options });
