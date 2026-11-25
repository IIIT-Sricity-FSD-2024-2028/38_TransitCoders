import { useMutationThunk } from '../../app/thunkHooks';
import { confirmDelivery, createComplaint, createFeedback } from './customerThunks';

export const useConfirmDelivery = () => useMutationThunk(confirmDelivery);
export const useCreateComplaint = () => useMutationThunk(createComplaint);
export const useCreateFeedback = () => useMutationThunk(createFeedback);
