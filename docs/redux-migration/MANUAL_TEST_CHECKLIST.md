# Manual & E2E Verification Checklist (`MANUAL_TEST_CHECKLIST.md`)

`back-end/node_modules` is installed (`npm ci`) and **both Playwright E2E suites passed** on Chrome (`SWIFTTRACK_BROWSER=chrome`):
- `frontend-react/e2e/workflows.spec.mjs`: **16/16 passed** (`1.6m`)
- `frontend-react/e2e/redux-parity.spec.mjs`: **12/12 passed** (`1.4m`)

Items checked `[x]` below were automatically verified by those Playwright runs. Remaining `[ ]` items should be smoke-checked manually by humans against a copied SQLite DB.

---

## A. Running Playwright E2E Against Isolated Temp DB (`playwright.config.mjs`)

`playwright.config.mjs` already creates a fresh temporary `e2e.db` in `os.tmpdir()` (`SEED_DEV_DATA=true`) and never modifies `back-end/data/swifttrack.db`. Run the two suites separately to avoid hitting the backend's 60 req/60s `ThrottlerModule` window across 28 consecutive logins:

```powershell
cd frontend-react
$env:SWIFTTRACK_BROWSER = "chrome"
npm.cmd run test:e2e -- e2e/workflows.spec.mjs --trace off
npx playwright test e2e/redux-parity.spec.mjs --trace off
```

---

## B. Role-by-Role Verification Status

### 1. Auth, Guard & Shared Chrome
- [x] Unauthenticated visit to protected portals redirects to `/login` (`workflows.spec.mjs` #6).
- [x] Logging in as all 5 roles (`customer`, `merchant`, `agent`, `admin`/`super_user`, `hub_manager`), `localStorage` persistence (`x-auth-token`, `user`), reload persistence, and `401` single-shot redirect without loop (`redux-parity.spec.mjs` #2–6).
- [x] Wrong-role route redirect (`workflows.spec.mjs` #6) & cross-tab logout via `'storage'` event (`redux-parity.spec.mjs` #7).
- [x] Topbar notifications bell opens cleanly on fresh load and re-open with `0` console/page errors (`redux-parity.spec.mjs` #1), polls `unread-count` every `30s` and stops on logout (`redux-parity.spec.mjs` #12), and marks all notifications read (`workflows.spec.mjs` #7).
- [ ] Click single-item **`Mark read`** and **`View shipment`** deep link inside open Notification feed.
- [x] Mobile & desktop Sidebar collapse/expand & Sign Out clears `localStorage` (`workflows.spec.mjs` #12, `redux-parity.spec.mjs` #2–6).
- [x] Public landing page (`/`) tracking lookup (`workflows.spec.mjs` #7) and `Register` customer confirmation + empty states (`workflows.spec.mjs` #8).

### 2. Customer Portal
- [x] `/customer/dashboard`: renders KPIs, Live Tracking, Recent Activity, and updates `SUPPORT TICKETS` & `DELIVERED` via SPA navigation without reload (`redux-parity.spec.mjs` #10).
- [x] `/customer/orders`: loads cards & `/customer/orders?id=<id>` opens/closes `OrderDetailsDrawer` (`redux-parity.spec.mjs` #10).
- [ ] `/customer/orders`: manually verify search input & status filter tabs (`ALL`, `IN TRANSIT`, `DELIVERED`, `PENDING`, `CANCELLED`).
- [x] `/customer/tracking`: tracking lookup, `OrderMessages` `5s` live chat polling (stops on collapse), and `Confirm Receipt` persistence (`workflows.spec.mjs` #7, `redux-parity.spec.mjs` #12).
- [x] `/customer/support`: invalid/unowned ID error `'Enter the tracking ID or order ID of one of your shipments.'` and valid complaint + feedback submission (`workflows.spec.mjs` #7).

### 3. Merchant Portal
- [x] `/merchant/dashboard` & `/merchant/book`: active hubs load, rapid weight typing produces zero `AbortError` alerts (`redux-parity.spec.mjs` #9), `400`/`409` hub capacity & changed quote review preserve form (`workflows.spec.mjs` #7, #15), and `ShippingLabelModal` renders SVG barcode (`naturalWidth > 0`) & print CSS (`workflows.spec.mjs` #7).
- [ ] Physical browser print dialog (`window.print()`) on `ShippingLabelModal`.
- [x] `/merchant/orders`: COD order cancellation (`workflows.spec.mjs` #14).
- [ ] `/merchant/orders` search/filter pills & opening `ShippingLabelModal` from the orders table.
- [x] `/merchant/track` & `/merchant/support`: tracking status updates (`workflows.spec.mjs` #7) and `503` ticket retry persistence (`workflows.spec.mjs` #9).
- [ ] `/merchant/analytics`: verify `Timeframe` selector (`All Time`, `Last 30 Days`, `Last 90 Days`, `This Year`) recalculations.

### 4. Delivery Agent Portal
- [x] `/agent/dashboard` & `/agent/worklist`: KPIs, Topbar availability toggle, `Accept Delivery` (`PickedUp`) -> `InTransit` -> `OutForDelivery` -> POD photo `FormData` upload (`Delivered`) (`workflows.spec.mjs` #7, #10).
- [x] `/agent/history`: search, Details modal POD photo text, CSV export (`workflows.spec.mjs` #7).
- [ ] `/agent/history`: verify `Delivery period` filter (`Today`, `Last 7 days`), pagination (`Previous`/`Next`), and `.txt` delivery record download.
- [x] `/agent/report-issue` & `/agent/profile`: mishap reporting (`workflows.spec.mjs` #13) and Edit Profile reload persistence (`workflows.spec.mjs` #10).

### 5. Admin & Super User Portal
- [x] `/admin/dashboard`: loads KPIs, Infrastructure Monitoring, and Recent Activity (`workflows.spec.mjs` #1).
- [x] `/admin/users`: create agent user, approve pending user (`workflows.spec.mjs` #11).
- [ ] `/admin/users`: edit user (including hub reassignment) and delete user (`super_user`).
- [x] `/admin/system-configuration`: add zone & update Pricing (`PUT /pricing/config`) (`workflows.spec.mjs` #11).
- [ ] `/admin/system-configuration`: edit and delete delivery zone (`super_user`).
- [x] `/admin/feedback`, `/admin/tickets`, `/admin/financials`: review feedback (`workflows.spec.mjs` #7), add expense & verify `Analytics Overview` updates without reload (`workflows.spec.mjs` #11, `redux-parity.spec.mjs` #11).
- [ ] `/admin/financials`: delete an expense; `/admin/reports`: visually verify Recharts rendering.

### 6. Hub-Manager Portal
- [x] `/hub` redirects to `/hub/dashboard`; navigating across all 7 subpaths keeps Sidebar/Topbar mounted and updates all Topbar titles incl. `Hub Complaints` (`redux-parity.spec.mjs` #8).
- [x] `/hub/warehouse`: check-in, duplicate check-in idempotency, check-out (`workflows.spec.mjs` #7, #13).
- [x] `/hub/dispatch`, `/hub/transfer`, `/hub/queue`, `/hub/complaints`: manual assign, overbooking `409` + auto-assign, hub transfer, complaint resolve, return/refund authorization, and live external `Delivered` state sync (`workflows.spec.mjs` #7, #13, #16; `redux-parity.spec.mjs` #10).
- [ ] `OrderDetailsModal`: click **`Edit Order`** (`PUT /orders/:id`); `/hub/reports`: visually verify Hub Recharts rendering.
