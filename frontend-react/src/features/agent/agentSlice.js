import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { addFetchCases, keyedEntry } from '../../app/api/fetchState';
import { sessionCleared, sessionDataReset } from '../../shared/auth/sessionActions';
import { fetchAgentProfile, fetchAgentWorklist } from './agentThunks';

const buildInitialState = () => ({
  // Server data, keyed by agent id.
  profiles: {},
  worklists: {},
  // UI state for the agent portal.
  acceptModalOrderId: null,
  confirmModalOrderId: null,
  busyOrderId: null,
  savingAvailability: false,
  actionError: '',
  notice: '',
});

const agentSlice = createSlice({
  name: 'agent',
  initialState: buildInitialState,
  reducers: {
    openAcceptModal(state, action) {
      state.actionError = '';
      state.acceptModalOrderId = action.payload;
    },
    closeAcceptModal(state) {
      state.actionError = '';
      state.acceptModalOrderId = null;
    },
    openConfirmModal(state, action) {
      state.actionError = '';
      state.confirmModalOrderId = action.payload;
    },
    closeConfirmModal(state) {
      state.actionError = '';
      state.confirmModalOrderId = null;
    },
    setAgentBusyOrder(state, action) {
      state.busyOrderId = action.payload || null;
    },
    setAgentSavingAvailability(state, action) {
      state.savingAvailability = Boolean(action.payload);
    },
    setAgentActionError(state, action) {
      state.actionError = action.payload || '';
    },
    setAgentNotice(state, action) {
      state.notice = action.payload || '';
    },
    resetAgentState: () => buildInitialState(),
  },
  extraReducers: (builder) => {
    addFetchCases(builder, fetchAgentProfile, (state, action) => keyedEntry(state.profiles, action.meta.arg));
    addFetchCases(builder, fetchAgentWorklist, (state, action) => keyedEntry(state.worklists, action.meta.arg));
    builder.addMatcher(isAnyOf(sessionCleared, sessionDataReset), () => buildInitialState());
  },
});

export const {
  openAcceptModal,
  closeAcceptModal,
  openConfirmModal,
  closeConfirmModal,
  setAgentBusyOrder,
  setAgentSavingAvailability,
  setAgentActionError,
  setAgentNotice,
  resetAgentState,
} = agentSlice.actions;

export const selectAgentProfileEntry = (state, id) => state.agent.profiles[id];
export const selectAgentWorklistEntry = (state, id) => state.agent.worklists[id];
export const selectAcceptModalOrderId = (state) => state.agent.acceptModalOrderId;
export const selectConfirmModalOrderId = (state) => state.agent.confirmModalOrderId;
export const selectAgentBusyOrderId = (state) => state.agent.busyOrderId;
export const selectAgentSavingAvailability = (state) => state.agent.savingAvailability;
export const selectAgentActionError = (state) => state.agent.actionError;
export const selectAgentNotice = (state) => state.agent.notice;

export default agentSlice.reducer;
