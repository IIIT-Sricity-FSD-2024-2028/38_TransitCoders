# Portal Migration Recipe (Derived from Customer Pilot)

This document captures the exact patterns proven during the Customer Portal pilot migration so every remaining portal (Merchant, Agent, Admin, Hub-Manager) stays uniform and parity-safe.

## 1. Store & API Architecture
- **Base API (`frontend-react/src/app/api/baseApi.js`):** Single `createApi` instance (`reducerPath: 'api'`) with `x-auth-token` header injection (except `PUBLIC_ENDPOINTS`), 20s timeout, `cache: 'no-store'`, `401` -> `sessionCleared()`, `{ status, message, data }` error normalization, and `{ data }` payload unwrapping.
- **Auth & UI Slices (`src/features/auth/authSlice.js`, `authListeners.js`, `src/features/ui/uiSlice.js`):**
  - Keep `Token`/`user` in `localStorage` under exact keys `'x-auth-token'` and `'user'`, plus cross-tab `'storage'` and `'swifttrack-session-change'` sync.
  - Clear RTK Query cache (`baseApi.util.resetApiState()`) on `sessionCleared` and on switching authenticated user IDs.
  - Components read current user via `useAppSelector(selectCurrentUser)` instead of `getSessionUser()`.

## 2. Query & Normalization Pattern
- Store **raw** backend shapes in RTK Query caches (`ordersApi`, `supportApi`, `hubsApi`, `agentsApi`, `usersApi`, `financeApi`, `notificationsApi`).
- Transform/normalize inside `useMemo(...)` using pure portal helper functions (e.g., `customerSelectors.js`), never inside mutable component copies.
- Preserve existing loading skeletons, error `<p role="alert">`, and empty states.

## 3. URL Search Params without `useEffect` `setState`
- ESLint (`eslint-plugin-react-hooks` flat recommended) rejects synchronous `setState` inside `useEffect`.
- Derive query-param-selected items (e.g., `?id=`) with `useMemo` from RTK Query data + lightweight interaction state tracking `{ param, pickedId, closed }`.

## 4. Mutation Error Parity
- For user-facing validation or 403/404 translation (e.g., `CustomerSupport` order ownership check, `CustomerTracking` not-found wording), catch/map `.status` explicitly from `.unwrap()` rather than letting raw backend copy replace tested UI copy.
- Keep controlled form state local so failed mutations (e.g., `503` retry or `409` pricing re-review) never wipe user input.
- Do not put non-serializable `Blob` / `File` / `AbortController` values into Redux state (use `fetchOrderBarcodeBlob` for SVG blobs).

## 5. Verification Steps per Portal
1. Write `docs/redux-migration/parity/<portal>.md` (**V1**) before touching portal components.
2. Migrate layout + pages onto `authSlice` + RTK Query hooks.
3. Verify every V1 item in **V2** (`file:line`), check loading/empty/error/polling/tags (**V4**), run `npm run lint` and `npm run build` in `frontend-react/`, attempt E2E (**V3**), and commit `"redux: migrate <portal> portal to RTK Query"`.
