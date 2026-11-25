import { createListenerMiddleware } from '@reduxjs/toolkit';
import { getInvalidatedTags, refetchActive } from './thunkRegistry';

const SUFFIX = '/fulfilled';

export const invalidationListenerMiddleware = createListenerMiddleware();

// After any mutation thunk succeeds, refetch the on-screen data it invalidates.
invalidationListenerMiddleware.startListening({
  predicate: (action) =>
    typeof action.type === 'string' &&
    action.type.endsWith(SUFFIX) &&
    getInvalidatedTags(action.type.slice(0, -SUFFIX.length)) !== null,
  effect: (action, listenerApi) => {
    const tags = getInvalidatedTags(action.type.slice(0, -SUFFIX.length));
    if (tags.length) refetchActive(tags, listenerApi.dispatch);
  },
});
