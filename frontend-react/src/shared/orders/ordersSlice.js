import { createSlice } from '@reduxjs/toolkit';
import { addFetchCases, addSessionReset, idleFetch, keyedEntry } from '../../app/api/fetchState';
import {
  fetchMishaps,
  fetchOrderById,
  fetchOrderMessages,
  fetchOrders,
  messagesKey,
  trackOrder,
  trackingKey,
} from './ordersThunks';

const initialState = () => ({
  list: idleFetch(),
  detail: {}, // keyed by the id or tracking ID the order was requested with
  tracking: {}, // keyed by normalized tracking ID
  messages: {}, // keyed by `${orderId}:${channel}`
  mishaps: idleFetch(),
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    addFetchCases(builder, fetchOrders, (state) => state.list);
    addFetchCases(builder, fetchOrderById, (state, action) => keyedEntry(state.detail, action.meta.arg));
    addFetchCases(builder, trackOrder, (state, action) => keyedEntry(state.tracking, trackingKey(action.meta.arg)));
    addFetchCases(builder, fetchOrderMessages, (state, action) =>
      keyedEntry(state.messages, messagesKey(action.meta.arg)),
    );
    addFetchCases(builder, fetchMishaps, (state) => state.mishaps);
    addSessionReset(builder, initialState);
  },
});

export const selectOrdersList = (state) => state.orders.list;
export const selectOrderEntry = (state, id) => state.orders.detail[id];
export const selectTrackingEntry = (state, trackingId) => state.orders.tracking[trackingKey(trackingId)];
export const selectMessagesEntry = (state, arg) => state.orders.messages[messagesKey(arg)];
export const selectMishaps = (state) => state.orders.mishaps;

export default ordersSlice.reducer;
