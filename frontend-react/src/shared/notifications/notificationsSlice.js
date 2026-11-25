import { createSlice } from '@reduxjs/toolkit';
import { addFetchCases, addSessionReset, idleFetch } from '../../app/api/fetchState';
import { fetchNotifications, fetchUnreadCount } from './notificationsThunks';

const initialState = () => ({
  list: idleFetch(),
  unread: idleFetch(),
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    addFetchCases(builder, fetchNotifications, (state) => state.list);
    addFetchCases(builder, fetchUnreadCount, (state) => state.unread);
    addSessionReset(builder, initialState);
  },
});

export const selectNotificationsList = (state) => state.notifications.list;
export const selectUnreadCount = (state) => state.notifications.unread;

export default notificationsSlice.reducer;
