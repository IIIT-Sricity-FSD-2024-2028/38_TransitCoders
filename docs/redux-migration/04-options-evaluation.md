# 04 — Objective Options Evaluation & Recommendation

> **Purpose:** Evaluate whether migrating `frontend-react/` to Redux is justified on technical and team-process grounds, compare realistic alternatives, and define exact boundaries for what belongs in Redux.

---

## 1. Alternatives Evaluated

1. **Option A — Keep Current Approach (`useState`/`useEffect` + `Outlet` context + `session.js`)**
2. **Option B — React Context + `useReducer` (per portal)**
3. **Option C — Redux Toolkit (`configureStore` + `createSlice` + RTK Query `createApi`)**
4. **Option D — Zustand (lightweight global stores + manual async actions)**
5. **Option E — TanStack Query (`@tanstack/react-query`) + Context/Zustand for client state**

---

## 2. Weighted Scoring Matrix (1 = Poor, 5 = Excellent)

| Criterion | Option A: Current | Option B: Context + `useReducer` | Option C: RTK + RTK Query | Option D: Zustand | Option E: TanStack Query + Zustand |
| --- | :---: | :---: | :---: | :---: | :---: |
| **Fit to current code** | 3 | 3 | **4** | 4 | **5** |
| **Migration cost** *(5 = lowest cost)* | **5** | 4 | 3 | 4 | 3 |
| **Migration risk** *(5 = lowest risk)* | **5** | 4 | 3 | 4 | 4 |
| **Learning curve** *(5 = easiest)* | **5** | 4 | 3 | **5** | 4 |
| **Performance** *(cache + selective re-renders)* | 2 | 2 | **5** | 4 | **5** |
| **DevTools & debuggability** | 1 | 2 | **5** | 4 | 4 |
| **Type safety** *(JS today, TS-ready)* | 2 | 3 | **5** | 4 | 4 |
| **Testability** *(pure reducers/selectors)* | 2 | 4 | **5** | 4 | 4 |
| **SSR support** *(N/A for Vite CSR; future-proofing)* | 3 | 3 | 4 | 4 | 4 |
| **Long-term maintainability** | 2 | 2 | **5** | 4 | **5** |
| **Bundle size impact** *(5 = smallest)* | **5** | **5** | 3 (`~15 kB gz`) | 4 (`~1.5 kB gz`) | 3 (`~14 kB gz`) |
| **Total (out of 55)** | **35** | **36** | **45** | **45** | **45** |

### Interpretation for SwiftTrack
- **Pure technical tie at 45/55** between **RTK + RTK Query**, **Zustand**, and **TanStack Query + Zustand**.
- Why **Option C (RTK + RTK Query)** wins for *this* project:
  1. **85%+ of SwiftTrack's state problem is server-cache synchronization** (same `orders`, `hubs`, `users`, `complaints`, `feedback`, `tickets`, `notifications`, `pricing` re-fetched across 30+ components). RTK Query solves request deduplication, tag-based invalidation (`Order`, `Hub`, `User`, `Agent`, `Complaint`, `Feedback`, `Ticket`, `Notification`, `Pricing`, `Expense`, `Report`), loading/error flags, and polling (`pollingInterval` for notifications) out of the box—eliminating hundreds of lines of `useEffect` boilerplate.
  2. **Explicit evaluation/course requirement alignment:** Your team's handoff (` 📌 SwiftTrack: Redux Migration Plan`) targets Redux explicitly, and Redux Toolkit (`@reduxjs/toolkit` + `react-redux`) is the official modern standard (not legacy vanilla Redux).
  3. **Single unified DevTools timeline** across auth actions, UI actions, and API cache mutations—valuable for debugging multi-role workflows (`Merchant → Hub → Agent → Customer`) during evaluation demos.
- **When we would choose differently:** If Redux were *not* a project/evaluation goal, **Option E (TanStack Query + React Context/Zustand)** would deliver similar server-cache benefits with slightly less store boilerplate; or **Option A** would suffice if no new features were planned beyond this semester.

---

## 3. State Placement Boundary: What Goes in Redux vs. Stays Out

Migrating *everything* into Redux is an anti-pattern. Below is the strict boundary for SwiftTrack:

### A. Goes into **RTK Query (`apiSlice`)** — Server State & Polling
- Orders list & single-order lookups (`GET /orders`, `GET /orders/:id`, `GET /tracking/:trackingId`) + mutations (`create`, `update`, `updateStatus`, `completeDelivery`, `assign`, `autoAssign`, `scanWarehouse`, `cancel`, `transfer`, `authorizeReturn`, `reportMishap`, `confirmDelivery`).
- Hubs (`GET /hubs`, `GET /hubs/:id`, `GET /hubs/:id/agents`, hub CRUD).
- Agents (`GET /agents/:id`, `GET /agents/:id/worklist`, `PATCH /agents/:id/availability`).
- Users (`GET /users`, CRUD, `approve`).
- Support & Governance (`complaints`, `mishaps`, `feedback`, `tickets`).
- Financials & Pricing (`pricing/config`, `pricing/quote`, `reports/revenue`, `expenses`).
- Notifications (`GET /notifications`, `GET /notifications/unread-count` with 30s polling, `markRead`, `markAllRead`).

### B. Goes into **RTK Client Slices** — Global Client/Session/UI State
- **`authSlice`:** `token`, `user`, `sessionStatus` (`idle | checking | authenticated | unauthenticated`), `sessionError`. Replaces `services/session.js` custom DOM events, `RequireRole` local state, and `AgentLayout`'s duplicate `currentUser`. Syncs `x-auth-token` and `user` to `localStorage` via listener middleware (preserving E2E `localStorage.getItem('x-auth-token')`).
- **`uiSlice` (minimal):** Portal/layout shell preferences that must survive route changes—specifically `sidebarExpanded` (fixing the Hub Manager collapse reset), plus optional transient portal-level `notice` (replacing `AgentLayout`'s `notice` banner).

### C. Stays in **React Router (`useSearchParams` / `location.state`)** — URL State
- Tracking/order query params (`?id=` in `CustomerTracking`, `CustomerOrders`, `TrackShipment`, `OrderQueue`, `AgentWorklist`; `?orderId=` in `CustomerSupport`; `?reference=` / `?action=` in `Warehouse`; `location.state.from` in `Login`/`RequireRole`).

### D. Stays **Component-Local (`useState`)** — Form & Ephemeral UI State
- Controlled form inputs (`Login`, `Register`, `BookShipment` form fields, `CustomerSupportForms`, `ReportIssue`, `AddOrEditUserModal`, `AddOrEditDeliveryZone`, `ExpenseView`, `OrderDetailsModal` edit/return drafts, `MerchantSupport` new-ticket modal).
- Local table search/filter/pagination (`searchTerm`, `selectedStatus`, `selectedPriority`, `activeTab`, `DeliveryHistory` `page`, `hoveredRating`, `showRouteModal`, `showLabel`, `activeMenuId`).
- **Ephemeral media & scoped chat polling:**
  - `ShippingLabelModal` `blob:` URL lifecycle (`URL.createObjectURL`/`revokeObjectURL`) stays local (non-serializable).
  - `OrderMessages` 5s polling when expanded can either stay local (already clean with `AbortController` + `version` ref) or use a lazy RTK Query endpoint with `pollingInterval: 5000` only while mounted/open. **Recommendation:** Use RTK Query `getOrderMessages` + `sendOrderMessage` *or* keep local in Phase 4 and evaluate in Phase 5—either works cleanly, and RTK Query gives instant optimistic/tag updates if desired.

---

## 4. Recommendation & Effort Estimate

- **Recommendation:** **GO — WITH MODIFICATIONS**
  - **Modification 1 (Architecture):** Use **Redux Toolkit + RTK Query (`createApi`)** for server state + **thin `authSlice` & `uiSlice`**, NOT hand-written `createAsyncThunk` + manual arrays/loading flags for 10+ REST endpoints.
  - **Modification 2 (Prerequisites first):** Do **not** start Phase 3 (Redux foundation) until Phase 2 clears the broken local `node_modules` (`BLK-01`, `BLK-02`), removes dead/untracked files (`BLK-09`), fixes `HubManagerLayout` nested routing (`BLK-04`), and achieves a **16/16 green Playwright E2E baseline** (`BLK-03`).
- **Estimated Effort (assuming 2–3 team members working in parallel PRs per portal):**
  - **Phase 2 (Safety net & baseline fixes):** 0.5 – 1.5 days *(High confidence)*
  - **Phase 3 (RTK Store, `authSlice`, `uiSlice`, base `apiSlice` + `RequireRole`):** 1 – 2 days *(High confidence)*
  - **Phase 4 (Pilot Portal — `Merchant` or `Customer`):** 1 – 1.5 days *(High confidence)*
  - **Phase 5 (Remaining 4 portals: `Agent`, `Hub Manager`, `Admin`, plus shared `Topbar`/`OrderMessages`):** 3 – 5 days *(Medium confidence — `Admin` has 8 pages & `Hub Manager` has 6 pages + 3 modals)*
  - **Phase 6 (Cleanup of `session.js`, `useHubOrders`, `AgentLayout` Outlet context, docs):** 0.5 – 1 day *(High confidence)*
  - **Total Calendar Effort:** **6 – 11 developer-days** (approx. **1.5 – 2.5 weeks** part-time across the team).
- **What evidence would change this recommendation to No-Go:** If the team's deadline is under 3 days or if `npm ci` + Playwright E2E cannot be stabilized on team machines—in that case, keep the current working architecture and only fix `HubManagerLayout` nesting (`BLK-04`) and `DashBoard.jsx` (`BLK-08`).
