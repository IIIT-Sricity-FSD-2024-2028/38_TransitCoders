import { createSlice } from '@reduxjs/toolkit';
import { addFetchCases, addSessionReset, idleFetch } from '../../app/api/fetchState';
import { fetchComplaints, fetchFeedback, fetchTickets } from './supportThunks';

const initialState = () => ({
  complaints: idleFetch(),
  feedback: idleFetch(),
  tickets: idleFetch(),
});

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    addFetchCases(builder, fetchComplaints, (state) => state.complaints);
    addFetchCases(builder, fetchFeedback, (state) => state.feedback);
    addFetchCases(builder, fetchTickets, (state) => state.tickets);
    addSessionReset(builder, initialState);
  },
});

export const selectComplaints = (state) => state.support.complaints;
export const selectFeedback = (state) => state.support.feedback;
export const selectTickets = (state) => state.support.tickets;

export default supportSlice.reducer;
