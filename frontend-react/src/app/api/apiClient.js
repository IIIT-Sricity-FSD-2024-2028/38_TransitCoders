import { sessionCleared } from '../../shared/auth/sessionActions';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

const TIMEOUT_MS = 20_000;

function storedToken() {
  return localStorage.getItem('x-auth-token');
}

function activeToken(getState) {
  return getState().auth?.token ?? storedToken();
}

/** Builds the `{ status, message, data }` error shape every thunk rejects with. */
export function normalizeError(error) {
  if (error && typeof error === 'object' && 'status' in error && 'message' in error) return error;
  const name = error?.name;
  if (name === 'TimeoutError') {
    return { status: 'TIMEOUT_ERROR', message: 'SwiftTrack did not respond in time. Try again.' };
  }
  if (name === 'AbortError') {
    return { status: 'ABORTED', message: 'Request cancelled.' };
  }
  if (error instanceof TypeError) {
    return {
      status: 'FETCH_ERROR',
      message: 'Could not connect to SwiftTrack. Check your connection and try again.',
    };
  }
  return { status: 'CLIENT_ERROR', message: error?.message || 'Request failed' };
}

function httpError(status, data) {
  const body = data && typeof data === 'object' ? data : {};
  const raw = body.error || body.message || `Request failed (${status})`;
  return { status, message: Array.isArray(raw) ? raw.join(', ') : raw, data };
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Sends an authenticated request to the SwiftTrack API.
 *
 * - Attaches the session token unless `isPublic` is set.
 * - Unwraps the backend `{ data }` envelope.
 * - Rejects with a normalized `{ status, message, data }` error.
 * - Clears the session on a 401, but only if the token that failed is still the active one, so a
 *   slow 401 from a previous session cannot sign out a user who has since signed in again.
 * - Rejects with `ABORTED` if the session changed while the request was in flight, so a previous
 *   user's response is never written into the store.
 */
export async function apiRequest(
  { dispatch, getState, signal },
  { url, method = 'GET', body, isPublic = false },
) {
  const token = isPublic ? null : activeToken(getState);
  const headers = {};
  if (token) headers['x-auth-token'] = token;

  let payload;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${API_BASE}${url}`, {
      method,
      headers,
      body: payload,
      cache: 'no-store',
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    throw normalizeError(error);
  }

  const data = await parseBody(response);

  if (!isPublic && token && token !== activeToken(getState)) {
    throw { status: 'ABORTED', message: 'Session changed.' };
  }

  if (!response.ok) {
    if (response.status === 401 && token && !isPublic) {
      dispatch(sessionCleared());
    }
    throw httpError(response.status, data);
  }

  if (data && typeof data === 'object' && 'data' in data) return data.data;
  return data;
}

/**
 * Fetches an SVG barcode Blob. Blobs are not serializable, so this deliberately stays outside
 * Redux state.
 */
export async function fetchOrderBarcodeBlob(id, { signal, token } = {}) {
  const authToken = token ?? storedToken();
  const headers = authToken ? { 'x-auth-token': authToken } : {};
  const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/barcode`, {
    headers,
    signal,
    cache: 'no-store',
  });
  if (!response.ok) {
    // Carry the HTTP status so callers can apply the same 401 session handling as apiRequest.
    throw Object.assign(new Error(`Request failed (${response.status})`), { status: response.status });
  }
  return response.blob();
}
