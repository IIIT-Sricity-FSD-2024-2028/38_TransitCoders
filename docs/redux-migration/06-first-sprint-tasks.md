# 06 — Concrete First-Sprint Task List

> Ready-to-assign checklist covering **Phase 1 (Review & Decide)**, **Phase 2 (Safety Net)**, **Phase 3 (Foundation)**, and **Phase 4 (Pilot Portal)**. Follows team rule: one branch per phase (`redux/phase-N-...`), small PRs, and `lint` + `build` + Playwright E2E green before every merge.

---

## Sprint Milestone 1 — Phase 1 & Phase 2: Decision & Safety Net (`redux/phase-2-safety-net`)

- [ ] **T1 (Team — 30m):** Read `docs/redux-migration/00-executive-summary.md` & `05-migration-plan.md`; settle all 4 Open Decisions in `HANDOFF.md` and `07-open-questions.md` (especially confirming `Customer` as Pilot Portal and JS vs. TS).
- [ ] **T2 (Dev A — 15m):** Fix local dependencies (`BLK-01`, `BLK-02`): run `npm ci` in both `back-end/` and `frontend-react/`. Confirm `back-end` `npm run build && npm test` and `frontend-react` `npm run lint && npm run build` pass.
- [ ] **T3 (Dev A — 20m):** Clean up repo hygiene (`BLK-09`): delete untracked `frontend-react/src/components/hub-manager/` and dead `frontend-react/src/RoleSelector.jsx`; untrack `.DS_Store`, `back-end/database.sqlite`, `back-end/sqlite.db` (and decide whether `back-end/data/swifttrack.db` should be untracked); update root `.gitignore` `backend/` → `back-end/`.
- [ ] **T4 (Dev B — 45m):** Fix Hub Manager shell & Dashboard consistency (`BLK-04`, `BLK-08`):
  - Refactor `frontend-react/src/App.jsx:75-84` and `HubManagerLayout.jsx` to use a nested `<Route path="/hub" element={<HubManagerLayout />}>` with `<Outlet />` (matching Admin/Customer/Merchant/Agent).
  - Replace inline `onAssign`/`onTransfer` checks in `frontend-react/src/features/hub-manager/DashBoard.jsx:144-165` with `canAssign(order, hubId)` and `canTransfer(order, hubId)` from `warehouseWorkflow.js`.
- [ ] **T5 (Dev B — 1h):** Standardize `ExpensesController` response envelope (`BLK-06`) in `back-end/src/expenses/expenses.controller.ts:17-59` (`{ success: true, ... }`) **or** document `baseQuery` compatibility; verify `FinancialAnalytics` & `ExpenseView` still work.
- [ ] **T6 (Dev A — 1.5h):** Add Vitest + `@testing-library/react` + `jsdom` to `frontend-react` (`BLK-10`) and write characterization tests for `services/orderStatus.js`, `features/hub-manager/warehouseWorkflow.js`, `customerService.normalizeOrder`, and `merchantHelpers.normalizeBackendOrder`.
- [ ] **T7 (Dev A & B — 1h):** Run full Playwright E2E baseline (`BLK-03`):
  ```powershell
  cd frontend-react
  $env:SWIFTTRACK_BROWSER = 'chrome'
  npm.cmd run test:e2e -- --trace off
  ```
  Confirm **16/16 scenarios pass** and record baseline JS bundle size (`dist/assets/index-*.js`). Update `docs/redux-migration/HANDOFF.md`.

---

## Sprint Milestone 2 — Phase 3: Redux Foundation (`redux/phase-3-foundation`)

- [ ] **T8 (Dev A — 30m):** Install `@reduxjs/toolkit` (`>=2.5.0`) and `react-redux` (`>=9.2.0`) in `frontend-react/` via `npm install @reduxjs/toolkit react-redux`.
- [ ] **T9 (Dev A — 1.5h):** Create core store & slices:
  - `src/app/store.js` (`configureStore`, `setupListeners`, listener middleware) + `src/app/hooks.js`
  - `src/features/auth/authSlice.js` (`token`, `user`, `setCredentials`, `setSessionUser`, `sessionCleared`)
  - `src/features/auth/authListeners.js` (sync `localStorage` `x-auth-token`/`user` + `swifttrack-session-change` bridge + cross-tab `storage` listener + `apiSlice.util.resetApiState()` on logout/401)
  - `src/features/ui/uiSlice.js` (`sidebarExpanded`, `toggleSidebar`, `setSidebarExpanded`)
- [ ] **T10 (Dev A — 1.5h):** Create `src/services/apiSlice.js` (`fetchBaseQuery` with `x-auth-token`, 20s timeout, `401` → `sessionCleared()`, standardized error message extraction, `{ success, data }` unwrap) and `src/services/endpoints/authApi.js` (`login`, `register`, `getMe`, `updateProfile`, `logout`).
- [ ] **T11 (Dev B — 1.5h):** Wire `<Provider store={store}>` in `src/main.jsx` and migrate `RequireRole.jsx`, `pages/Login.jsx`, `pages/Register.jsx`, and `components/layout/Sidebar.jsx` (`expanded` + `logout` using `uiSlice` & `authApi`). Keep `services/session.js` working via listener bridge so unmigrated portals stay untouched.
- [ ] **T12 (Dev A — 1.5h):** Write Vitest unit tests for `authSlice`, `uiSlice`, `authListeners` (401 + logout cache reset), and `RequireRole` deep-link preservation. Run `lint`, `build`, Vitest, and **16/16 Playwright E2E**. Update `HANDOFF.md`.

---

## Sprint Milestone 3 — Phase 4: Pilot Portal (`redux/phase-4-customer-pilot`)

- [ ] **T13 (Dev B — 1h):** Add `src/services/endpoints/ordersApi.js` (`getOrders`, `getOrderById`, `confirmDelivery`) and `src/services/endpoints/supportApi.js` (`getComplaints`, `createComplaint`, `getFeedback`, `createFeedback`).
- [ ] **T14 (Dev B — 2h):** Migrate `CustomerDashboard.jsx`, `CustomerOrders.jsx`, `CustomerTracking.jsx`, and `CustomerSupport.jsx` to RTK Query hooks + memoized `normalizeOrder` selector (removing `customerService` async fetch wrappers while keeping `normalizeOrder` as a pure selector transform). Keep `CustomerLayout.jsx` reading user from `selectCurrentUser`.
- [ ] **T15 (Dev A — 1.5h):** Write Vitest tests for `selectCustomerOrders` and `CustomerTracking` (`confirmReceipt` tag invalidation + `404`/`403` "not found" UX), then run `lint`, `build`, Vitest, and **16/16 Playwright E2E**.
- [ ] **T16 (Team — 30m):** Pilot retrospective: review PR diff, network call reduction, and DevTools trace; approve rollout for Phase 5 (`Merchant` → `Agent` → `Hub Manager` → `Admin + Topbar`). Update `HANDOFF.md`.
