import { createSlice } from '@reduxjs/toolkit';
import { addFetchCases, addSessionReset, keyedEntry } from '../../app/api/fetchState';
import { fetchAgentsForHub } from './hubManagerThunks';

const initialState = () => ({
  agentsByHub: {}, // keyed by hub ID
});

const hubManagerSlice = createSlice({
  name: 'hubManager',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    addFetchCases(builder, fetchAgentsForHub, (state, action) => keyedEntry(state.agentsByHub, action.meta.arg));
    addSessionReset(builder, initialState);
  },
});

export const selectHubAgentsEntry = (state, hubId) => state.hubManager.agentsByHub[hubId];

export default hubManagerSlice.reducer;
