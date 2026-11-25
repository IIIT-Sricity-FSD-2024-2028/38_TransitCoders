import { useFetchThunk, useMutationThunk } from '../../app/thunkHooks';
import {
  fetchMishaps,
  fetchOrderById,
  fetchOrderMessages,
  fetchOrders,
  sendOrderMessage,
  trackOrder,
} from './ordersThunks';
import {
  selectMessagesEntry,
  selectMishaps,
  selectOrderEntry,
  selectOrdersList,
} from './ordersSlice';

export const useOrders = (options) => useFetchThunk(fetchOrders, undefined, { select: selectOrdersList, ...options });
export const useOrder = (id, options) => useFetchThunk(fetchOrderById, id, { select: selectOrderEntry, ...options });
export const useOrderMessages = (arg, options) =>
  useFetchThunk(fetchOrderMessages, arg, { select: selectMessagesEntry, ...options });
export const useMishaps = (options) => useFetchThunk(fetchMishaps, undefined, { select: selectMishaps, ...options });

// One-off lookups triggered by a user action rather than a mounted screen.
export const useLookupOrder = () => useMutationThunk(fetchOrderById);
export const useTrackOrder = () => useMutationThunk(trackOrder);

export const useSendOrderMessage = () => useMutationThunk(sendOrderMessage);
