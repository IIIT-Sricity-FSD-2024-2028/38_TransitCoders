# 05 — Redux Toolkit Migration Plan (Strangler-Fig)

> **Goal:** Migrate `frontend-react/` incrementally to `@reduxjs/toolkit` (`>=2.5.0`) + `react-redux` (`>=9.2.0`) while keeping the app shippable, lint-clean, buildable, and passing all 16 Playwright E2E scenarios after every PR.

---

## 1. Target Architecture

### A. Folder Structure (`frontend-react/src/`)
```text
src/
├── app/
│   ├── store.js                # configureStore, listenerMiddleware, setupListeners
│   └── hooks.js                # useAppDispatch, useAppSelector (or TS-typed hooks if TS adopted)
├── features/
│   ├── auth/
│   │   ├── authSlice.js        # token, user, sessionStatus, sessionError + clearSession/setSession
│   │   └── authListeners.js    # localStorage sync (x-auth-token, user), cross-tab storage, resetApiState on logout/401
│   ├── ui/
│   │   └── uiSlice.js          # sidebarExpanded, transient portal notices
│   └── ... (existing portals: admin, customer, hub-manager, merchant, agent)
└── services/
    ├── apiSlice.js             # RTK Query createApi + custom baseQuery (x-auth-token, 401 handling, envelope unwrap)
    ├── endpoints/
    │   ├── authApi.js          # login, register, me, updateProfile, logout
    │   ├── ordersApi.js        # orders, tracking, warehouse scan, assign, transfer, return, mishap, confirm, messages
    │   ├── hubsApi.js          # hubs CRUD + hub agents
    │   ├── agentsApi.js        # agent profile, worklist, availability
    │   ├── usersApi.js         # users CRUD + approve
    │   ├── supportApi.js       # complaints, mishaps, feedback, tickets
    │   ├── financeApi.js       # pricing config/quote, reports/revenue, expenses
    │   └── notificationsApi.js # list, unreadCount (30s polling), markRead, markAllRead
    ├── api.js                  # Kept during Phase 3–5 for unmigrated portals; removed in Phase 6
    ├── session.js              # Bridged to store during Phase 3–5; removed in Phase 6
    ├── orderStatus.js          # Pure status helpers (retained)
    ├── customerService.js      # Pure normalizers/formatters (fetch methods retired per portal)
    └── merchantHelpers.js      # Pure normalizers/dimensions (fetch methods retired per portal)
```

### B. Architectural Conventions & Design Decisions
1. **RTK Query for Server State (`apiSlice.js`):**
   - `baseQuery` uses `fetchBaseQuery({ baseUrl: API_BASE, prepareHeaders })` setting `x-auth-token` from `getState().auth.token`, `cache: 'no-store'`, and a 20s timeout (`timeout: 20000`).
   - Wraps `rawBaseQuery` to:
     - Dispatch `sessionCleared()` on `401` (when a token was sent) instead of mutating `localStorage` inside `api.js`.
     - Extract error messages consistently (`error.data?.error || error.data?.message || 'Request failed (...)'`) matching `api.js:23-24`.
     - Unwrap `{ success: true, data }` **and** `{ status: 'success', data }` (handling `ExpensesController` drift `BLK-06`).
   - Tag types: `['Order', 'Hub', 'Agent', 'User', 'Complaint', 'Mishap', 'Feedback', 'Ticket', 'Pricing', 'Revenue', 'Expense', 'Notification', 'OrderMessage']`.
   - Call `setupListeners(store.dispatch)` in `store.js` for `refetchOnFocus` / `refetchOnReconnect`.
2. **Normalization Strategy:**
   - Keep **canonical backend `IOrder` objects** in RTK Query's `ordersApi` cache (e.g. `LIST` + individual order tags) rather than caching 3 incompatible normalizations (`normalizeOrder`, `normalizeBackendOrder`, `mapOrder`).
   - Use **memoized selectors / `selectFromResult` helpers** per portal (`selectCustomerOrders`, `selectMerchantOrders`, `selectAgentOrders`) with `createSelector` so portal components keep their existing UI contracts without duplicating caches.
   - Use `createEntityAdapter` only where high-volume client-sorted lists or frequent single-item updates exist outside RTK Query; for SwiftTrack's current scale (< 1000 records), RTK Query per-endpoint cache + `createSelector` is simpler and avoids manual entity sync.
3. **Persistence & Multi-Tab Sync (`authListeners.js`):**
   - `createListenerMiddleware` listens to `setCredentials`, `updateSessionUser`, `sessionCleared`: writes/removes `x-auth-token` and `user` in `localStorage` **synchronously** (so Playwright's `localStorage.getItem('x-auth-token')` and `API` calls stay 100% compatible) and dispatches `apiSlice.util.resetApiState()` on logout/`401` so switching users in one tab never leaks prior role data.
   - `window.addEventListener('storage', ...)` dispatches `syncFromStorage` to keep tabs aligned.
4. **DevTools:** Enabled in non-production (`devTools: import.meta.env.DEV`), sanitizing nothing sensitive since passwords are never stored in Redux (`auth.token` is an opaque session UUID; `user` is `ISafeUser`).
5. **SSR / Next.js:** Not applicable (`frontend-react` is a pure Vite CSR SPA).

---

## 2. State-by-State Mapping

| Current State (`01-state-inventory.md`) | Target Location in Redux Architecture | Justification |
| --- | --- | --- |
| `#1–3` `session.js`, `Token`, `RequireRole` `session` | **`authSlice`** + `authApi.getMe` (`endpoints/authApi.js`) | Single source of truth for `token`, `user`, `sessionStatus`; eliminates `AgentLayout` duplicate `currentUser` and `getSessionUser()` render reads. |
| `#4` `Sidebar.jsx` `expanded` | **`uiSlice.sidebarExpanded`** | Survives route changes (fixes Hub Manager collapse reset alongside `BLK-04`). |
| `#4` `Sidebar.jsx` `showMenu` | **Local `useState`** | Ephemeral dropdown state. |
| `#5` `Topbar.jsx` `items`, `unread` | **`notificationsApi`** (`getNotifications`, `getUnreadCount` w/ `pollingInterval: 30000`, `markRead`, `markAllRead`) | Deduplicates polling across portals; invalidates automatically when mutations or `markRead` occur. `open` popover stays local. |
| `#6–8` `Login`, `Register`, `LandingPage` form inputs & `rememberMe` | **Local `useState`** + `useLoginMutation` / `useRegisterMutation` / `useLazyTrackOrderQuery` | Controlled form drafts and public single-lookup UI stay local; `swifttrack_remembered_email` stays local to `Login`. |
| `#9` `OrderMessages` `messages` | **Local `useState` (Phase 4–5) or `ordersApi.getOrderMessages` (`pollingInterval: 5000`)** | Keeping `open` and `body` local is mandatory; server messages can use `ordersApi` with `skip: !open` + `pollingInterval: 5000` for cache sharing across drawers/pages. |
| `#10,11,13,15–20` Admin `users`, `hubs`, `pricing`, `complaints`, `mishaps`, `feedback`, `tickets`, `revenue`, `expenses` | **`usersApi`, `hubsApi`, `financeApi`, `supportApi`** + `createSelector` derivatives | Eliminates 4x duplicate `GET /users` and 3x duplicate `GET /complaints` across Admin tabs; mutations auto-invalidate `AdminDashboard` & `ReportsAnalytics`. |
| `#12,14,21` Admin modal form drafts (`AddOrEditUserModal`, `AddOrEditDeliveryZone`, `ExpenseView`) | **Local `useState`** + RTK Query mutations | Modal drafts and open/close flags belong locally; mutations auto-refresh parent lists via tags. |
| `#22–25` Customer `orders`, `complaints`, `feedback`, `getOrderById`, `confirmReceipt` | **`ordersApi`, `supportApi`** + `selectFromResult` | Unifies `CustomerDashboard`, `CustomerOrders`, `CustomerTracking`, `CustomerSupport` onto one cache; `confirmReceipt` invalidates `Order`. |
| `#25–26` `CustomerSupportForms` inputs, `StarRating` hover | **Local `useState`** | Form drafts & hover state stay local. |
| `#27–36` Hub Manager `useHubOrders`, `Warehouse` inventory, `DashBoard` agents, modal fetches | **`ordersApi`, `hubsApi`** + URL params (`useSearchParams`) | Replaces `useHubOrders` + redundant fetches in `Warehouse` and `Reports`; `scanWarehouse`, `assign`, `autoAssign`, `transfer`, `authorizeReturn`, `updateOrder` invalidate `Order` + `Hub` + `Agent`. Modal open flags & edit drafts stay local. |
| `#37–43` Merchant `orders`, `tickets`, `hubs`, `pricing/quote` | **`ordersApi`, `hubsApi`, `financeApi`, `supportApi`** | `BookShipment` booking invalidates `Order` & `Hub` (live slot updates!); `cancel` invalidates `Order`; `409` error handling stays explicit in `BookShipment` so quote + hubs refetch without losing form inputs. `ShippingLabelModal` blob URL stays local. |
| `#44–50` Agent `AgentLayout` `Outlet` context (`orders`, `agent`, `busyOrder`, `savingAvailability`), `ReportIssue` mishaps, `AgentProfile` hub | **`ordersApi`, `agentsApi`, `hubsApi`, `supportApi`** + `uiSlice` (optional portal notice) | Completely removes the 13-prop `<Outlet context />` from `AgentLayout.jsx`; `AgentProfile`, `AgentWorklist`, `DeliveryHistory`, `ReportIssue`, `AgentDashboard` subscribe selectively via hooks. `AcceptDeliveryModal` / `ConfirmDeliveryModal` file state stays local. |

---

## 3. Phased Strangler-Fig Rollout Plan (Aligned with Team Phases 0–6)

| Phase | Branch | Scope & Tasks | Entry Criteria | Exit Criteria & Tests | Rollback Strategy | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| **Phase 0: Audit** | `ReactEvalFixes` | Read-only discovery, state inventory, blockers, options eval, migration plan (`docs/redux-migration/*`). | Branch checked out | All 10 docs in `docs/redux-migration/` reviewed by team. | N/A (read-only) | Done |
| **Phase 1: Review & Decide** | `ReactEvalFixes` | Team reads `00-executive-summary.md` & `05-migration-plan.md`; settle Open Decisions (`front-end/` deprecation, JS vs TS, pilot portal, owners). | Phase 0 complete | Decisions recorded in `HANDOFF.md` & `07-open-questions.md`. | N/A | 1–2 hrs |
| **Phase 2: Safety Net** | `redux/phase-2-safety-net` | Run `npm ci` in `back-end` & `frontend-react`; remove untracked `components/hub-manager/` & dead `RoleSelector.jsx`; fix `HubManagerLayout` `<Outlet />` nesting (`BLK-04`) & `DashBoard.jsx` `canAssign`/`canTransfer` (`BLK-08`); standardize `ExpensesController` (`BLK-06`) or verify; untrack `.DS_Store`/0-byte sqlite (`BLK-09`); add Vitest + RTL (`vitest`, `@testing-library/react`, `jsdom`); run full 16-test Playwright E2E cleanly. | Phase 1 decisions | `back-end` build+tests pass; `frontend-react` `lint`, `build`, and **16/16 Playwright E2E** pass; at least 2 characterization tests run via Vitest. | Revert PR on `redux/phase-2-safety-net`. | 0.5–1.5d |
| **Phase 3: Foundation** | `redux/phase-3-foundation` | Install `@reduxjs/toolkit` & `react-redux`; create `src/app/store.js`, `hooks.js`, `authSlice.js`, `authListeners.js`, `uiSlice.js`, `apiSlice.js`, `authApi.js`. Wrap `<App />` in `<Provider>` in `main.jsx`. Migrate **only** `RequireRole`, `Login`, `Sidebar` logout + `expanded` state (keeping `session.js` synced via listener so unmigrated portals still work!). | Phase 2 green | Unit tests for `authSlice`, `authListeners` (401 + reset), `uiSlice`; `lint`, `build`, and **16/16 E2E** pass with zero behavior change. | Remove `<Provider>` / revert `RequireRole` + `Login` PR. | 1–2d |
| **Phase 4: Pilot Portal (Customer)** | `redux/phase-4-customer-pilot` | Add `ordersApi` + `supportApi` endpoints; migrate `CustomerDashboard`, `CustomerOrders`, `CustomerTracking`, `CustomerSupport` (retiring fetch methods in `customerService.js`, keeping pure `normalizeOrder` selector). Verify tag invalidation on `confirmReceipt`, `submitComplaint`, `submitFeedback`. | Phase 3 green | Vitest selector/component tests + `lint`, `build`, **16/16 E2E** pass. Team reviews ergonomics before Phase 5. | Revert customer portal files to `customerService` calls. | 1–1.5d |
| **Phase 5a: Merchant Portal** | `redux/phase-5a-merchant` | Add `hubsApi` + `financeApi` (`quote`, `config`) + merchant `ordersApi`/`supportApi` mutations; migrate `BookShipment` (preserving `409` quote/hub refresh!), `MerchantOrders`, `MerchantDashboard`, `TrackShipment`, `AnalyticsReport`, `MerchantSupport`. | Phase 4 approved | `lint`, `build`, **16/16 E2E** (esp. booking capacity, `409` quote change, `503` ticket retry, COD cancel). | Revert merchant views to `merchantHelpers`. | 1–1.5d |
| **Phase 5b: Agent Portal** | `redux/phase-5b-agent` | Add `agentsApi` (`getProfile`, `getWorklist`, `updateAvailability`) + `ordersApi` (`updateStatus`, `completeDelivery`, `reportMishap`); migrate `AgentLayout` (remove 13-prop `<Outlet context />`!), `AgentDashboard`, `AgentWorklist`, `DeliveryHistory`, `ReportIssue`, `AgentProfile`. | Phase 5a green | `lint`, `build`, **16/16 E2E** (esp. worklist gating, POD upload, mishap, profile reload). | Revert `AgentLayout` & 5 agent pages. | 1–1.5d |
| **Phase 5c: Hub Manager Portal** | `redux/phase-5c-hub` | Migrate `DashBoard`, `OrderQueue`, `Dispatch`, `HubTransfer`, `Warehouse`, `Reports`, and 3 modals (`AssignAgentModal`, `TransferHubModal`, `OrderDetailsModal`) to `ordersApi` + `hubsApi`; ensure `scanWarehouse`/`assign`/`autoAssign`/`transfer`/`authorizeReturn` invalidate `Order` + `Hub` + `Agent`. | Phase 5b green | `lint`, `build`, **16/16 E2E** (esp. inventory slot math, `H001→H002` transfer, capacity=8 concurrency). | Revert hub-manager folder PR. | 1–1.5d |
| **Phase 5d: Admin Portal & Shared Chrome** | `redux/phase-5d-admin-shared` | Add `usersApi` + `notificationsApi` + remaining `financeApi`/`supportApi`; migrate 8 Admin pages (`AdminDashboard`, `UserManagement`, `SystemConfiguration`, `PricingConfiguration`, `ComplaintsManagement`, `FeedbackReview`, `MerchantTickets`, `ReportsAnalytics`, `FinancialAnalytics`, `ExpenseView`) + `Topbar` notifications (30s poll) + optionally `OrderMessages` (5s poll). | Phase 5c green | `lint`, `build`, **16/16 E2E** pass; zero redundant `GET /users` or `GET /notifications` on tab switch. | Revert Admin + `Topbar` PR. | 1.5–2d |
| **Phase 6: Cleanup** | `redux/phase-6-cleanup` | Remove legacy `services/session.js`, `services/api.js` (or keep only pure blob download if `barcode` stays fetch-based), `useHubOrders.js`, and dead `customerService`/`merchantHelpers` fetch wrappers. Replace all remaining `getSessionUser()` calls with `useAppSelector(selectCurrentUser)`. Update `README.md` & `docs/redux-migration/HANDOFF.md`. | All 5 portals on Redux & 16/16 E2E green | Zero imports of `session.js`/`api.js`/`useHubOrders`; `lint`, `build`, Vitest, **16/16 E2E** pass. | Restore removed helpers from git if needed. | 0.5–1d |

> **Why Customer is the recommended Pilot (Phase 4):** Only 4 pages, exercises queries (`orders`, `complaints`, `feedback`), parameterized lookup (`tracking?id=`), mutations (`confirmDelivery`, `createComplaint`, `createFeedback`), and `OrderDetailsDrawer`—low blast radius while validating RTK Query tags and normalizer selectors end-to-end before touching complex forms (`BookShipment`) or 3-modal workflows (`Hub Manager`).

---

## 4. Coexistence Strategy (Phases 3–5)

- **Bridge Pattern in `authListeners.js`:** While Phase 4–5 portals migrate one by one, `authSlice` continues writing `x-auth-token` and `user` to `localStorage` and dispatching `swifttrack-session-change` on login/logout/401, and `api.js` still reads `Token.get()`. This guarantees unmigrated portals (`Admin`, `Hub`, etc.) keep working seamlessly alongside migrated portals.
- **Independent Portals:** Because users only operate within one role portal per browser tab (`RequireRole` enforces role boundaries), migrating one portal per PR creates zero cross-portal UI conflicts.
- **No-Reentry Rule:** Once a page switches to an RTK Query hook (`useGetOrdersQuery`), remove its `useEffect` fetch and local `orders` `useState` in the same PR so two sources of truth never coexist in the same component.

---

## 5. Testing Strategy

1. **Before Migration (Phase 2 — Characterization Tests):**
   - Stabilize all 16 tests in `frontend-react/e2e/workflows.spec.mjs` as the non-negotiable integration contract.
   - Add **Vitest + React Testing Library** unit/characterization tests for pure business rules (`orderStatus.js`, `warehouseWorkflow.js`, `merchantHelpers.getAutoDimensions`, `customerService.normalizeOrder`, `merchantHelpers.normalizeBackendOrder`) so behavior parity is verified in milliseconds during refactoring.
2. **During Migration (Phases 3–5):**
   - **Slice & Listener Tests:** Test `authSlice` reducers, `localStorage` sync, `401` clearing, and `apiSlice.util.resetApiState()` on logout.
   - **Selector Tests:** Test memoized `createSelector` order transformations for Customer, Merchant, and Agent portals (verifying zero extra array allocations on unrelated state updates).
   - **Component + Store Tests:** Render complex components (`BookShipment`, `AgentWorklist`, `OrderQueue`) with a helper `renderWithStore(ui, { preloadedState })` + mocked `fetch`/MSW to assert `409` quote mismatch recovery, `503` ticket retry preservation, and `role="alert"` absence on success.
3. **Gate Before Every PR:** `npm run lint` + `npm run build` + Vitest unit suite + `$env:SWIFTTRACK_BROWSER='chrome'; npm.cmd run test:e2e`.

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner Role |
| --- | :---: | :---: | --- | --- |
| **Stale cache across mutations** (e.g., `scanWarehouse` updates hub inventory but `Hub` tag isn't invalidated) | High | High | Define explicit `invalidatesTags` matrix (`scanWarehouse` invalidates `'Order'` and `'Hub'`; `assign`/`autoAssign`/`completeDelivery` invalidate `'Order'` and `'Agent'`). | Portal PR author + Reviewer |
| **Cross-user data leak after logout/re-login** in same tab (breaks multi-role manual/E2E testing) | Medium | Critical | Dispatch `apiSlice.util.resetApiState()` inside `authListeners.js` on `sessionCleared` and `setCredentials` when `user.id` changes. | Foundation Lead (Phase 3) |
| **`role="alert"` leakage across routes** (breaking `workflows.spec.mjs:66` smoke checks) | Medium | High | Keep mutation/query errors scoped to the specific hook/component (`error` from `use...Query`/`use...Mutation`), never in a persistent global `uiSlice` alert banner. | All Portal Owners |
| **`BookShipment` `409` / `MerchantSupport` `503` regression** (losing user form inputs on error) | Medium | High | Keep form fields in component-local `useState`; explicitly catch mutation `.unwrap()` errors to trigger `refetch()` of hubs/quote without resetting form state. | Merchant Portal Owner |
| **Incompatible order shapes** when sharing `ordersApi` | Medium | Medium | Store canonical `IOrder` in cache; derive portal views strictly inside `selectFromResult` or `createSelector` helpers. | Pilot + Portal Owners |
| **Node / Playwright environment drift** on team machines | High | Medium | Pin Node 22+ and run `npm ci` (never `npm install` that drifts lockfiles) in Phase 2 before any Redux PR. | Team Owner / Backup |

---

## 7. Definition of Done & Measurable Success Metrics

### Whole-Migration Definition of Done
- All 5 portals (`admin`, `customer`, `hub-manager`, `merchant`, `agent`) and `Topbar`/`Sidebar`/`RequireRole` read/write state through Redux Toolkit + RTK Query.
- `services/session.js`, `useHubOrders.js`, `AgentLayout` `<Outlet context />`, and redundant `useEffect` fetchers removed.
- Zero `getSessionUser()` render-time reads remaining.
- `npm run lint` (0 errors), `npm run build` (clean), Vitest suite (100% pass), and all **16/16 Playwright E2E scenarios** pass.
- `docs/redux-migration/HANDOFF.md` and `README.md` updated.

### Measurable Metrics (Track Before Phase 3 vs. After Phase 6)
1. **Redundant API calls per portal session:** Measure via Playwright network log across the `can open every portal page` tests (target: eliminate duplicate `GET /users`, `GET /hubs`, `GET /orders` calls when switching tabs within a portal — **>= 50% reduction** in navigation fetches).
2. **Main JS bundle delta:** Record `dist/assets/index-*.js` gzip size in Phase 2 baseline vs. Phase 6 (expected delta: `+12 to +18 kB` gzip).
3. **Unit test coverage on state logic:** From **0** frontend unit tests today to **100% of slices, selectors, and pure workflow helpers covered**.
4. **Re-render isolation:** Verify via React DevTools Profiler that toggling `ui.sidebarExpanded` or receiving a background `notifications` poll does not re-render portal tables/charts (`MerchantOrders`, `UserManagement`, `OrderQueue`).

---

## 8. Concrete Before & After Code Examples (From SwiftTrack)

### Example 1: Auth & Session (`services/session.js` + `RequireRole.jsx` → `authSlice.js` + `authApi.js`)

**Before (`frontend-react/src/RequireRole.jsx:6-27`):**
```jsx
export default function RequireRole({ roles }) {
  const location = useLocation();
  const token = useSyncExternalStore(subscribeToSession, Token.get);
  const [attempt, retry] = useState(0);
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    API.auth.me().then(user => {
      if (!active || Token.get() !== token) return;
      saveSession(token, user);
      setSession({ token, attempt, user });
    }, error => {
      if (active) setSession({ token, attempt, error: error.message });
    });
    return () => { active = false; };
  }, [token, attempt]);
```

**After (`features/auth/authSlice.js` + `RequireRole.jsx`):**
```js
// features/auth/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const readInitialUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('x-auth-token'),
    user: readInitialUser(),
  },
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    setSessionUser(state, action) {
      state.user = action.payload;
    },
    sessionCleared(state) {
      state.token = null;
      state.user = null;
    },
  },
});

export const { setCredentials, setSessionUser, sessionCleared } = authSlice.actions;
export const selectAuthToken = (state) => state.auth.token;
export const selectCurrentUser = (state) => state.auth.user;
export default authSlice.reducer;
```
```jsx
// RequireRole.jsx (using RTK Query getMe + authSlice)
export default function RequireRole({ roles }) {
  const location = useLocation();
  const token = useAppSelector(selectAuthToken);
  const { data: user, isLoading, isError, error, refetch } = useGetMeQuery(undefined, { skip: !token });

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  if (isLoading) return <p role="status">Checking your session…</p>;
  if (isError) {
    return (
      <main>
        <p role="alert">{error?.message || 'Session check failed'}</p>
        <button onClick={refetch}>Try again</button>
      </main>
    );
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={dashboards[user.role] || '/login'} replace />;
  }
  return <Outlet />;
}
```

---

### Example 2: Shared Orders Cache + Merchant Normalization (`merchantHelpers.js` + `MerchantOrders.jsx` → `ordersApi.js`)

**Before (`frontend-react/src/features/merchant/MerchantOrders.jsx:24-73`):**
```jsx
const [orders, setOrders] = useState([]);
// ...
useEffect(() => {
  let active = true;
  fetchMerchantOrders().then(data => { if (active) setOrders(data); }, ...);
  return () => { active = false; };
}, []);

async function handleCancelOrder(order) {
  const updated = await cancelMerchantOrder(order.backendId);
  setOrders(previous => previous.map(item => item.backendId === updated.backendId ? updated : item));
}
```

**After (`services/endpoints/ordersApi.js` + `MerchantOrders.jsx`):**
```js
// services/endpoints/ordersApi.js
import { apiSlice } from '../apiSlice';

export const ordersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: () => '/orders',
      providesTags: (result = []) => [
        { type: 'Order', id: 'LIST' },
        ...result.map(({ id }) => ({ type: 'Order', id })),
      ],
    }),
    cancelOrder: builder.mutation({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
        { type: 'Hub', id: 'LIST' },
        { type: 'Agent', id: 'LIST' },
      ],
    }),
  }),
});
export const { useGetOrdersQuery, useCancelOrderMutation } = ordersApi;
```
```jsx
// In MerchantOrders.jsx — reads shared cache via memoized selector, no local orders state
const selectMerchantOrders = useMemo(() => createSelector(
  (res) => res.data ?? [],
  (orders) => orders.map(normalizeBackendOrder),
), []);

const { orders, isLoading, error: loadError } = useGetOrdersQuery(undefined, {
  selectFromResult: (result) => ({
    ...result,
    orders: selectMerchantOrders(result),
  }),
});
const [cancelOrder, { isLoading: cancelling, error: cancelError }] = useCancelOrderMutation();
```

---

### Example 3: Eliminating `AgentLayout` 13-Prop `<Outlet context />` (`AgentLayout.jsx` → `agentsApi.js` + `AgentWorklist.jsx`)

**Before (`frontend-react/src/features/agent/AgentLayout.jsx:51-168`):**
```jsx
const [orders, setOrders] = useState([]);
const [agent, setAgent] = useState(null);
// ... 9 more useState calls + manual refreshOrders + updateOrder ...
<Outlet context={{
  orders, user: currentUser, agent, savingAvailability, saveAvailability,
  saveProfile, busyOrder, refreshOrders, setAcceptModalOrder: openAccept,
  setConfirmModalOrder: openConfirm, advanceOrder: ...
}} />
```

**After (`AgentLayout.jsx` + `AgentWorklist.jsx`):**
- `AgentLayout.jsx` keeps only the shell (`Sidebar`, `Topbar` reading `useGetAgentProfileQuery(user.id)` and `useUpdateAvailabilityMutation()`, plus `<Outlet />` with **zero context props**).
- `AgentWorklist.jsx` reads `useGetAgentWorklistQuery(userId)` directly and calls `useUpdateOrderStatusMutation()` / `useCompleteDeliveryMutation()` locally—when `completeDelivery` succeeds, RTK Query invalidates `{ type: 'Order', id: 'LIST' }`, `{ type: 'Agent', id: userId }`, and `DeliveryHistory` / `AgentDashboard` / `AgentProfile` update automatically with zero manual `refreshOrders()` wiring.
