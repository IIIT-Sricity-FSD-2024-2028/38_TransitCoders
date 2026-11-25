import { useFetchThunk, useMutationThunk } from '../../app/thunkHooks';
import { fetchMe, login, logout, register, updateProfile } from './authThunks';
import { selectSessionCheck } from './authSlice';

export const useSessionCheck = (options) =>
  useFetchThunk(fetchMe, undefined, { select: selectSessionCheck, ...options });

export const useLogin = () => useMutationThunk(login);
export const useRegister = () => useMutationThunk(register);
export const useUpdateProfile = () => useMutationThunk(updateProfile);
export const useLogout = () => useMutationThunk(logout);
