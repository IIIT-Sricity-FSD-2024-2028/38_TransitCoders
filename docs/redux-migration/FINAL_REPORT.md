# SwiftTrack Redux Migration — Final Report

**Branch:** `ReactEvalFixes` (restore tag `backup/pre-redux` untouched)  
**Stack:** React `19.2.8` (`frontend-react/`) + `@reduxjs/toolkit@2.15.0` + `react-redux@9.3.1` + Vite `8.3.0`  
**Language:** JavaScript only (no TypeScript conversion)  
**Backend (`back-end/`) & Legacy Static (`front-end/`):** Untouched

---

## 1. Executive Outcome (FACT)

All client-side server state and shared authentication/UI state in `frontend-react/` has been migrated onto a single Redux Toolkit store (`configureStore`) with slices and RTK Query (`baseApi` + domain endpoint injection). Legacy imperative services (`services/api.js`, `services/session.js`, `services/customerService.js`, `services/merchantHelpers.js`), `features/hub-manager/useHubOrders.js`, and dead `RoleSelector.jsx` were verified to have zero remaining callers via `git grep` and removed in commit `92d718c6`.

### Commit Trail (`backup/pre-redux..HEAD`)
1. `50c09bb6` — `docs: redux migration audit`
2. `dce4f5bc` — `redux: record baseline measurements and correct audit docs`
3. `f04706c9` — `redux: add Redux Toolkit store, baseApi, authSlice, and uiSlice foundation`
4. `c08630c2` — `redux: add shared RTK Query domain API slices and backend issues report`
5. `2eeb6289` — `redux: migrate customer portal and add migration recipe`
6. `b2b63873` — `redux: migrate merchant portal to RTK Query`
7. `24a6daf8` — `redux: migrate agent portal to RTK Query and authSlice`
8. `075f36e1` — `redux: migrate admin portal and shared chrome to RTK Query`
9. `fe18e008` — `redux: migrate hub-manager portal and fix layout nesting`
10. `92d718c6` — `redux: remove legacy services and dead state code`

---

## 2. Redux Store & API Architecture (FACT)

| Module | Purpose | File |
| --- | --- | --- |
| Store Configuration | Combines `auth`, `agent`, `ui`, `baseApi.reducer`; prepends `authListenerMiddleware`, attaches `baseApi.middleware`, `setupListeners`, and cross-tab storage sync | `frontend-react/src/app/store.js` |
| Typed Hooks | `useAppDispatch`, `useAppSelector` | `frontend-react/src/app/hooks.js` |
| Shared Base API | `createApi` (`reducerPath: 'api'`), `x-auth-token` header injection (except `PUBLIC_ENDPOINTS`), 20s timeout, `cache: 'no-store'`, `401 -> sessionCleared()`, `{ data }` unwrap, 15 tag types | `frontend-react/src/app/api/baseApi.js` |
| Auth State & Persistence | `authSlice` (`x-auth-token` & `user` in `localStorage` under exact legacy keys) + `authListeners` (`baseApi.util.resetApiState()` on logout/user switch + `'swifttrack-session-change'`/`'storage'` sync) | `frontend-react/src/features/auth/authSlice.js`, `authListeners.js`, `authApi.js` |
| Global UI State | Sidebar expanded toggle + toast state | `frontend-react/src/features/ui/uiSlice.js` |
| Agent Portal State | Serialized modal selection, busy order guard, banner notice/error (replaces 13-prop `<Outlet context />`, resets on `sessionCleared`) | `frontend-react/src/features/agent/agentSlice.js`, `useAgentPortal.js`, `agentSelectors.js` |
| Domain RTK Query APIs | `ordersApi` (+ non-Redux `fetchOrderBarcodeBlob`), `hubsApi`, `agentsApi`, `usersApi`, `supportApi`, `financeApi`, `notificationsApi` | `frontend-react/src/features/<domain>/<domain>Api.js` |

---

## 3. Portal & Architecture Summary

- **Customer Portal (`parity/customer.md`):** Migrated `CustomerLayout`, `CustomerDashboard`, `CustomerOrders`, `CustomerTracking`, and `CustomerSupport`; added pure normalizers in `customerSelectors.js`. Preserved `?id=` drawer handling without `useEffect` `setState`, `403`/`404` error wording, and support order-ownership pre-check (`'Enter the tracking ID or order ID of one of your shipments.'`).
- **Merchant Portal (`parity/merchant.md`):** Migrated `MerchantLayout`, `MerchantDashboard`, `BookShipment`, `MerchantOrders`, `TrackShipment`, `AnalyticsReport`, `MerchantSupport`, and `ShippingLabelModal`. Added `merchantSelectors.js`. Preserved `ShippingLabelModal` `Blob` handling outside Redux (`fetchOrderBarcodeBlob`), aborted quote requests on dependency changes, and `409`/`400` hub/quote refresh without clearing form state.
- **Agent Portal (`parity/agent.md`):** Eliminated 13-prop `<Outlet context={...} />` prop drilling via `agentSlice` + `useAgentPortal` hook; migrated `AgentLayout`, `AgentDashboard`, `AgentWorklist`, `DeliveryHistory`, `ReportIssue`, and `AgentProfile`.
- **Admin Portal & Shared Chrome (`parity/admin.md`):** Migrated `Login`, `Register`, `RequireRole`, `Sidebar`, `Topbar` (30s notification count polling), `OrderMessages` (5s chat polling), `LandingPage` (public tracking), and all 8 Admin pages + 3 Admin modals/panels. `PricingConfiguration` preserves sending only the 8 whitelisted pricing fields (`BACKEND_ISSUES.md #2`).
- **Hub-Manager Portal (`parity/hub-manager.md`):**
  - **BLK-04 fixed (`App.jsx`, `HubManagerLayout.jsx`):** Converted `/hub/*` from flat per-page `<HubManagerLayout>` wrappers to a nested layout route (`<Route path="/hub" element={<HubManagerLayout />}>`) with `<Outlet />` and pathname-based Topbar titles.
  - **BLK-08 fixed (`DashBoard.jsx`):** Replaced `useHubOrders`/`getSessionUser` with `selectCurrentUser` + RTK Query `useGetOrdersQuery` and `useGetAgentsForHubQuery` while keeping identical `canHandlePendingPickup` eligibility checks.
  - Migrated `OrderQueue`, `Warehouse`, `Dispatch`, `HubTransfer`, `Reports`, `AssignAgentModal`, `TransferHubModal`, and `OrderDetailsModal`.

---

## 4. Verification Status

| Check | Result | Notes |
| --- | --- | --- |
| `npm run lint` (`frontend-react/`) | **PASS** (`0` errors, `0` warnings) | Run after every phase including final deletion commit `92d718c6`. |
| `npm run build` (`frontend-react/`) | **PASS** (`1.56s`, `0` errors) | Baseline `index`: `108.03 kB` gz; Final `index`: `142.15 kB` gz (includes `@reduxjs/toolkit` + `react-redux`). Legacy `api`/`session`/`customerService`/`merchantHelpers`/`useHubOrders` chunks removed. |
| Static Legacy-Reference Scan | **PASS** (`0` callers) | `git grep` confirmed zero remaining imports of removed legacy files; `fetch(` remains only in `baseApi.js` and `ordersApi.js:fetchOrderBarcodeBlob`. |
| Playwright E2E (`npm run test:e2e`) | **NOT VERIFIED** | Fails on prebuild step `npm --prefix ../back-end run build` with `'nest' is not recognized as an internal or external command` because `back-end/node_modules` is absent and `back-end/` is out of scope/unmodified. |

**ASSUMPTION / PENDING VALIDATION:** Runtime behavior parity across live API calls, Playwright E2E scenarios, polling intervals, and tag invalidation requires running the backend server + Playwright E2E against a copy of `back-end/data/swifttrack.db` (see `MANUAL_TEST_CHECKLIST.md`).
