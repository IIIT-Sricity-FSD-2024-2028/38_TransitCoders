import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest, normalizeError } from './apiClient';
import {
  argKey,
  clearInFlight,
  dedupe,
  registerFetchThunk,
  registerMutationThunk,
} from './thunkRegistry';

/**
 * Thunk for reading data. `request(arg, { http })` calls `http({ url, ... })` and returns the
 * (optionally transformed) result. Rejections carry a `{ status, message, data }` payload.
 *
 * `provides` lists the data tags this thunk's result depends on, so a mutation that invalidates
 * one of them refreshes it while a component is subscribed.
 */
export function createFetchThunk(typePrefix, request, { provides = [] } = {}) {
  registerFetchThunk(typePrefix, provides);
  return createAsyncThunk(typePrefix, (arg, thunkApi) =>
    dedupe(`${typePrefix}:${argKey(arg)}`, async () => {
      try {
        return await request(arg, context(thunkApi));
      } catch (error) {
        return thunkApi.rejectWithValue(normalizeError(error));
      }
    }),
  );
}

function context(thunkApi) {
  return {
    http: (config) => apiRequest(thunkApi, config),
    dispatch: thunkApi.dispatch,
    getState: thunkApi.getState,
  };
}

/**
 * Thunk for writes. `invalidates` lists the data tags to refresh once the write succeeds.
 */
export function createMutationThunk(typePrefix, request, { invalidates = [] } = {}) {
  registerMutationThunk(typePrefix, invalidates);
  return createAsyncThunk(typePrefix, async (arg, thunkApi) => {
    clearInFlight();
    try {
      return await request(arg, context(thunkApi));
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeError(error));
    } finally {
      clearInFlight();
    }
  });
}
