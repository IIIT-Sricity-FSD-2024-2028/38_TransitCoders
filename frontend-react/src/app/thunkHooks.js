import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { argKey, subscribe } from './api/thunkRegistry';

/**
 * Loads data with a fetch thunk and reads it back from the store.
 *
 * - Dispatches `thunk(arg)` on mount and whenever `arg` changes (always refetching, so a page
 *   never shows data from a previous visit as if it were current).
 * - While mounted, the thunk is "subscribed": a mutation that invalidates the data it provides
 *   re-dispatches it.
 * - `select(state, arg)` returns the slice's `{ data, status, error }` entry (or undefined).
 * - `pollingInterval` (ms) re-dispatches on a timer, paused while the tab is hidden.
 *
 * Returns `{ data, error, isLoading, isFetching, refetch }`.
 */
export function useFetchThunk(thunk, arg, { select, skip = false, pollingInterval = 0 } = {}) {
  const dispatch = useAppDispatch();
  const entry = useAppSelector((state) => select(state, arg));
  const key = argKey(arg);

  const argRef = useRef(arg);
  useEffect(() => {
    argRef.current = arg;
  });

  useEffect(() => {
    if (skip) return undefined;
    const unsubscribe = subscribe(thunk, argRef.current);
    dispatch(thunk(argRef.current));
    return unsubscribe;
    // `key` stands in for `arg` so inline object arguments do not retrigger the fetch.
  }, [dispatch, thunk, key, skip]);

  useEffect(() => {
    if (skip || !pollingInterval) return undefined;
    const timer = setInterval(() => {
      if (!document.hidden) dispatch(thunk(argRef.current));
    }, pollingInterval);
    return () => clearInterval(timer);
  }, [dispatch, thunk, key, skip, pollingInterval]);

  const refetch = useCallback(() => dispatch(thunk(argRef.current)), [dispatch, thunk]);

  const status = entry?.status ?? 'idle';
  const data = entry?.data;
  return {
    data,
    error: entry?.error ?? undefined,
    isLoading: !skip && data === undefined && (status === 'idle' || status === 'loading'),
    isFetching: !skip && status === 'loading',
    refetch,
  };
}

/**
 * Wraps a mutation thunk for components. Returns `[trigger, { isLoading }]`.
 * `trigger(arg)` dispatches the thunk and returns its promise, so `.unwrap()` works as usual.
 */
export function useMutationThunk(thunk) {
  const dispatch = useAppDispatch();
  const pending = useRef(0);
  const mounted = useRef(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const trigger = useCallback(
    (arg) => {
      pending.current += 1;
      setIsLoading(true);
      const promise = dispatch(thunk(arg));
      promise.then(() => {
        pending.current -= 1;
        if (mounted.current && pending.current === 0) setIsLoading(false);
      });
      return promise;
    },
    [dispatch, thunk],
  );

  return [trigger, { isLoading }];
}
