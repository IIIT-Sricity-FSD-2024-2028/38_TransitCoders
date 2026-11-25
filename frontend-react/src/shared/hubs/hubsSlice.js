import { createSlice } from '@reduxjs/toolkit';
import { addFetchCases, addSessionReset, idleFetch, keyedEntry } from '../../app/api/fetchState';
import { fetchHubById, fetchHubs } from './hubsThunks';

const initialState = () => ({
  list: idleFetch(),
  byId: {},
});

const hubsSlice = createSlice({
  name: 'hubs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    addFetchCases(builder, fetchHubs, (state) => state.list);
    addFetchCases(builder, fetchHubById, (state, action) => keyedEntry(state.byId, action.meta.arg));
    addSessionReset(builder, initialState);
  },
});

export const selectHubsList = (state) => state.hubs.list;
export const selectHubEntry = (state, id) => state.hubs.byId[id];

export default hubsSlice.reducer;
