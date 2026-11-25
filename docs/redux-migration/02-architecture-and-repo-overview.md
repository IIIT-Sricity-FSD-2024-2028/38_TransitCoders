# 02 — Architecture & Repository Overview

> **Scope & Verification:** Every file path, version, endpoint, and behavior below was verified directly by reading source files and configs on branch `ReactEvalFixes` (head commit `fa7d7cdf`). Facts observed in files are separated from inferences.

---

## 1. Project Context Verification

| Dimension | Verified Finding | Evidence |
| --- | --- | --- |
| **Project type** | Full-stack logistics & delivery tracking platform (**SwiftTrack**) | `README.md:1-19` |
| **Frontend framework** | **React 19** (`19.2.8` in `package.json`, `19.3.0` installed) + **Vite 8** (`8.3.0`/`8.3.4`) + **React Router v7** (`7.18.4`) + **Tailwind CSS v4** (`4.3.3`) SPA in `frontend-react/` | `frontend-react/package.json:14-35`, `npm ls` output |
| **Legacy frontend** | Static vanilla HTML/CSS/JS app in `front-end/` (163 tracked files; no active build/link from `frontend-react/`) | `README.md:106-111`, `front-end/js/api.js:1-120` |
| **Backend** | **NestJS 11** (`11.0.1`) + Express + **Native Node SQLite** (`node:sqlite` `DatabaseSync` in WAL mode) in `back-end/` | `back-end/package.json:23-26`, `back-end/src/common/database/database.service.ts:17-333` |
| **Language** | **Frontend:** JavaScript (`.js`/`.jsx`, no `tsconfig.json` in `frontend-react/`). **Backend:** TypeScript (`5.7.3`). | `frontend-react/eslint.config.js:10`, `back-end/tsconfig.json:1-25` |
| **Current state management** | **Mixed / Ad-hoc (no Redux):** `localStorage` + custom DOM event (`swifttrack-session-change`) + `useSyncExternalStore`, `Outlet` context (`AgentLayout`), custom fetch hook (`useHubOrders`), and component-local `useState`/`useEffect` | `frontend-react/src/services/session.js:1-45`, `frontend-react/src/RequireRole.jsx:6-39`, `frontend-react/src/features/agent/AgentLayout.jsx:48-188` |

---

## 2. Complete Directory Tree (Excluding `node_modules`, `dist`, `.git`)

```text
38_TransitCoders/
├── .DS_Store                                 # Tracked macOS metadata file (debt)
├── .gitignore                                # Root ignore rules (logs, test-results, db-wal/shm, backend/ typo)
├── README.md                                 # Setup, walkthrough, credentials, contributor summary
├── SRS.pdf                                   # Software Requirements Specification
├── definitions.yml                           # Domain glossary (Merchant, Hub, POD, Exception, etc.)
├── domainexpertinteraction.md                # Domain expert notes
├── package-lock.json                         # Orphaned root lockfile (no root package.json)
├── Database/
│   ├── DBschema.sql                          # Reference MySQL-style DDL (not executed by NestJS SQLite app)
│   ├── ER_Diagram.pdf                        # ER diagram artifact
│   └── README.md                             # Placeholder note
├── Figma Designs/
│   └── README.md                             # Link/notes to Figma workflows
├── Videos/
│   └── Video_link.txt                        # Demo video link
├── docs/
│   ├── FDFED_FINAL_ACCEPTANCE_REPORT.md      # Prior backend audit report (Aug 2026)
│   ├── REACT_EVAL_HANDOFF.md                 # Branch ReactEvalFixes handoff (identical to ~/Downloads/HANDOFF.md)
│   └── redux-migration/                      # Audit deliverables (created by this audit)
├── back-end/                                 # NestJS 11 REST API + SQLite database
│   ├── .gitignore, .prettierrc, eslint.config.mjs, nest-cli.json, tsconfig*.json
│   ├── package.json, package-lock.json
│   ├── INTEGRATION.md, README.md
│   ├── data/
│   │   ├── .gitignore                        # Ignores *.db-wal, *.db-shm, backups
│   │   └── swifttrack.db                     # Tracked SQLite file (356,352 bytes)
│   ├── database.sqlite, sqlite.db            # Tracked 0-byte SQLite files (debt)
│   ├── docs/swagger.json                     # Auto-generated OpenAPI spec at startup
│   ├── scripts/runtime-tests.mjs             # 54-check live HTTP + SQLite verification script
│   ├── test/                                 # Jest E2E specs (app.e2e-spec.ts, admin-roles.e2e-spec.ts, jest-e2e.json)
│   ├── uploads/delivery-photos/              # Multer POD photo storage
│   └── src/                                  # 120 TypeScript files across 17 modules
│       ├── main.ts, app.module.ts, app.controller*.ts, app.service.ts
│       ├── common/                           # constants/, database/, filters/, interfaces/, logger/, middleware/
│       ├── auth/, users/, roles/, agents/, hubs/, orders/, shipments/
│       ├── pricing/, payments/, expenses/, reports/, tickets/, complaints/, feedback/, notifications/, seed/
├── front-end/                                # Legacy vanilla HTML/CSS/JS application (163 files)
│   ├── index.html, package-lock.json
│   ├── auth/, customer/, delivery-agent/, hub-manager/, merchant/, super-user/, assets/, css/, data/, images/, js/
└── frontend-react/                           # Active React 19 + Vite 8 SPA (103 tracked files in src/)
    ├── index.html, package.json, package-lock.json
    ├── vite.config.js, eslint.config.js, tailwind.config.js, postcss.config.js, playwright.config.mjs
    ├── public/                               # favicon.svg, icons.svg
    ├── e2e/workflows.spec.mjs                # 16 Playwright end-to-end scenarios (752 lines)
    └── src/
        ├── main.jsx, App.jsx, App.css, index.css, RequireRole.jsx, RoleSelector.jsx
        ├── assets/                           # Images & SVGs (login-bg.png 2.01MB, van-image.png 1.15MB)
        ├── pages/                            # Login.jsx/css, Register.jsx
        ├── services/                         # api.js, session.js, orderStatus.js, customerService.js, merchantHelpers.js
        ├── components/
        │   ├── OrderMessages.jsx             # Shared private chat thread (hub↔agent, customer↔agent)
        │   ├── layout/                       # Sidebar.jsx, Topbar.jsx, TopBar.css
        │   ├── shared/                       # KPICard.jsx
        │   ├── admin/                        # AdminTable, AnalyticsView, ExpenseView, PricingConfiguration, modals, RecentActivityCard
        │   ├── agent/                        # AcceptDeliveryModal, AgentStatusBadge, ConfirmDeliveryModal, OrderCard, RouteModal
        │   ├── customer/                     # LiveTrackingCard, OrderDetailsDrawer, RecentActivity, StarRating, StatCard, StatusBadge, Toast
        │   └── merchant/                     # OrderStatusBadge, ShippingLabelModal(.css), StatCard
        └── features/
            ├── LandingPage.jsx, LandingPage.css
            ├── admin/                        # AdminLayout + 8 views
            ├── customer/                     # CustomerLayout + 4 views
            ├── hub-manager/                  # HubManagerLayout + 6 views + 3 modals + OrderCard/StatsCard/useHubOrders/warehouseWorkflow
            ├── merchant/                     # MerchantLayout + 6 views
            └── agent/                        # AgentLayout + 5 views
```

---

## 3. Repository Structure, Tooling & Environment Setup

- **Repo Topology:** **Polyrepo-in-one-repo** (two independent npm packages: `back-end/package.json` and `frontend-react/package.json`). **No npm/yarn/pnpm workspaces** configured. Root has an orphaned `package-lock.json` and no root `package.json`.
- **Package Manager & Runtime:**
  - `npm` (`11.17.0` on this machine), Node.js `v24.19.0` (README requires `>= 22.13.0` for `node:sqlite` and Vite 8; `README.md:27`).
- **Build & Tooling:**
  - **Frontend:** `vite` (`8.3.0` / `8.3.4`), `@vitejs/plugin-react` (`6.1.1`), `tailwindcss` (`4.3.3`) via `@tailwindcss/postcss` (`frontend-react/postcss.config.js:1-6`), `eslint` (`10.10.0` flat config in `frontend-react/eslint.config.js:1-21`). Note: `frontend-react/tailwind.config.js` exists (`content` includes `.ts,.tsx`), while `frontend-react/src/index.css:1` uses Tailwind v4 `@import "tailwindcss";`.
  - **Backend:** `@nestjs/cli` (`11.0.0`), `typescript` (`5.7.3`, `strictNullChecks: true`, `noImplicitAny: false` in `back-end/tsconfig.json:19-21`), `jest` (`30.0.0`) + `ts-jest`, `eslint` (`9.18.0`) + `typescript-eslint` (`8.20.0`).
- **Environment / Config Handling:**
  - **Frontend:** `import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'` (`frontend-react/src/services/api.js:3`). No `.env` file committed.
  - **Backend:** `PORT` (default `3001` in `back-end/src/main.ts:73`), `DB_FILE` (default `data/swifttrack.db` in `back-end/src/common/database/database.service.ts:319`), `DB_POOL_SIZE` (default `4` at line `318`), `NODE_ENV`, `SEED_DEV_DATA`, `SWIFTTRACK_DEV_FIXTURES`, `SWIFTTRACK_ENV` (`back-end/src/seed/seed.service.ts:80-135`).
- **CI/CD, Docker, Deployment:** **None present** (no `.github/workflows/`, no `Dockerfile`, no `docker-compose.yml`, no staging/prod deploy manifests).
- **Secrets Scan:** Ran regex scan across tracked non-lock/non-swagger files. **No API keys or private keys found.** Demo seed password (`password123`) appears in development seeding (`back-end/src/seed/seed.service.ts:244,406,708`), `README.md:174`, `back-end/test/*.e2e-spec.ts`, `back-end/scripts/runtime-tests.mjs`, and `frontend-react/e2e/workflows.spec.mjs`. There is no JWT signing secret; tokens are random `uuidv4()` strings stored in `users.authToken` (`back-end/src/auth/auth.service.ts:41-42`).

---

## 4. Complete Dependency Audit

### A. Frontend (`frontend-react/package.json`)

| Package | Declared (`package.json`) | Installed (`npm ls`) | Latest (`npm outdated`) | Notes / Flags |
| --- | --- | --- | --- | --- |
| `react` | `^19.2.8` | `19.3.0` | `19.3.1` | React 19; compatible with RTK >=2.5.0 & react-redux >=9.2.0 |
| `react-dom` | `^19.2.8` | `19.3.0` | `19.3.1` | Current |
| `react-router-dom` | `^7.18.4` | `7.18.4` | `7.18.7` | Current v7 |
| `@tailwindcss/postcss` | `^4.3.3` | `4.3.3` | `4.3.5` | Current v4 |
| `tailwindcss` | `^4.3.3` | `4.3.3` | `4.3.5` | Current v4 |
| `postcss` | `^8.5.28` | `8.5.29` | `8.5.33` | Current |
| `autoprefixer` | `^10.6.1` | `10.6.1` | `10.7.0` | Current |
| `bootstrap-icons` | `^1.13.2` | `1.13.2` *(after Phase A `npm ci`)* | `1.13.2` | Installed cleanly in Phase A2 |
| `react-bootstrap-icons` | `^1.11.6` | `1.11.6` | — | Duplicated icon ecosystem alongside `bootstrap-icons` CSS font |
| `recharts` | `^3.10.1` | `3.10.1` *(after Phase A `npm ci`)* | `3.11.1` | Installed cleanly in Phase A2 |
| `vite` | `^8.3.0` | `8.3.0` | `8.3.8` | Uses Rolldown bundler |
| `@vitejs/plugin-react` | `^6.1.1` | `6.1.1` | `6.3.0` | Current |
| `eslint` | `^10.10.0` | `10.10.0` | `10.15.0` | Current |
| `@eslint/js` | `^10.0.1` | `10.0.1` | — | Current |
| `eslint-plugin-react-hooks` | `^7.1.1` | `7.1.1` | — | Current |
| `eslint-plugin-react-refresh` | `^0.5.6` | `0.5.6` | `0.5.8` | Current |
| `globals` | `^17.12.0` | `17.12.0` | `17.14.0` | Current |
| `@playwright/test` | `^1.65.1` | `1.65.1` *(after Phase A `npm ci`)* | — | Installed in `frontend-react`; E2E run still blocked by missing `back-end/node_modules` |
| `@types/react` | `^19.2.18` | `19.3.0` | `19.3.1` | Only editor/type hints (project is JS) |
| `@types/react-dom` | `^19.2.7` | `19.3.0` | — | Only editor/type hints (project is JS) |

### B. Backend (`back-end/package.json`)
> **Status:** `back-end/node_modules` is completely absent (`UNMET DEPENDENCY` for all 41 declared packages). Versions below are from `back-end/package.json:22-66`.

- **Dependencies (16):** `@nestjs/common` `^11.0.1`, `@nestjs/core` `^11.0.1`, `@nestjs/platform-express` `^11.0.1`, `@nestjs/config` `^4.0.4`, `@nestjs/swagger` `^11.4.1`, `@nestjs/throttler` `^6.5.0`, `@types/multer` `^2.2.0` *(in `dependencies` instead of `devDependencies`)*, `bcrypt` `^6.0.0`, `class-transformer` `^0.5.1`, `class-validator` `^0.15.1`, `helmet` `^8.3.0`, `reflect-metadata` `^0.2.2`, `rxjs` `^7.8.1`, `swagger-ui-express` `^5.0.1`, `uuid` `^14.0.0`, `winston` `^3.19.0`.
- **DevDependencies (25):** `@nestjs/cli` `^11.0.0`, `@nestjs/schematics` `^11.0.0`, `@nestjs/testing` `^11.0.1`, `jest` `^30.0.0`, `ts-jest` `^29.2.5`, `supertest` `^7.0.0`, `typescript` `^5.7.3`, `eslint` `^9.18.0`, `typescript-eslint` `^8.20.0`, `prettier` `^3.4.2`, `eslint-config-prettier` `^10.0.1`, `eslint-plugin-prettier` `^5.2.2`, `@eslint/eslintrc` `^3.2.0`, `@eslint/js` `^9.18.0`, `globals` `^17.0.0`, `source-map-support` `^0.5.21`, `ts-loader` `^9.5.2`, `ts-node` `^10.9.2`, `tsconfig-paths` `^4.2.0`, `@types/bcrypt` `^6.0.0`, `@types/express` `^5.0.0`, `@types/jest` `^30.0.0`, `@types/node` `^24.0.0`, `@types/supertest` `^7.0.0`, `@types/uuid` `^10.0.0`.
- **Flags on Backend Dependencies:**
  - `uuid@14.0.0` is pure ESM; `back-end/test/jest-e2e.json:9` attempts `transformIgnorePatterns` + `useESM: true`, and `back-end/src/seed/seed.service.spec.ts:1` mocks `uuid` explicitly because Jest CommonJS had ESM issues (previously flagged in `docs/FDFED_FINAL_ACCEPTANCE_REPORT.md:84-90`).
  - `@types/multer` is placed in `dependencies` instead of `devDependencies` (`back-end/package.json:29`).
  - `@nestjs/mapped-types` is imported by `back-end/src/hubs/dto/update-hub.dto.ts:1` without being declared directly in `back-end/package.json` (relies on transitive hoisting from `@nestjs/swagger`).

---

## 5. Frontend Entry Points, Routing & Provider Tree

- **Entrypoint (`frontend-react/src/main.jsx:1-14`):**
  ```text
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
  ```
  Imports `./index.css` and `bootstrap-icons/font/bootstrap-icons.css` (`main.jsx:5-6`).
- **Routing (`frontend-react/src/App.jsx:43-113`):**
  - `<Suspense fallback={...}>` wraps `<Routes>` with lazy-loaded role views.
  - **Public routes:** `/` (`LandingPage`), `/login` (`Login`), `/register` (`Register`), `*` → redirects to `/`.
  - **Protected nested layout routes (via `<RequireRole roles={[...]} />`):**
    - `/admin/*` (`roles={['super_user', 'admin']}`): `<AdminLayout>` + `<Outlet />` → `dashboard`, `users`, `system-configuration`, `complaints`, `feedback`, `tickets`, `reports`, `financials`.
    - `/customer/*` (`roles={['customer']}`): `<CustomerLayout>` + `<Outlet />` → `dashboard`, `orders`, `tracking`, `support`.
    - `/merchant/*` (`roles={['merchant']}`): `<MerchantLayout>` + `<Outlet />` → `dashboard`, `book`, `orders`, `track`, `analytics`, `support`.
    - `/agent/*` (`roles={['delivery_agent']}`): `<AgentLayout>` + `<Outlet context={...} />` → `dashboard`, `worklist`, `history`, `report-issue`, `profile`.
  - **Non-nested Hub Manager routes (`App.jsx:75-84`):**
    - `/hub/*` (`roles={['hub_manager']}`): Each route renders its page directly (`DashBoard`, `OrderQueue`, `Dispatch`, `HubTransfer`, `Warehouse`, `Reports`, or `<HubManagerLayout><ComplaintsManagement /></HubManagerLayout>`) instead of using an `<Outlet />` layout shell. Each page mounts its own `<HubManagerLayout>` wrapper (`Sidebar` + `Topbar`).

---

## 6. Frontend API Layer (`frontend-react/src/services/api.js` & Helpers)

- **Transport:** Native `fetch` wrapped in `request(path, options, authenticated)` (`api.js:5-27`) and `apiFetch(...)` (`api.js:29-31`).
- **Timeout & Cancellation:** Uses `AbortSignal.timeout(20_000)` composed with optional caller `options.signal` via `AbortSignal.any(...)` (`api.js:10-11`). Only `orders.getMessages` and `orders.barcode` currently pass a `signal`.
- **Auth Handling:** Reads `Token.get()` (`localStorage.getItem('x-auth-token')`) and injects `x-auth-token` header (`api.js:6-9`). On `response.status === 401 && token`, calls `clearSession(token)` (`api.js:22`), clearing `localStorage` and dispatching `swifttrack-session-change`. No refresh tokens exist.
- **Content-Type:** Sets `Content-Type: application/json` only when `typeof options.body === 'string'` (`api.js:8`), allowing `FormData` uploads (`orders.completeDelivery`, `agents.uploadPhoto`) to send browser multipart boundaries.
- **Error Handling:** Parses JSON body `{ error, message }`, joins array validation errors with `', '`, and throws `Error` annotated with `.status = response.status` (`api.js:20-25`).
- **Retry / Caching:** **None.** Zero deduplication, zero response caching, zero automatic retries.

### Frontend Endpoint Catalog (All 45 Endpoints Called via `api.js`)

| Domain | Method & Path | `api.js` Method | Auth | Consumers |
| --- | --- | --- | --- | --- |
| Auth | `POST /auth/login` | `API.auth.login` | No | `Login.jsx:26` |
| Auth | `POST /auth/register` | `API.auth.register` | No | `Register.jsx:20` |
| Auth | `GET /auth/me` | `API.auth.me` | Yes | `RequireRole.jsx:15` |
| Auth | `PATCH /auth/me` | `API.auth.updateProfile` | Yes | `AgentLayout.jsx:104` |
| Auth | `POST /auth/logout` | `API.auth.logout` | Yes | `Sidebar.jsx:20` |
| Users | `GET /users` | `API.users.getAll` | Yes | `AdminDashboard`, `UserManagement`, `MerchantTickets`, `ReportsAnalytics` |
| Users | `GET /users/:id` | `API.users.getById` | Yes | *(Unused in React UI)* |
| Users | `POST /users` | `API.users.create` | Yes | `AddOrEditUserModal.jsx:62` |
| Users | `PUT /users/:id` | `API.users.update` | Yes | `AddOrEditUserModal.jsx:51` |
| Users | `DELETE /users/:id` | `API.users.delete` | Yes | `UserManagement.jsx:168` |
| Users | `PATCH /users/:id/approve` | `API.users.approve` | Yes | `UserManagement.jsx:182` |
| Tickets | `GET /tickets` | `API.tickets.getAll` | Yes | `MerchantTickets`, `merchantHelpers.fetchMerchantTickets` (`AnalyticsReport`, `MerchantSupport`) |
| Tickets | `POST /tickets` | `API.tickets.create` | Yes | `merchantHelpers.createMerchantTicket` (`MerchantSupport`) |
| Tickets | `PUT /tickets/:id` | `API.tickets.update` | Yes | `MerchantTickets.jsx:29` |
| Tickets | `DELETE /tickets/:id` | `API.tickets.delete` | Yes | *(Unused in React UI)* |
| Complaints | `GET /complaints` | `API.complaints.getAll` | Yes | `AdminDashboard`, `ComplaintsManagement`, `ReportsAnalytics`, `customerService.getComplaints` |
| Complaints | `POST /complaints` | `API.complaints.create` | Yes | `customerService.submitComplaint` (`CustomerSupport`) |
| Complaints | `PUT /complaints/:id` | `API.complaints.update` | Yes | `ComplaintsManagement.jsx:94` |
| Feedback | `GET /feedback` | `API.feedback.getAll` | Yes | `FeedbackReview`, `ReportsAnalytics`, `customerService.getFeedback` |
| Feedback | `POST /feedback` | `API.feedback.create` | Yes | `customerService.submitFeedback` (`CustomerSupport`) |
| Feedback | `PUT /feedback/:id` | `API.feedback.update` | Yes | `FeedbackReview.jsx:52` |
| Roles | `GET /roles`, `GET /roles/:id`, `PUT /roles/:id` | `API.roles.*` | Yes | *(Unused in React UI — no Roles UI page in `App.jsx`)* |
| Shipments | `GET /shipments`, `POST`, `PUT`, `GET/:id`, `GET/:id/track`, `DELETE` | `API.shipments.*` | Yes | *(Legacy/unused in React UI — `/orders` is authoritative)* |
| Orders | `GET /orders` | `API.orders.getAll` | Yes | `AdminDashboard`, `useHubOrders`, `Warehouse`, `Reports`, `customerService`, `merchantHelpers` |
| Orders | `GET /orders/:id` | `API.orders.getById` | Yes | `customerService.getOrderById` (`CustomerTracking`, `CustomerSupport`) |
| Orders | `POST /orders` | `API.orders.create` | Yes | `merchantHelpers.createMerchantOrder` (`BookShipment`) |
| Orders | `PUT /orders/:id` | `API.orders.update` | Yes | `OrderDetailsModal.jsx:44` |
| Orders | `PATCH /orders/:id/status` | `API.orders.updateStatus` | Yes | `AgentLayout.jsx:119` |
| Orders | `PATCH /orders/:id/delivery` | `API.orders.completeDelivery` | Yes | `AgentLayout.jsx:118` |
| Orders | `PATCH /orders/:id/assign` | `API.orders.assign` | Yes | `AssignAgentModal.jsx:38` |
| Orders | `PATCH /orders/:id/auto-assign` | `API.orders.autoAssign` | Yes | `AssignAgentModal.jsx:37` |
| Orders | `PATCH /orders/:id/warehouse` | `API.orders.scanWarehouse` | Yes | `Warehouse.jsx:43` |
| Orders | `GET /orders/:id/messages/:channel` | `API.orders.getMessages` | Yes | `OrderMessages.jsx:36` (5s poll) |
| Orders | `POST /orders/:id/messages/:channel` | `API.orders.sendMessage` | Yes | `OrderMessages.jsx:63` |
| Orders | `PATCH /orders/:id/cancel` | `API.orders.cancel` | Yes | `merchantHelpers.cancelMerchantOrder` (`MerchantOrders`) |
| Orders | `PATCH /orders/:id/transfer` | `API.orders.transfer` | Yes | `TransferHubModal.jsx:35` |
| Orders | `PATCH /orders/:id/return` | `API.orders.authorizeReturn` | Yes | `OrderDetailsModal.jsx:43` |
| Orders | `POST /orders/:id/mishap` | `API.orders.reportMishap` | Yes | `ReportIssue.jsx:48` |
| Orders | `PATCH /orders/:id/pickup` | `API.orders.schedulePickup` | Yes | *(Unused in React UI)* |
| Orders | `PATCH /orders/:id/confirm` | `API.orders.confirmDelivery` | Yes | `customerService.confirmReceipt` (`CustomerTracking`) |
| Orders | `DELETE /orders/:id` | `API.orders.remove` | Yes | *(Unused in React UI)* |
| Orders | `GET /orders/:id/barcode` | `API.orders.barcode` | Yes | `ShippingLabelModal.jsx:34` (returns `Blob` SVG) |
| Orders | `GET /orders/mishaps` | `API.mishaps.getAll` | Yes | `ComplaintsManagement.jsx:26`, `ReportIssue.jsx:29` |
| Agents | `GET /agents/:id`, `GET /agents/:id/worklist`, `PATCH /agents/:id/availability`, `POST /agents/:id/delivery-photo` | `API.agents.*` | Yes | `AgentLayout` (`getProfile`, `getWorklist`, `updateAvailability`); `uploadPhoto` unused (`completeDelivery` handles POD) |
| Pricing | `POST /pricing/quote`, `GET /pricing/config`, `PUT /pricing/config` | `API.pricing.*` | Yes | `BookShipment.jsx:59`, `PricingConfiguration.jsx:19,31` |
| Tracking | `GET /tracking/:trackingId` | `API.tracking.track` | No | `LandingPage.jsx:26` |
| Reports | `GET /reports/revenue`, `GET /reports/operations`, `GET /reports/payments` | `API.reports.*` | Yes | `FinancialAnalytics.jsx:15,22` (`getRevenue`); `getOperations`/`getPayments` unused in React UI |
| Expenses | `GET /expenses`, `POST /expenses`, `PUT /expenses/:id`, `DELETE /expenses/:id` | `API.expenses.*` | Yes | `FinancialAnalytics.jsx:15,22`, `ExpenseView.jsx:18,34` (`PUT` unused in UI) |
| Notifications | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /:id/read`, `PATCH /read-all` | `API.notifications.*` | Yes | `Topbar.jsx:18,47,60,61` |
| Hubs | `GET /hubs`, `GET /hubs/:id`, `POST /hubs`, `PUT /hubs/:id`, `DELETE /hubs/:id`, `GET /hubs/:id/agents` | `API.hubs.*` | Yes | `BookShipment`, `TransferHubModal`, `Warehouse`, `AgentProfile`, `UserManagement`, `SystemConfiguration`, `AddOrEditDeliveryZone`, `AssignAgentModal`, `DashBoard`, `Reports` |

---

## 7. Backend Contracts, Validation, Auth & Real-Time Layer

- **Standard Response Envelope:** Most controllers return `IApiResponse<T>` (`{ success: true, data, message? }`, `back-end/src/common/interfaces/api-response.interface.ts:1-6`).
  - **Contract Drift Found:** `ExpensesController` (`back-end/src/expenses/expenses.controller.ts:17-59`) returns `{ status: 'success', data, message? }` instead of `{ success: true, ... }`! Error responses from `GlobalExceptionFilter` (`back-end/src/common/filters/http-exception.filter.ts:49-55`) always return `{ success: false, statusCode, error, path, timestamp }`.
- **Validation & Security:**
  - `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` (`back-end/src/main.ts:38-44`) strips/rejects unknown JSON properties globally.
  - `Helmet` + CORS restricted to `localhost`, `127.0.0.1`, `null` (`file://`), and no-origin clients (`main.ts:15-35`).
  - Global rate limiting: 60 req/60s via `ThrottlerModule` (`app.module.ts:26-32`), enforced with `@UseGuards(ThrottlerGuard)` on `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password` (`auth.controller.ts:30,45,96`).
- **Authentication & Authorization:**
  - `AuthGuard` (`back-end/src/auth/guards/auth.guard.ts:15-34`) validates `x-auth-token` against `users.authToken` and requires `user.isActive === true`.
  - `RolesGuard` (`back-end/src/auth/guards/roles.guard.ts:18-43`) checks `@Roles(...)` (`super_user`, `admin`, `hub_manager`, `merchant`, `delivery_agent`, `customer`).
  - Object-level access control (OLAC) is enforced inside `OrdersService.getAuthorizedOrder()` (`back-end/src/orders/orders.service.ts:86-119`), `OrderMessagesService.thread()` (`order-messages.service.ts:26-38`), `ComplaintsService`, `FeedbackService`, `TicketsService`, and `AgentsService`.
- **Database Schema (SQLite, `back-end/src/common/database/database.service.ts:22-308`):**
  - **16 Tables:** `users`, `roles`, `agents`, `hubs`, `orders`, `warehouse_visits`, `order_messages`, `shipments`, `tickets`, `complaints`, `feedback`, `payments`, `notifications`, `expenses`, `payouts`, `hub_transfers`, `mishaps`, `pricing_config`, `data_migrations` *(19 tables total)*.
  - **2 Views:** `orders_with_warehouse` (joins `warehouse_visits` on `w.hubId = o.pickupHubId`) and `hub_inventory` (computes `storedParcels` and `reservedParcels`).
  - **1 Trigger:** `sync_active_agent_profile` auto-creates/syncs `agents` rows when an active `delivery_agent` user is updated.
- **Real-Time Layer:** **No WebSockets or SSE.** Uses HTTP polling only:
  - `Topbar.jsx:23` polls `GET /notifications/unread-count` every **30 seconds**.
  - `OrderMessages.jsx:45` polls `GET /orders/:id/messages/:channel` every **5 seconds** while a message thread is expanded.
