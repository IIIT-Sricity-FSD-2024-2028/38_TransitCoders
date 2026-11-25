# Thunk architecture (supersedes the RTK Query recommendation in 00/04)

Server state now lives in Redux Toolkit slices fed by `createAsyncThunk`. RTK Query (`createApi`) has been removed.

## Layout

| File | Role |
| --- | --- |
| `app/api/apiClient.js` | `apiRequest`: token header, 20s timeout, `{data}` unwrapping, normalized `{status, message, data}` errors, 401 → `sessionCleared` (stale-token guarded), aborts responses if the session changed mid-flight |
| `app/api/createApiThunk.js` | `createFetchThunk` (reads, shares identical in-flight calls) and `createMutationThunk` (writes) |
| `app/api/thunkRegistry.js` | Tracks mounted subscriptions; mutations refetch the on-screen data whose `provides` tags they `invalidate` |
| `app/api/invalidationListener.js` | Listener middleware that triggers those refetches after a mutation thunk fulfils |
| `app/api/fetchState.js` | `{data, status, error}` entry shape, `addFetchCases`, `addSessionReset` |
| `app/thunkHooks.js` | `useFetchThunk` (fetch on mount/arg change, polling, refetch) and `useMutationThunk` (`[trigger, {isLoading}]`) |

## Where Redux code lives

Each portal owns the Redux code only it uses, in its existing `features/<portal>/` folder. Data several portals read lives once in `shared/`. Every folder follows the same trio: `*Thunks.js` (server calls), `*Slice.js` (state + selectors, only where state is stored), `*Hooks.js` (what components import).

| Location | Owns |
| --- | --- |
| `app/` | Global plumbing: store, `useAppDispatch`/`useAppSelector`, `thunkHooks`, `api/*` |
| `shared/auth` | Login, register, session check, profile, sign-out, session listeners |
| `shared/orders` | Order list/detail, public tracking, messages, mishap list, `sendOrderMessage` |
| `shared/hubs` | Hub list and hub detail reads |
| `shared/support` | Complaint, feedback and ticket list reads |
| `shared/notifications`, `shared/ui` | Notification feed/count and mutations; sidebar state |
| `features/customer` | `confirmDelivery`, `createComplaint`, `createFeedback` |
| `features/merchant` | `createOrder`, `cancelOrder`, `requestPricingQuote`, `createTicket` |
| `features/agent` | Profile, worklist, availability, `updateOrderStatus`, `completeDelivery`, `reportMishap`, portal UI state |
| `features/hub-manager` | Agents-for-hub, `updateOrder`, assign / auto-assign, warehouse scan, transfer, authorize return |
| `features/admin` | Users, pricing, revenue, expenses, hub CRUD, complaint / feedback / ticket moderation |

Rule of thumb: a write thunk lives with the one portal that calls it; a read that two or more portals use lives in `shared/`. Store keys: `auth, hubs, notifications, orders, support, ui` (shared) and `admin, agent, hubManager` (portals).

## Conventions

- Thunks reject with `{status, message, data}`; `dispatch(thunk(arg)).unwrap()` throws that object.
- Tags (`Order`, `Hub`, `Notification`, …) are coarse. A mutation's `invalidates` list was derived from the old `invalidatesTags`.
- Every slice resets on `sessionCleared` (sign-out / 401) and `sessionDataReset` (signed-in user changed).
- `completeDelivery` passes a `File` in the thunk argument; `meta.arg.photo` is excluded from the serializability check.
- The barcode Blob is fetched with `fetchOrderBarcodeBlob` and never stored in Redux.

## Verification

`eslint`, `vite build`, and the Playwright suites (`workflows.spec.mjs` 16/16, `redux-parity.spec.mjs` 12/12, run as separate processes because of the backend throttler) pass on branch `thunk-migration`.
