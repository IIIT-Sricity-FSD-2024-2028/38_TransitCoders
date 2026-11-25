import { isAnyOf } from '@reduxjs/toolkit';
import { sessionCleared, sessionDataReset } from '../../shared/auth/sessionActions';

// Shared request-state shape for fetch thunks: `{ data, status, error }`.
// status is 'idle' | 'loading' | 'succeeded' | 'failed'.

export const idleFetch = () => ({ data: undefined, status: 'idle', error: null });

/** Responses for a session that has since changed are discarded rather than stored. */
const isAborted = (action) => action.payload?.status === 'ABORTED' || action.meta?.aborted;

/**
 * Wires a fetch thunk's pending / fulfilled / rejected actions to a `{ data, status, error }`
 * entry. `target(state, action)` returns that entry (creating it first for keyed resources).
 */
export function addFetchCases(builder, thunk, target, { transform, onFulfilled } = {}) {
  builder
    .addCase(thunk.pending, (state, action) => {
      const entry = target(state, action);
      entry.status = 'loading';
    })
    .addCase(thunk.fulfilled, (state, action) => {
      const entry = target(state, action);
      entry.data = transform ? transform(action.payload, entry.data) : action.payload;
      entry.status = 'succeeded';
      entry.error = null;
      onFulfilled?.(state, action);
    })
    .addCase(thunk.rejected, (state, action) => {
      const entry = target(state, action);
      if (isAborted(action)) {
        entry.status = entry.data === undefined ? 'idle' : 'succeeded';
        return;
      }
      entry.status = 'failed';
      entry.error = action.payload ?? { message: action.error?.message || 'Request failed' };
    });
}

/**
 * Resets a slice to its initial state when the session ends or the user changes. Call after all
 * `addCase` calls (matchers must come last).
 */
export function addSessionReset(builder, initialState) {
  builder.addMatcher(isAnyOf(sessionCleared, sessionDataReset), () => initialState());
}

/** Returns the keyed entry `state[field][key]`, creating it when missing. */
export function keyedEntry(map, key) {
  if (!map[key]) map[key] = idleFetch();
  return map[key];
}
