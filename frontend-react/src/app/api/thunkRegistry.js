// Bookkeeping that lets mutation thunks refresh whatever data is currently on screen.
//
// - Fetch thunks declare the data `tags` they provide.
// - Mutation thunks declare the `tags` they invalidate.
// - Components subscribe to a fetch thunk (with its argument) while mounted.
// When a mutation succeeds, every active subscription that provides an invalidated tag is
// re-dispatched.

const fetchThunks = new Map(); // typePrefix -> tags provided
const mutationTags = new Map(); // typePrefix -> tags invalidated
const subscriptions = new Map(); // key -> { thunk, arg, count }
const inFlight = new Map(); // key -> Promise

export function registerFetchThunk(typePrefix, provides) {
  fetchThunks.set(typePrefix, provides);
}

export function registerMutationThunk(typePrefix, invalidates) {
  mutationTags.set(typePrefix, invalidates);
}

export function getInvalidatedTags(typePrefix) {
  return mutationTags.get(typePrefix) ?? null;
}

export function argKey(arg) {
  return arg === undefined ? '' : JSON.stringify(arg);
}

export function subscribe(thunk, arg) {
  const key = `${thunk.typePrefix}:${argKey(arg)}`;
  const existing = subscriptions.get(key);
  if (existing) existing.count += 1;
  else subscriptions.set(key, { thunk, arg, count: 1 });
  return () => {
    const entry = subscriptions.get(key);
    if (!entry) return;
    entry.count -= 1;
    if (entry.count <= 0) subscriptions.delete(key);
  };
}

export function refetchActive(tags, dispatch) {
  const wanted = new Set(tags);
  for (const { thunk, arg } of subscriptions.values()) {
    const provides = fetchThunks.get(thunk.typePrefix) ?? [];
    if (provides.some((tag) => wanted.has(tag))) dispatch(thunk(arg));
  }
}

/** Shares one network call between identical concurrent fetches (e.g. StrictMode, sibling hooks). */
export function dedupe(key, start) {
  const running = inFlight.get(key);
  if (running) return running;
  const promise = start().finally(() => {
    if (inFlight.get(key) === promise) inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}

/** Drops shared in-flight reads so a refetch after a mutation cannot reuse pre-mutation data. */
export function clearInFlight() {
  inFlight.clear();
}
