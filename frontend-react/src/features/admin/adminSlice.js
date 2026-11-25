import { createSlice } from '@reduxjs/toolkit';
import { addFetchCases, addSessionReset, idleFetch } from '../../app/api/fetchState';
import { fetchExpenses, fetchPricingConfig, fetchRevenueReport, fetchUsers } from './adminThunks';

const initialState = () => ({
  users: idleFetch(),
  pricingConfig: idleFetch(),
  revenue: idleFetch(),
  expenses: idleFetch(),
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    addFetchCases(builder, fetchUsers, (state) => state.users);
    addFetchCases(builder, fetchPricingConfig, (state) => state.pricingConfig);
    addFetchCases(builder, fetchRevenueReport, (state) => state.revenue);
    addFetchCases(builder, fetchExpenses, (state) => state.expenses);
    addSessionReset(builder, initialState);
  },
});

export const selectUsersList = (state) => state.admin.users;
export const selectPricingConfig = (state) => state.admin.pricingConfig;
export const selectRevenueReport = (state) => state.admin.revenue;
export const selectExpenses = (state) => state.admin.expenses;

export default adminSlice.reducer;
