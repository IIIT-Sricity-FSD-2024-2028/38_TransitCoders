import { useFetchThunk, useMutationThunk } from '../../app/thunkHooks';
import {
  approveUser,
  createExpense,
  createHub,
  createUser,
  deleteExpense,
  deleteHub,
  deleteUser,
  fetchExpenses,
  fetchPricingConfig,
  fetchRevenueReport,
  fetchUsers,
  updateComplaint,
  updateFeedback,
  updateHub,
  updatePricingConfig,
  updateTicket,
  updateUser,
} from './adminThunks';
import {
  selectExpenses,
  selectPricingConfig,
  selectRevenueReport,
  selectUsersList,
} from './adminSlice';

// Users
export const useUsers = (options) => useFetchThunk(fetchUsers, undefined, { select: selectUsersList, ...options });
export const useCreateUser = () => useMutationThunk(createUser);
export const useUpdateUser = () => useMutationThunk(updateUser);
export const useDeleteUser = () => useMutationThunk(deleteUser);
export const useApproveUser = () => useMutationThunk(approveUser);

// Finance
export const usePricingConfig = (options) =>
  useFetchThunk(fetchPricingConfig, undefined, { select: selectPricingConfig, ...options });
export const useRevenueReport = (options) =>
  useFetchThunk(fetchRevenueReport, undefined, { select: selectRevenueReport, ...options });
export const useExpenses = (options) =>
  useFetchThunk(fetchExpenses, undefined, { select: selectExpenses, ...options });
export const useUpdatePricingConfig = () => useMutationThunk(updatePricingConfig);
export const useCreateExpense = () => useMutationThunk(createExpense);
export const useDeleteExpense = () => useMutationThunk(deleteExpense);

// Delivery zones
export const useCreateHub = () => useMutationThunk(createHub);
export const useUpdateHub = () => useMutationThunk(updateHub);
export const useDeleteHub = () => useMutationThunk(deleteHub);

// Support moderation
export const useUpdateComplaint = () => useMutationThunk(updateComplaint);
export const useUpdateFeedback = () => useMutationThunk(updateFeedback);
export const useUpdateTicket = () => useMutationThunk(updateTicket);
