// Support records read by several portals. Each portal owns the writes it performs:
// customers file complaints and feedback, merchants open tickets, admins moderate all three.
import { createFetchThunk } from '../../app/api/createApiThunk';

const list = (url) => async (_arg, { http }) => (await http({ url })) || [];

export const fetchComplaints = createFetchThunk('support/fetchComplaints', list('/complaints'), {
  provides: ['Complaint'],
});

export const fetchFeedback = createFetchThunk('support/fetchFeedback', list('/feedback'), {
  provides: ['Feedback'],
});

export const fetchTickets = createFetchThunk('support/fetchTickets', list('/tickets'), {
  provides: ['Ticket'],
});
