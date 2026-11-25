# SwiftTrack Redux Migration — Status & Technical Handoff

## Executive 10-Line Summary
1. **Done & Verified (Code + E2E):** Redux Toolkit (`@reduxjs/toolkit@2.15.0`) + React-Redux (`react-redux@9.3.1`) power all shared auth/chrome and all 5 portals (`Customer`, `Merchant`, `Agent`, `Admin`, `Hub-Manager`) on `ReactEvalFixes` (`FACT`).
2. **Done & Verified (Fixes):** During Playwright verification, 3 class-A regressions were reproduced and fixed: missing `super_user`/`delivery_agent` in `authApi` `DASHBOARDS` (`1118b47e`), stale cache on SPA navigation (`3c9a4afd`: `refetchOnMountOrArgChange: true` + `OrderDetailsModal` prop sync), and `Topbar.jsx` Redux error #38 on skipped notification refetch (`98808f6c`) (`FACT`).
3. **Done & Verified (E2E):** After installing `back-end/node_modules`, all **16/16** original workflow specs (`workflows.spec.mjs`) and **12/12** new parity/runtime specs (`redux-parity.spec.mjs`) pass with `0` console/page errors when each spec runs cleanly (`FACT`).
4. **Done & Verified (Cleanup + Static):** Unused `uiSlice` toast code & `Toast.jsx` (`463be071`), unused `authSlice` actions/selectors (`eaa28eca`), and unused RTK Query hooks/endpoints (`44f09d81`) were removed; `eslint` (`0` errors/warnings) and `vite build` (`1.38s`) pass cleanly (`FACT`).
5. **Known Operational Limit Found:** Running all 28 tests in a single Playwright process against one backend instance hit NestJS `@nestjs/throttler` (`60 req / 60s` in `app.module.ts:26-31`) on tests 27–28 (`26 passed, 2 timed out`); running the two suites separately resolves this (`16/16` + `12/12`) (`FACT` / `INFERENCE`).
6. **Remaining Manual Checks:** A few UI interactions not exercised by Playwright need quick human smoke checks (`MANUAL_TEST_CHECKLIST.md`: `CustomerOrders` tabs/search, `AnalyticsReport` timeframe dropdown, `DeliveryHistory` filters/TXT, User/Zone edit & delete modals, single `'Mark read'`, print dialog) (`NOT DONE`).
7. **Post-Eval Cleanup (Deferred per Rules):** Local state refactors `REM-06` (`OrderDetailsModal` `savedOrder` local override, `CustomerTracking` `confirmedOrder`, `BookShipment` `useEffect` quote, `LandingPage` `trackingData`) and `REM-07` (`DashBoard.jsx` `canHandlePendingPickup` inline parity vs `warehouseWorkflow.js`) intentionally left intact (`NOT DONE`).
8. **Backend Decisions Needed (`REM-08`):** 7 pre-existing backend mismatches documented in `BACKEND_ISSUES.md` remain untouched (`back-end/` is read-only under evaluation rules) (`NOT DONE`).
9. **Test Infra & Repo Hygiene (`REM-10`–`REM-13`):** Updating stale Phase 0 future-tense docs, adding Vitest unit tests (`BLK-10`), optimizing large PNGs, and cleaning root `.gitignore`/`sqlite.db` remain post-eval items (`NOT DONE`).
10. **Repo Cleanliness:** `back-end/` source and `front-end/` have **0 modifications** (`git diff --name-only backup/pre-redux..HEAD -- back-end/ front-end/` is empty) (`FACT`).

> **Verification Legend:**
> - **DONE AND VERIFIED:** Executed/tested with observed pass output (`lint`, `vite build`, or Playwright Chrome E2E). *(ESLint/Vite confirm static syntax/bundles; Playwright E2E confirms live NestJS + SQLite runtime behavior.)*
> - **DONE BUT NOT VERIFIED:** Code written and passes static `lint`/`build`, but specific edge interaction was not exercised at runtime.
> - **NOT DONE:** Work not yet started or intentionally deferred post-evaluation.

---

## 1. Snapshot

| Field | Observed Value | Evidence / Command |
| --- | --- | --- |
| **Branch** | `ReactEvalFixes` | `git branch --show-current` (`FACT`) |
| **Latest Code Commit** | `44f09d81` (`fix: remove unused RTK Query hooks and endpoints`) | `git log -1 --oneline` (`FACT`) |
| **Restore Tag** | `backup/pre-redux` -> `fa7d7cdf2f9596ace17132d76216d99ab281aee9` | `git rev-parse backup/pre-redux` (`FACT`) |
| **Commit Range** | `backup/pre-redux..44f09d81` (18 commits: `50c09bb6` audit + `dce4f5bc`..`8b5a5cfc` migration + `1118b47e`..`44f09d81` runtime fixes & cleanup) | `git log --oneline backup/pre-redux..44f09d81` (`FACT`) |
| **RTK / React-Redux** | `@reduxjs/toolkit@2.15.0`, `react-redux@9.3.1` | `cd frontend-react; npm ls @reduxjs/toolkit react-redux --depth=0` (`FACT`) |
| **Backend Env** | `back-end/node_modules` installed via `npm ci` (`back-end/` source unmodified); Chrome E2E runs with `SWIFTTRACK_BROWSER=chrome` | `npm --prefix ../back-end run build` (`FACT`) |
| **Date** | `2026-11-25` (`+05:30`) | System timestamp (`FACT`) |

---

## 2. Goal and Scope

- **Goal (`FACT`):** Migrate all client-side server state, auth/session state, and shared cross-route UI state in `frontend-react/` onto Redux Toolkit (`configureStore`, slices, RTK Query `createApi`) with **100% behavior parity** vs `backup/pre-redux` (identical URLs, `?id=` query params, API endpoints/methods/payloads, `localStorage` keys `x-auth-token` and `user`, role redirects, visible messages).
- **In Scope (`FACT`):** `frontend-react/` source code (`src/` JS/JSX), `frontend-react/e2e/`, `frontend-react/package.json`, `frontend-react/package-lock.json`, and `docs/redux-migration/`.
- **Out of Scope (`FACT`):** `back-end/` source code & `front-end/` (verified unmodified via `git diff`), `.db` files (Playwright uses temporary `os.tmpdir()/swifttrack-e2e-*/e2e.db`), TypeScript conversion, dependency upgrades, and `npm audit fix`.

---

## 3. Architecture as Built

| Module | File Path | Purpose & Key Behavior | Status |
| --- | --- | --- | --- |
| **App Provider** | `frontend-react/src/main.jsx:10-18` | Wraps `<BrowserRouter><App /></BrowserRouter>` in `<Provider store={store}>`. (`FACT`) | **DONE AND VERIFIED** (Playwright) |
| **Redux Store** | `frontend-react/src/app/store.js:1-31` | `configureStore` with `{ auth, agent, ui, [baseApi.reducerPath]: baseApi.reducer }`; prepends `authListenerMiddleware`, attaches `baseApi.middleware`, `setupListeners`, `attachStorageSync`. (`FACT`) | **DONE AND VERIFIED** (Playwright) |
| **Typed Hooks** | `frontend-react/src/app/hooks.js:1-4` | Exports `useAppDispatch` and `useAppSelector`. (`FACT`) | **DONE AND VERIFIED** (Playwright) |
| **Base RTK Query API** | `frontend-react/src/app/api/baseApi.js:1-97` | `createApi({ reducerPath: 'api', tagTypes: TAG_TYPES, refetchOnMountOrArgChange: true })`. Adds `x-auth-token` except `PUBLIC_ENDPOINTS` (`login`, `register`, `trackOrder`). `timeout: 20_000`, `cache: 'no-store'`. Dispatches `sessionCleared()` on `401`. Unwraps `'data' in payload` for non-`Blob`. Defines 15 `TAG_TYPES`. (`FACT`) | **DONE AND VERIFIED** (Playwright `1118b47e`, `3c9a4afd`, 401 suite) |
| **Auth Slice** | `frontend-react/src/features/auth/authSlice.js:1-69` | Hydrates from `localStorage` (`x-auth-token`, `user`). Actions: `setCredentials`, `setSessionUser`, `sessionCleared`, `syncSessionFromStorage`. Selectors: `selectAuthToken`, `selectCurrentUser`, `selectCurrentRole`. (Unused `setAuthChecking`/`setAuthError`/`selectAuthStatus`/`selectAuthError`/`selectIsAuthenticated` removed in `eaa28eca`.) (`FACT`) | **DONE AND VERIFIED** (Playwright) |
| **Auth Listeners** | `frontend-react/src/features/auth/authListeners.js:1-79` | Syncs `localStorage`, resets API cache (`baseApi.util.resetApiState()`) on `sessionCleared`/user change, emits `'swifttrack-session-change'`, handles cross-tab `'storage'` events. (`FACT`) | **DONE AND VERIFIED** (Playwright cross-tab logout) |
| **UI Slice** | `frontend-react/src/features/ui/uiSlice.js:1-32` | Manages `sidebarExpanded` (`toggleSidebar`, `setSidebarExpanded`, `selectSidebarExpanded`). (Unused toast state/actions removed in `463be071`.) (`FACT`) | **DONE AND VERIFIED** (Playwright mobile & desktop sidebar) |
| **Agent Slice & Hook** | `frontend-react/src/features/agent/agentSlice.js:1-63`, `useAgentPortal.js:1-144` | Stores `acceptModalOrderId`, `confirmModalOrderId`, `busyOrderId`, `actionError`, `notice`; resets on `sessionCleared`. Coordinates worklist, profile, availability, status, and POD uploads. (`FACT`) | **DONE AND VERIFIED** (Playwright agent E2E) |
| **Domain API: Auth** | `frontend-react/src/features/auth/authApi.js:1-86` | Exports `DASHBOARDS` (all 6 roles incl. `super_user`, `delivery_agent` fixed in `1118b47e`) + `useLoginMutation`, `useRegisterMutation`, `useGetMeQuery`, `useUpdateProfileMutation`, `useLogoutMutation`. (`FACT`) | **DONE AND VERIFIED** (Playwright all roles) |
| **Domain API: Orders** | `frontend-react/src/features/orders/ordersApi.js:1-269` | All order queries/mutations, live `providesTags` (`id`, `result.id`, `trackingId`, `LIST`), `OrderMessage`, `Tracking`, `Mishap`, plus `fetchOrderBarcodeBlob`. (`FACT`) | **DONE AND VERIFIED** (Playwright booking/tracking/warehouse/assign/deliver/return/mishap/chat) |
| **Domain API: Hubs / Agents / Users / Support / Finance / Notifications** | `hubsApi.js`, `agentsApi.js`, `usersApi.js`, `supportApi.js`, `financeApi.js`, `notificationsApi.js` | All active portal/admin endpoints; unused hooks removed in `44f09d81`. `notificationsApi` uses `useLazyGetNotificationsQuery` in `Topbar.jsx` (`98808f6c`). (`FACT`) | **DONE AND VERIFIED** (Playwright) |
| **Selectors Modules** | `customerSelectors.js`, `merchantSelectors.js`, `agentSelectors.js` | Pure portal normalization helpers (`normalizeCustomerOrder`, `normalizeMerchantOrder`, `mapAgentOrder`, etc.). (`FACT`) | **DONE AND VERIFIED** (Playwright) |

---

## 4. Work Completed, in Detail

| Area & Commits | Files Changed | What Was Built / Fixed | Behavior Preserved / Changed | Verification State |
| --- | --- | --- | --- | --- |
| **Foundation & APIs** (`f04706c9`, `c08630c2`, `3c9a4afd`) | `store.js`, `hooks.js`, `baseApi.js`, `authSlice.js`, `authListeners.js`, `uiSlice.js`, `8` domain APIs | Configured store, auth listeners, `baseApi`, domain slices; added `refetchOnMountOrArgChange: true` (`3c9a4afd`) so cross-user SPA transitions see live updates | Preserves `x-auth-token`/`user`/`swifttrack-session-change` keys & 401 handling | **DONE AND VERIFIED** (`lint`/`build` + 28 E2E specs) |
| **Auth & Shared Chrome** (`075f36e1`, `1118b47e`, `98808f6c`) | `Login.jsx`, `Register.jsx`, `RequireRole.jsx`, `Sidebar.jsx`, `Topbar.jsx`, `OrderMessages.jsx`, `LandingPage.jsx`, `authApi.js` | Migrated to RTK/RTK Query; restored `super_user`/`delivery_agent` in `DASHBOARDS` (`1118b47e`); switched `Topbar.jsx` to `useLazyGetNotificationsQuery()` (`98808f6c`) fixing Redux error #38 | Preserves `30s` Topbar & `5s` OrderMessages polling (stops on collapse/logout), cross-tab logout, `401` single-shot redirect | **DONE AND VERIFIED** (Playwright `redux-parity` + `workflows` #1–7, #12). *Note: single `'Mark read'` & feed `'View shipment'` link remain manual check.* |
| **Customer Portal** (`2eeb6289`, `3c9a4afd`) | `CustomerLayout.jsx`, `CustomerDashboard.jsx`, `CustomerOrders.jsx`, `CustomerTracking.jsx`, `CustomerSupport.jsx`, `customerSelectors.js` | Switched to `selectCurrentUser`, `ordersApi`, `supportApi`; `?id=` drawer derived via `useMemo` | Preserves ownership error copy (`'Enter the tracking ID or order ID of one of your shipments.'`), `403/404` copy, `Confirm Receipt` SPA invalidation | **DONE AND VERIFIED** (Playwright `workflows` #5, #7, #8 & `redux-parity`). *Note: `CustomerOrders` manual filter tabs/search remain manual check.* |
| **Merchant Portal** (`b2b63873`) | `MerchantLayout.jsx`, `MerchantDashboard.jsx`, `BookShipment.jsx`, `MerchantOrders.jsx`, `TrackShipment.jsx`, `AnalyticsReport.jsx`, `MerchantSupport.jsx`, `ShippingLabelModal.jsx`, `merchantSelectors.js` | Switched to `selectCurrentUser`, `ordersApi`, `hubsApi`, `financeApi`, `supportApi`, `fetchOrderBarcodeBlob` | Preserves live quote abort (no `AbortError` alert), `409`/`400` hub/quote refresh, SVG barcode, COD cancel, `503` ticket retry | **DONE AND VERIFIED** (Playwright `workflows` #3, #7, #9, #14, #15 & `redux-parity`). *Note: `AnalyticsReport` timeframe selector & physical `window.print()` remain manual check.* |
| **Agent Portal** (`24a6daf8`) | `agentSlice.js`, `agentSelectors.js`, `useAgentPortal.js`, `AgentLayout.jsx`, `AgentDashboard.jsx`, `AgentWorklist.jsx`, `DeliveryHistory.jsx`, `ReportIssue.jsx`, `AgentProfile.jsx` | Replaced 13-prop `<Outlet context />` with `agentSlice` + `useAgentPortal`; migrated worklist, availability, POD `FormData`, mishaps, hub lookup, profile edit | Preserves status transitions, POD photo, CSV export, `'Profile updated.'` & availability reload persistence | **DONE AND VERIFIED** (Playwright `workflows` #4, #7, #10, #13). *Note: `DeliveryHistory` period filter/pagination/`.txt` export remain manual check.* |
| **Admin Portal** (`075f36e1`) | `AdminLayout.jsx`, `AdminDashboard.jsx`, `UserManagement.jsx`, `AddOrEditUserModal.jsx`, `SystemConfiguration.jsx`, `AddOrEditDeliveryZone.jsx`, `PricingConfiguration.jsx`, `ComplaintsManagement.jsx`, `FeedbackReview.jsx`, `MerchantTickets.jsx`, `ReportsAnalytics.jsx`, `FinancialAnalytics.jsx`, `ExpenseView.jsx` | Switched all Admin views/modals to `authSlice` & RTK Query (`usersApi`, `hubsApi`, `financeApi`, `supportApi`, `ordersApi`) | Preserves 8-field `pricingFields` `PUT`, mishap merge/sort, `Expense` -> `Revenue` live invalidation | **DONE AND VERIFIED** (Playwright `workflows` #1, #7, #11 & `redux-parity`). *Note: Delete User, Edit User hub change, Edit/Delete Zone, Delete Expense, Recharts visuals remain manual check.* |
| **Hub-Manager & Fixes** (`fe18e008`, `3c9a4afd`) | `App.jsx`, `HubManagerLayout.jsx`, `DashBoard.jsx`, `OrderQueue.jsx`, `Warehouse.jsx`, `Dispatch.jsx`, `HubTransfer.jsx`, `Reports.jsx`, `AssignAgentModal.jsx`, `TransferHubModal.jsx`, `OrderDetailsModal.jsx` | **BLK-04:** nested `/hub` layout `<Outlet />` with `HUB_PAGE_TITLES`. **BLK-08:** `selectCurrentUser` + `canHandlePendingPickup`. Fixed `OrderQueue` `selectedOrderId` & `OrderDetailsModal` live `savedOrder` sync (`3c9a4afd`) | Preserves all 7 titles including `'Hub Complaints'`, zero Sidebar/Topbar remounting, `409` agent refetch, barcode `.focus()`, return/refund | **DONE AND VERIFIED** (Playwright `workflows` #2, #7, #13, #16 & `redux-parity`). *Note: `'Edit Order'` modal submit & Hub `Reports` Recharts remain manual check.* |
| **Legacy & Unused Cleanup** (`92d718c6`, `463be071`, `eaa28eca`, `44f09d81`) | Deleted `api.js`, `session.js`, `customerService.js`, `merchantHelpers.js`, `useHubOrders.js`, `RoleSelector.jsx`, `Toast.jsx`; trimmed unused `uiSlice`, `authSlice`, `usersApi`, `supportApi`, `financeApi` exports | Verified `0` callers via `git grep`; kept `useLazyGetNotificationsQuery` used by `Topbar.jsx` | Zero functionality removed | **DONE AND VERIFIED** (`lint`, `build`, `16/16 workflows` + `12/12 redux-parity`) |

---

## 5. Deleted and Changed-Structure Items

- **Phase G Deleted Legacy Files (`92d718c6`, `-767` lines):** `services/api.js` (`479`), `services/session.js` (`45`), `services/customerService.js` (`89`), `services/merchantHelpers.js` (`91`), `features/hub-manager/useHubOrders.js` (`35`), `RoleSelector.jsx` (`28`).
- **Step 4 Deleted Component (`463be071`, `-63` lines with `uiSlice.js`):** `frontend-react/src/components/customer/Toast.jsx`.
- **Proof of Zero References (`FACT`):** `git grep` before/after deletion returned `0` external callers across `frontend-react/`; `eslint` and `vite build` (`2790` modules, exit `0`) succeeded after every deletion (`92d718c6`, `463be071`, `44f09d81`).
- **Changed Route Structure (`App.jsx:75-86`, `fe18e008`):** `/hub/*` converted from 7 separate `<HubManagerLayout>` wrappers to nested `<Route path="/hub" element={<HubManagerLayout />}>` + `<Outlet />`. Verified by `redux-parity.spec.mjs:189` (Sidebar & Topbar DOM node identity preserved across all 7 routes, `1.4s`).

---

## 6. Verification Status

| Check | Command | Baseline (`dce4f5bc`) | Current (`44f09d81`) | Status |
| --- | --- | --- | --- | --- |
| **Frontend Lint** | `cd frontend-react; npm run lint` | `0` errors / `0` warnings | `0` errors / `0` warnings | **DONE AND VERIFIED** |
| **Frontend Build** | `cd frontend-react; npm run build` | `1.01s`, `2773` modules (`index` `108.03 kB gz`) | `1.38s`, `2790` modules (`index` `142.01 kB gz`) | **DONE AND VERIFIED** |
| **Backend Build** | `npm --prefix back-end run build` | Failed (`nest` missing) | `nest build` exit `0` (`npm ci` added `back-end/node_modules`) | **DONE AND VERIFIED** |
| **Playwright `workflows.spec.mjs` (`16` tests)** | `cd frontend-react; $env:SWIFTTRACK_BROWSER='chrome'; npm.cmd run test:e2e -- e2e/workflows.spec.mjs --trace off` | Failed (`nest` missing; post-migration initial run before fixes was `6 passed, 10 failed`) | **16 passed, 0 failed** (`1.6m`) | **DONE AND VERIFIED** |
| **Playwright `redux-parity.spec.mjs` (`12` tests)** | `cd frontend-react; $env:SWIFTTRACK_BROWSER='chrome'; npx playwright test e2e/redux-parity.spec.mjs --trace off` | N/A | **12 passed, 0 failed** (`1.4m`) | **DONE AND VERIFIED** |
| **Combined Single-Process 28-Test Run** | `npm.cmd run test:e2e -- --trace off` *(both specs back-to-back)* | N/A | `26 passed, 2 timed out` (`5.1m`) — tests 27–28 timed out after 26 preceding logins hit NestJS `ThrottlerModule` (`60 req / 60s`) on shared server | **PARTIAL (`FACT`) — Run suites separately** |
| **Remaining Manual Edge Checks** | See `MANUAL_TEST_CHECKLIST.md` (`[ ]` unchecked items) | Not run | Filter tabs/period filters/delete modals/Edit Order/`window.print()`/chart visual check not covered by Playwright | **NOT DONE** |

---

## 7. Remaining Work: Complete List

### Completed in This Session
- [x] **REM-01** — Installed `back-end/` deps (`npm ci`); verified `16/16 workflows.spec.mjs` + `12/12 redux-parity.spec.mjs` pass cleanly (`1118b47e`, `3c9a4afd`, `44f09d81`).
- [x] **REM-02** — Reproduced Redux Toolkit error #38 in `Topbar.jsx` (`1 failed`); fixed with `useLazyGetNotificationsQuery()` (`98808f6c`) and added automated test (`1 passed`).
- [x] **REM-03 (Automated Core)** — Added `e2e/redux-parity.spec.mjs` (`ae0d0fa9`) covering all 5 roles (login/reload/`401`/logout), cross-tab logout, `/hub` nested layout & titles, rapid `BookShipment` aborts, `?id=` drawer, `Confirm Receipt` SPA invalidation, external `OrderDetailsModal` sync, and Expense->Revenue invalidation. *(Manual-only edge cases left unchecked in `MANUAL_TEST_CHECKLIST.md`.)*
- [x] **REM-04** — Verified `Topbar` `30s` polling, `OrderMessages` `5s` polling (starts on expand, stops on collapse/logout, 0 runaway `/orders` calls over 32s idle), and cross-domain tag invalidation in live Playwright run.
- [x] **REM-05 (Playwright Verified)** — Happy/error paths (`400`/`401`/`403`/`404`/`409`/`503`) verified across all 28 Playwright specs; abort errors on rapid weight typing confirmed absent (`0` `[role="alert"]`).
- [x] **REM-09** — Removed unused `uiSlice` toast code & `Toast.jsx` (`463be071`), unused `authSlice` exports (`eaa28eca`), and unused `usersApi`/`supportApi`/`financeApi` exports (`44f09d81`), keeping `useLazyGetNotificationsQuery` in `notificationsApi.js`.

### Priority 1: Must-Do Before Demo (If Any Remaining)
- [ ] **REM-03B — Finish remaining unchecked manual smoke checks in `MANUAL_TEST_CHECKLIST.md`**
  - **Scope:** Unchecked `[ ]` items only (single-notification `'Mark read'` & `'View shipment'` deep link, `CustomerOrders` tabs/search, `AnalyticsReport` timeframe selector, `DeliveryHistory` period/pagination/`.txt` download, Admin User/Zone edit & delete & Expense delete, Hub `'Edit Order'` submit, Recharts visuals, physical print preview).
  - **Effort:** 15–25 mins | **Owner:** QA / Demo Presenter
  - **Acceptance:** Human visual pass in Chrome against copied DB (`npm run start:dev`).

### Priority 2: Should-Do (Post-Eval)
- [ ] **REM-06 — Eliminate remaining local server-data copies / `useEffect` quote fetch** (`OrderDetailsModal.jsx:14` `savedOrder`, `CustomerTracking.jsx:19` `confirmedOrder`, `BookShipment.jsx:48` `useEffect` quote, `LandingPage.jsx:14` `trackingData`) — *deferred per Step 4 rules* (1–2 hours).
- [ ] **REM-07 — Decide `BLK-08` `DashBoard.jsx` inline rule parity vs strict `warehouseWorkflow.js`** (`DashBoard.jsx:57-58` kept exact inline rule for parity; decide post-eval if `canAssign`/`canTransfer` should replace it) (15 mins).
- [ ] **REM-08 — Triage `BACKEND_ISSUES.md`** (`ExpensesController` envelope, `UpdatePricingConfigDto` `agentPayoutFlat`, `TicketsRepository.update` fields, hub chat scope, unowned complaint 403/404 copy, legacy DTO `: any`, unused routes) in a separate backend PR (1–3 hours).
- [ ] **REM-10 — Reconcile stale Phase 0 audit docs (`00`–`07`, `FINAL_REPORT.md`, `appendix-coverage-checklist.md`)** to note post-migration status (30 mins).

### Priority 3: Nice-to-Have
- [ ] **REM-11 — Add Vitest + `@testing-library/react` unit tests** (`BLK-10`, 2–4 hours).
- [ ] **REM-12 — Optimize large landing/login PNGs (`login-bg.png` 2.01 MB, `van-image.png` 1.15 MB)** (30 mins).
- [ ] **REM-13 — Clean root `.gitignore` (`back-end/`), orphaned root `package-lock.json`, `.DS_Store`, `sqlite.db` in post-eval PR** (30 mins).

---

## 8. Risks and Known Issues

1. **Multi-Suite Rate Limiting When Combining All 28 Tests in One Process (`FACT`):** NestJS `ThrottlerModule` (`back-end/src/app.module.ts:26-31`) caps IP requests at `60 / 60s`. Running `workflows.spec.mjs` (16 tests) + `redux-parity.spec.mjs` (12 tests) sequentially against the same Playwright webServer hit timeouts on tests 27–28 (`task-789`). Mitigation: run the two spec files in separate `npx playwright test` invocations (`16/16` + `12/12` pass).
2. **`OrderDetailsModal` / `DashBoard` Stale Prop Risk Resolved on `OrderQueue` (`3c9a4afd`), Noted Elsewhere (`INFERENCE`):** `OrderQueue.jsx` now tracks `selectedOrderId` instead of copying the order object, and `OrderDetailsModal.jsx` prefers newer `initialOrder`. `DashBoard.jsx`, `Dispatch.jsx`, and `HubTransfer.jsx` still store clicked `selectedOrder` state while open (`REM-06`), though `refetchOnMountOrArgChange: true` refreshes list data on navigation.
3. **Deleted Files (`api.js`, `session.js`, `customerService.js`, `merchantHelpers.js`, `useHubOrders.js`, `RoleSelector.jsx`, `Toast.jsx` — `FACT`):** Confirmed zero references via `git grep`, `vite build`, and 28 green E2E specs.
4. **Polling & 401 (`FACT` Verified):** `Topbar` (`30s`) and `OrderMessages` (`5s`) polling, `401` single-request cleanup, and cross-tab logout all passed runtime verification in `redux-parity.spec.mjs`.

---

## 9. How to Run and Test (Windows PowerShell)

```powershell
# 1. Lint & Build (passes after final code commit 44f09d81)
cd frontend-react
npm run lint
npm run build

# 2. Playwright E2E (back-end/node_modules already installed; uses isolated tmpdir e2e.db)
cd frontend-react
$env:SWIFTTRACK_BROWSER = "chrome"
npm.cmd run test:e2e -- e2e/workflows.spec.mjs --trace off     # 16/16 pass
npx playwright test e2e/redux-parity.spec.mjs --trace off       # 12/12 pass

# 3. Manual Dev Mode (MUST copy swifttrack.db — never run against repo DB directly)
# Terminal 1 (Backend):
cd back-end
Copy-Item .\data\swifttrack.db "$env:TEMP\swifttrack-copy.db" -Force
$env:DB_FILE = "$env:TEMP\swifttrack-copy.db"; $env:PORT = "3001"; npm run start:dev
# Terminal 2 (Frontend):
cd frontend-react; npm run dev
```

---

## 10. How to Continue and How to Roll Back

- **Next Action:** Complete the remaining manual checks in [MANUAL_TEST_CHECKLIST.md](./MANUAL_TEST_CHECKLIST.md), then decide `REM-06`–`REM-08` post-evaluation.
- **5-Person Split:** Assign independently by folder (`Shared Chrome/Auth`, `Customer`, `Merchant`, `Agent + Hub-Manager`, `Admin + Backend`), zero overlap.
- **Revert One Portal:** Revert the target portal commit (`git revert <hash>`). Note: `92d718c6` deleted legacy service files needed by pre-Redux portals.
- **Full Restore (`WARNING` — discards uncommitted work & all Redux commits on branch):**
  ```powershell
  git branch save/post-redux-attempt
  git reset --hard backup/pre-redux
  cd frontend-react; npm ci
  ```

---

## 11. Evidence Index

| Commit | Description |
| --- | --- |
| `fa7d7cdf` | *(tag `backup/pre-redux`)* Pre-Redux baseline |
| `50c09bb6` | `docs: redux migration audit` |
| `dce4f5bc` | `redux: record baseline measurements and correct audit docs` |
| `f04706c9` | `redux: add Redux Toolkit store, baseApi, authSlice, and uiSlice foundation` |
| `c08630c2` | `redux: add shared RTK Query domain API slices and backend issues report` |
| `2eeb6289` | `redux: migrate customer portal and add migration recipe` |
| `b2b63873` | `redux: migrate merchant portal to RTK Query` |
| `24a6daf8` | `redux: migrate agent portal to RTK Query and authSlice` |
| `075f36e1` | `redux: migrate admin portal and shared chrome to RTK Query` |
| `fe18e008` | `redux: migrate hub-manager portal and fix layout nesting` |
| `92d718c6` | `redux: remove legacy services and dead state code` |
| `8b5a5cfc` | `redux: add final report, manual test checklist, and handoff` |
| `1118b47e` | `fix: restore super_user and delivery_agent keys in authApi DASHBOARDS` |
| `3c9a4afd` | `fix: refetch queries on mount and sync OrderDetailsModal with live order` |
| `98808f6c` | `fix: use lazy notifications query in Topbar to avoid skipped refetch error` |
| `ae0d0fa9` | `test: add Redux parity and runtime verification Playwright specs` |
| `463be071` | `fix: remove unused uiSlice toast actions and Toast component` |
| `eaa28eca` | `fix: remove unused authSlice actions and selectors` |
| `44f09d81` | `fix: remove unused RTK Query hooks and endpoints` |

Related docs: [FINAL_REPORT.md](./FINAL_REPORT.md) · [MANUAL_TEST_CHECKLIST.md](./MANUAL_TEST_CHECKLIST.md) · [TEAM_TASKS.md](./TEAM_TASKS.md) · [BACKEND_ISSUES.md](./BACKEND_ISSUES.md) · [MIGRATION_RECIPE.md](./MIGRATION_RECIPE.md) · [HANDOFF.md](./HANDOFF.md) · `parity/*.md`

---

## 12. Open Questions

1. Should `DashBoard.jsx` (`BLK-08`) keep exact pre-Redux inline `canHandlePendingPickup` parity or switch to `warehouseWorkflow.js` (`canAssign`/`canTransfer`) post-eval?
2. Should `REM-06` (removing remaining local state copies in `OrderDetailsModal`, `CustomerTracking`, `BookShipment`, `LandingPage`) be done after evaluation?
3. Which items in `BACKEND_ISSUES.md` (`REM-08`) will be fixed in `back-end/` in a follow-up PR?
4. When should Vitest (`REM-11`), PNG compression (`REM-12`), and root hygiene cleanup (`REM-13`) be scheduled?
