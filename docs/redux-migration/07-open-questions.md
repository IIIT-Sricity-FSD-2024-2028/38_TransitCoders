# 07 — Open Questions & Decisions Required

> Items below could not be verified from static source inspection alone or represent team/product decisions needed before Phase 2/3 begins.

---

## 1. Team & Architecture Decisions (Required in Phase 1)

1. **Is `frontend-react/` the sole active frontend, or is `front-end/` still evaluated/maintained?**
   - *Evidence:* `README.md:106-111` labels `front-end/` as `(Old) Static Frontend`, and `docs/REACT_EVAL_HANDOFF.md:3` states the app runs from `frontend-react` and `back-end`.
   - *Decision needed:* Confirm whether `front-end/` is strictly archived/untouched during the Redux migration.
2. **Stay on JavaScript (`.js`/`.jsx`) or adopt TypeScript during Redux migration?**
   - *Evidence:* `frontend-react/` currently has 0 `.ts`/`.tsx` files (`eslint.config.js:10`), whereas `back-end/` uses TypeScript (`tsconfig.json`). `@types/react` and `@types/react-dom` are already in `frontend-react/package.json:25-26`.
   - *Trade-off:* Staying on JS keeps Phase 2–6 faster with zero build config churn; introducing `.ts`/`.tsx` incrementally gives typed `RootState`, `AppDispatch`, and `IOrder` contracts but adds TS setup + JSDoc/type conversion overhead across 79 files.
3. **Approve Pilot Portal choice (`Customer`)?**
   - *Evidence:* `Customer` has 4 pages (`CustomerDashboard`, `CustomerOrders`, `CustomerTracking`, `CustomerSupport`), no complex nested modals, and exercises queries, `?id=` URL lookup, and mutations (`confirmDelivery`, `createComplaint`, `createFeedback`).
   - *Decision needed:* Confirm `Customer` as Phase 4 pilot (or override with `Merchant` / `Agent`).
4. **Assign portal owners and target deadline:**
   - Who owns Phase 2 (`Safety Net`), Phase 3 (`Foundation`), Phase 4 (`Pilot`), and each Phase 5 portal PR (`Merchant`, `Agent`, `Hub Manager`, `Admin + Topbar`)?
5. **Untracking `back-end/data/swifttrack.db` and cleanup of `database.sqlite` / `sqlite.db`:**
   - *Evidence:* `back-end/data/swifttrack.db` (356 KB) and two 0-byte SQLite files (`back-end/database.sqlite`, `back-end/sqlite.db`) are currently tracked in git despite `README.md` / `back-end/data/.gitignore` treating local DBs as runtime state.
   - *Decision needed:* Confirm whether evaluators expect a pre-seeded `swifttrack.db` in git or rely on `SEED_DEV_DATA=true` on boot before untracking it.

---

## 2. Technical & Verification Open Questions (Cannot Verify Without Local Install & Runtime)

1. **Do all 16 Playwright E2E scenarios currently pass after `fa7d7cdf`?**
   - *Context:* `docs/REACT_EVAL_HANDOFF.md:42` notes that all 16 passed *before* the final assignment/label changes, and 3 focused tests passed afterward while the broader rerun hit a timeout and trace archive error. Could not run E2E in read-only mode because `back-end/node_modules` and `frontend-react` `bootstrap-icons`/`recharts`/`@playwright/test` are missing locally.
2. **Do `back-end` unit (`npm test`) and Jest E2E (`npm run test:e2e`) tests pass cleanly under Node 24.19.0?**
   - *Context:* `docs/FDFED_FINAL_ACCEPTANCE_REPORT.md:84-90` noted a prior Jest/ESM issue with `uuid`; `back-end/test/jest-e2e.json:6-10` now has `useESM: true` + `transformIgnorePatterns`. Needs runtime verification after `npm ci`.
3. **Physical barcode scanner input verification (`docs/REACT_EVAL_HANDOFF.md:44`):**
   - Browser tests fill the scanner input programmatically; physical keyboard-wedge barcode scanner behavior (Enter suffix / rapid keystroke handling in `Warehouse.jsx:100-104`) has not been hardware-verified.
4. **Unused backend API modules (`Shipments`, `Roles`):**
   - `frontend-react/src/services/api.js:162-206` defines `API.roles` and `API.shipments`, and `back-end` exposes `/roles` and `/shipments`, yet zero React pages call them. Confirm whether these are legacy/backend-only endpoints that should NOT be ported to RTK Query endpoints in Phase 5.
5. **`OrderMessages` 5s polling in RTK Query vs local component:**
   - Decide in Phase 5 whether `OrderMessages.jsx` moves to RTK Query (`pollingInterval: 5000` with `skip: !open`) or stays component-local with its already-clean `AbortController` + `version.current` guard (`OrderMessages.jsx:25-50`).
6. **Large image assets (`login-bg.png` 2.01 MB, `van-image.png` 1.15 MB):**
   - Outside Redux scope, but worth confirming if the team wants WebP compression during Phase 2/6 to improve initial load performance.
