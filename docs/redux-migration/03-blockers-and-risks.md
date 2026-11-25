# 03 — Code Health, Baseline Checks & Blocker Analysis

> **Methodology:** Every command below was executed read-only on branch `ReactEvalFixes` (`fa7d7cdf`). No source files, configs, or `node_modules` were modified.

---

## 1. Baseline Read-Only Execution Results

| Check | Command | Exit Code | Observed Result |
| --- | --- | --- | --- |
| Frontend deps | `cd frontend-react; npm ls --depth=0` | `1` | Missing 3 declared packages: `bootstrap-icons@^1.13.2`, `recharts@^3.10.1`, `@playwright/test@^1.65.1`. |
| Frontend lint | `cd frontend-react; npm run lint` | `0` | `eslint .` passed cleanly with **0 errors and 0 warnings**. |
| Frontend build | `cd frontend-react; npm run build` | `1` | JS/CSS bundling progressed (60+ chunks emitted), then failed on `main.jsx:6`: Rolldown could not resolve `"bootstrap-icons/font/bootstrap-icons.css"` because `bootstrap-icons` is missing in `node_modules`. |
| Backend deps | `cd back-end; npm ls --depth=0` | `1` | `back-end/node_modules` does not exist (`UNMET DEPENDENCY` for all 41 packages). |
| Backend build/tests | `cd back-end; npm run build; npm test; npm run test:e2e` | `1` | Failed with `'nest' is not recognized` / `'jest' is not recognized` due to missing `node_modules`. |
| Playwright E2E | `cd frontend-react; npx playwright --version` | — | Local `@playwright/test` missing (`npm warn exec` resolved `1.65.1` dynamically); full E2E run blocked until both `back-end` and `frontend-react` `npm ci` succeed. |

---

## 2. Test Coverage & Survivability Across a Redux Migration

- **Frontend Browser E2E (`frontend-react/e2e/workflows.spec.mjs`, 752 lines, 16 tests):**
  - Covers all 5 portals loading without `pageerror` or `>=400` responses (5 tests), role protection + deep-link + logout (1 test), full local shipment lifecycle + messaging + POD upload + CSV export + complaint + feedback + return/refund (1 test), customer registration + empty states (1 test), ticket persistence + `503` retry (1 test), agent profile/availability persistence (1 test), admin user approval + zone CRUD + pricing + fractional expenses (1 test), mobile sidebar (1 test), inter-hub `H001→H002` transfer + auto-assign + mishap (1 test), COD cancel without refund (1 test), hub capacity + `409` quote change review (1 test), manual overbooking `409` + auto-assign retry (1 test).
  - **Untested in Frontend:** **0 unit/component tests** exist in `frontend-react/` (no Vitest/Jest/React Testing Library). `MerchantDashboard` analytics percentages, `AnalyticsReport` timeframe math, `Reports` charts, and `AdminDashboard` latency metrics have only smoke load assertions.
  - **Survivability:** **High**, because `workflows.spec.mjs` queries accessible roles/labels (`getByRole`, `getByLabel`, `getByText`) and HTTP responses rather than React internals—**provided** the Redux migration preserves:
    1. `localStorage.getItem('x-auth-token')` (`workflows.spec.mjs:14,546`).
    2. `role="alert"` strictly absent on happy paths (`workflows.spec.mjs:66`).
    3. `409` and `503` form preservation & quote/hub refresh (`workflows.spec.mjs:342-351,618-625`).
- **Backend Tests:**
  - **Unit (`back-end/src/*.spec.ts`):** Only 2 files (`app.controller.spec.ts` + `seed.service.spec.ts`). Note `seed.service.spec.ts:1` mocks `uuid` due to Jest/ESM compatibility.
  - **Jest E2E (`back-end/test/app.e2e-spec.ts`, `admin-roles.e2e-spec.ts`):** 2 specs; `docs/FDFED_FINAL_ACCEPTANCE_REPORT.md:84-90` noted Jest ESM failure on `uuid` (`jest-e2e.json:6-10` now configures `useESM: true` + `transformIgnorePatterns`).
  - **Live Runtime Script (`back-end/scripts/runtime-tests.mjs`):** 54 HTTP + SQLite persistence checks.

---

## 3. TypeScript, Code Quality, Tech Debt & Performance Baseline

- **TypeScript / Type Safety:**
  - `frontend-react/` is **100% plain JavaScript** (`.js`/`.jsx`), no `tsconfig.json`, no JSDoc/PropTypes/Zod validation on API responses.
  - `back-end/tsconfig.json:19-21` has `strictNullChecks: true` but **`noImplicitAny: false`**. `back-end/eslint.config.mjs:29` disables `@typescript-eslint/no-explicit-any`. Several DTOs (`CreateComplaintDto:31-44`, `CreateFeedbackDto:32-48`) allow `: any` fields for backward compatibility.
- **Tech Debt & Dead Code:**
  - Dead route component `frontend-react/src/RoleSelector.jsx` (never imported in `App.jsx`).
  - Untracked leftover folder `frontend-react/src/components/hub-manager/` (6 files, zero imports in `frontend-react/src`).
  - Unused `api.js` methods in `frontend-react`: `users.getById`, `tickets.delete`, `roles.*`, `shipments.*`, `orders.schedulePickup`, `orders.remove`, `agents.uploadPhoto`, `reports.getOperations`, `reports.getPayments`, `expenses.update`.
  - Root `.gitignore:3-4,8-10,45` ignores `backend/...` instead of `back-end/...` (partially compensated by `back-end/.gitignore` and `back-end/data/.gitignore`).
  - Tracked runtime/OS artifacts: `.DS_Store`, `back-end/data/swifttrack.db` (356 KB), and 0-byte `back-end/database.sqlite` & `back-end/sqlite.db`.
  - Orphaned root `package-lock.json` with no root `package.json`.
  - Legacy `front-end/` (163 files) sits alongside `frontend-react/`.
- **Version Compatibility for Redux:**
  - `frontend-react` runs `react@^19.2.8` (`19.3.0`), `vite@^8.3.0`, `react-router-dom@^7.18.4`.
  - Per official React-Redux / Redux Toolkit documentation, **React 19** is natively supported by **`@reduxjs/toolkit >= 2.5.0`** and **`react-redux >= 9.2.0`** (which uses React's `useSyncExternalStore`). No version blocker exists.
- **Performance Baseline:**
  - Observed partial `vite build` output before the CSS error: main entry bundle `index-*.js` is **380.37 kB (108.18 kB gzip)**; lazy route chunks range from `0.38 kB` to `16.37 kB`; CSS `index-*.css` is `77.59 kB` (`14.84 kB` gzip).
  - **Oversized static assets:** `frontend-react/src/assets/login-bg.png` (**2,014,880 bytes / 2.01 MB**) and `van-image.png` (**1,155,104 bytes / 1.15 MB**).
  - **Adding Redux impact:** `@reduxjs/toolkit` + `react-redux` adds ~12–18 kB gzip to `index.js`, while eliminating redundant cross-page `GET /orders`, `GET /users`, `GET /hubs`, `GET /complaints`, and `GET /feedback` calls and stopping `HubManagerLayout` from remounting `Sidebar`/`Topbar` on every route click.

---

## 4. Prioritized Blocker Register

| ID | Severity | Evidence (`file:line`) | Why It Blocks | Concrete Remediation |
| --- | --- | --- | --- | --- |
| **BLK-01** | **Critical** | `frontend-react/src/main.jsx:6`; `npm ls` output | `bootstrap-icons` and `recharts` are missing in `frontend-react/node_modules`, breaking `vite build` and preventing any PR gate check. | Run `npm ci` in `frontend-react/` (and verify `npm run build && npm run lint`). |
| **BLK-02** | **Critical** | `back-end/` (`npm ls` output) | `back-end/node_modules` is absent; backend cannot build, serve, or run tests, blocking Playwright E2E baseline. | Run `npm ci` in `back-end/` and verify `npm run build && npm test`. |
| **BLK-03** | **High** | `docs/REACT_EVAL_HANDOFF.md:42` | Full 16-scenario Playwright E2E suite has not passed cleanly after the final assignment/label edits (previous rerun hit timeout + trace archive error). Migrating state without a green E2E baseline risks masking pre-existing regressions. | After BLK-01/02, run `$env:SWIFTTRACK_BROWSER='chrome'; npm.cmd run test:e2e` (or `-- --trace off`) and fix any failure before Phase 3. |
| **BLK-04** | **High** | `frontend-react/src/App.jsx:75-84`; `HubManagerLayout.jsx:7-36` | Hub Manager routes wrap each page individually in `<HubManagerLayout>` instead of a nested `<Outlet />` route, remounting `Sidebar` and `Topbar` (and re-polling notifications) on every navigation. | Convert `/hub/*` to a nested `<Route path="/hub" element={<HubManagerLayout />}>` with `<Outlet />` + route-based title (or Redux UI title). |
| **BLK-05** | **High** | `frontend-react/src/services/api.js:22`; `session.js:30-36` | `api.js` mutates `localStorage` directly on `401` and relies on DOM custom events (`swifttrack-session-change`); migrating auth without centralizing 401 handling leaves split sources of truth and risks leaking user state across sign-out/sign-in. | Dispatch a store `sessionCleared` / `logout` action (and `apiSlice.util.resetApiState()`) from a single auth/baseQuery handler while keeping `localStorage` `x-auth-token` synced for E2E tests. |
| **BLK-06** | **Medium** | `back-end/src/expenses/expenses.controller.ts:17-59` vs `api-response.interface.ts:1-6` | `ExpensesController` returns `{ status: 'success', data }` instead of `{ success: true, data }`. Any unified RTK Query response/error normalizer expecting `success` will misclassify `/expenses` responses if not handled. | Standardize `ExpensesController` to `{ success: true, ... }` or explicitly unwrap `.data` in `baseQuery` regardless of envelope flag. |
| **BLK-07** | **Medium** | `customerService.js:8-23`, `merchantHelpers.js:6-36`, `AgentLayout.jsx:18-46` | Orders are normalized into 3 incompatible client shapes (`backendId`/`rawId`, `price`/`amount`, `status` casing). Putting mixed shapes into one shared `orders` cache will break components. | Keep raw canonical `IOrder` in the shared RTK Query cache and transform per portal via `selectFromResult` / memoized selectors (`createSelector`). |
| **BLK-08** | **Medium** | `frontend-react/src/features/hub-manager/DashBoard.jsx:144-165` vs `warehouseWorkflow.js:1-12` | Hub `DashBoard` duplicates inline assignment/transfer eligibility checks instead of calling `canAssign`/`canTransfer`, diverging from `OrderQueue`/`Dispatch`/`HubTransfer`. | Replace inline checks in `DashBoard.jsx` with `canAssign(order, hubId)` and `canTransfer(order, hubId)`. |
| **BLK-09** | **Medium** | Untracked `frontend-react/src/components/hub-manager/`; `RoleSelector.jsx`; `back-end/database.sqlite`, `sqlite.db`, `.DS_Store` | Dead/untracked files confuse developers and grep searches during migration; tracked SQLite files dirty working trees if touched. | Delete untracked `components/hub-manager/` and dead `RoleSelector.jsx` (after confirming no refs); untrack `.DS_Store` and empty `.sqlite`/`.db` files; fix `backend/` → `back-end/` in root `.gitignore`. |
| **BLK-10** | **Low** | No `.github/workflows/`, no `CODEOWNERS`, no unit tests in `frontend-react/` | Zero CI enforcement on PRs (`lint`, `build`, `e2e`) and zero Redux slice/selector unit test harness. | Add Vitest + `@testing-library/react` for slice/selector/hook characterization tests in Phase 2/3, and document PR checklist (or add GitHub Actions workflow). |
| **BLK-11** | **Low** | `back-end/src/tickets/tickets.repository.ts:80-90` | `TicketsRepository.update` does not persist `category` or `description` edits (only `subject, trackingId, priority, status`). | Document or fix if ticket editing beyond status is added later (no UI impact today). |
