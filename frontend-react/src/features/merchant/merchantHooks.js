import { useMutationThunk } from '../../app/thunkHooks';
import { cancelOrder, createOrder, createTicket, requestPricingQuote } from './merchantThunks';

export const usePricingQuote = () => useMutationThunk(requestPricingQuote);
export const useCreateOrder = () => useMutationThunk(createOrder);
export const useCancelOrder = () => useMutationThunk(cancelOrder);
export const useCreateTicket = () => useMutationThunk(createTicket);
