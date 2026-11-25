# Parity Checklist: Customer Portal

## Pre-Migration Inventory (V1) — Observed Before Switching

### Files Owned by Customer Portal
- `frontend-react/src/features/customer/CustomerLayout.jsx`
- `frontend-react/src/features/customer/CustomerDashboard.jsx`
- `frontend-react/src/features/customer/CustomerOrders.jsx`
- `frontend-react/src/features/customer/CustomerTracking.jsx`
- `frontend-react/src/features/customer/CustomerSupport.jsx`
- `frontend-react/src/components/customer/OrderDetailsDrawer.jsx` (uses `OrderMessages` — migrated in Shared Chrome step)

### Workflows, Routes, API Calls, Forms, Role Checks
1. **Route & Role Guard (`App.jsx:42-48`, `RequireRole.jsx`)**
   - Protected by `<RequireRole roles={['customer']} />`.
   - Routes: `/customer` -> `/customer/dashboard`, `/customer/dashboard`, `/customer/orders`, `/customer/tracking`, `/customer/support`.
   - Sidebar (`CustomerLayout.jsx:13-18`): displays session user's `name` and fixed role label `'Customer'`; links to `/customer/dashboard`, `/customer/tracking`, `/customer/orders`, `/customer/support`.
   - Topbar (`CustomerLayout.jsx:21`): title `"Customer Portal"`, notification click path `/customer/tracking?id=${encodeURIComponent(id)}`.
2. **Customer Dashboard (`CustomerDashboard.jsx:1-77`, `customerService.js:33-45`)**
   - Fetches `GET /orders` + `GET /complaints`.
   - Loading state: skeleton placeholders (`"Connecting to SwiftTrack backend..."`).
   - Error state: `<p role="alert">Could not load the dashboard. {error}</p>`.
   - Derived stats: `activeShipments` (`isActiveOrder(order.status)`), `delivered` (`statusKey(order.status) === 'delivered'`), `supportTickets` (`complaints.length`).
   - Empty state: `"No active shipments right now."` when no active order.
   - Displays `LiveTrackingCard` (`activeOrders[0]`) and `RecentActivity` (`orders.slice(0, 4)`).
3. **My Orders (`CustomerOrders.jsx:1-200`, `customerService.js:29-31`)**
   - Fetches `GET /orders` normalized with `normalizeOrder` (`backendId: order.id`, `id: order.orderId || order.id`, Indian locale formatted dates, fallback labels).
   - Query param `?id=`: auto-opens `OrderDetailsDrawer` for matching `o.id === targetId || o.trackingId === targetId`.
   - Client filters: search input (`trackingId`, `id`, `deliveryAddress`, `packageType`) + status tabs (`ALL`, `IN TRANSIT`, `DELIVERED`, `PENDING`, `CANCELLED`).
   - Loading: 6 pulse cards. Empty: `"No matching orders found"`. Error: `<p role="alert">{error}</p>`.
   - Clicking a card opens `OrderDetailsDrawer` (`OrderMessages` on channel `'customer'` with `orderId={order.backendId}`).
4. **Live Tracking (`CustomerTracking.jsx:1-108`, `customerService.js:47-64`)**
   - Reads `?id=` query param. Re-submitting same ID refreshes order data; submitting different ID updates `?id=`.
   - Fetches `GET /orders/${encodeURIComponent(reference)}` where `/^(TRK|ORD)-/i` references are uppercased.
   - Maps HTTP 403/404 to `'No shipment found for "${id}".'`.
   - Loading: `<p role="status">Loading shipment…</p>`.
   - If `order.assignedAgentId`, renders `<OrderMessages orderId={order.backendId} channel="customer" label="Message delivery agent" />`.
   - Receipt confirmation: shown when `order.status === 'Delivered'` and `statusHistory` has no `'Receipt confirmed by customer'` note; calls `PATCH /orders/${order.backendId}/confirm`, showing `'Confirming…'` and `'Receipt confirmed.'` (`<p role="status">`).
5. **Help & Customer Support (`CustomerSupport.jsx:1-371`, `customerService.js:58-88`)**
   - Reads optional `?orderId=` query param to prefill both Complaint and Feedback `orderId` fields.
   - Fetches `GET /complaints` and `GET /feedback` on load; shows `"Support history could not be loaded. ..."` if either fails.
   - Tabs: `'COMPLAINT'` and `'FEEDBACK'`.
   - **Complaint form:** `orderId`, `type` (`'Delivery Delay'` default), `details`, `priority` (`'Medium'` default). Validates non-empty `orderId` + `details` (`'Please provide both the order ID and an explanation.'`). Pre-checks order ownership via `GET /orders/:ref` and throws exact `'Enter the tracking ID or order ID of one of your shipments.'` on 403/404 before `POST /complaints`. Success banner: `'Complaint submitted successfully.'`.
   - **Feedback form:** `orderId`, `rating` (`5` default), `comment`. Validates non-empty `orderId` + `comment` (`'Please provide the order ID and your comment.'`). Same ownership pre-check (`'Enter the tracking ID or order ID of one of your shipments.'`) before `POST /feedback`. Success banner: `'Thank you for your feedback! Rating of ${rating} stars recorded.'`.

---

## Post-Migration Verification (V2–V4)

- **V2 (Parity Evidence):**
  - `CustomerLayout.jsx:8-10` — Reads `selectCurrentUser` from `authSlice` (`useAppSelector(selectCurrentUser)`), renders `{ name: user?.name || '', role: 'Customer' }`.
  - `CustomerDashboard.jsx:8-30` — Uses `useGetOrdersQuery()` (`GET /orders`) and `useGetComplaintsQuery()` (`GET /complaints`), computes `buildCustomerDashboardData` (`customerSelectors.js:34-45`) in `useMemo`, preserves skeleton, `<p role="alert">Could not load the dashboard. {error}</p>`, and `"No active shipments right now."`.
  - `CustomerOrders.jsx:11-45` — Uses `useGetOrdersQuery()` + `normalizeCustomerOrder`, derives `?id=` drawer selection purely via `useMemo` (`pickedId`/`closed` per `param`) without `useEffect` `setState`, keeps `FILTER_TABS`, `searchTerm`, and `<OrderDetailsDrawer>` identical.
  - `CustomerTracking.jsx:14-75` — Uses `useGetOrderByIdQuery(reference, { skip: !reference })` and `useConfirmDeliveryMutation()`, uppercases `/^(TRK|ORD)-/i`, maps `403`/`404` to `No shipment found for "${id}".`, supports re-submit refetch via `refetch()`, keeps `'Receipt confirmed.'` status and `<OrderMessages orderId={order.backendId} channel="customer" />`.
  - `CustomerSupport.jsx:42-119` — Uses `useGetComplaintsQuery()`, `useGetFeedbackQuery()`, `useLazyGetOrderByIdQuery()`, `useCreateComplaintMutation()`, and `useCreateFeedbackMutation()`. Preserves `verifyOwnedOrder` pre-check throwing exact `'Enter the tracking ID or order ID of one of your shipments.'` on `403`/`404`. Keeps local controlled form state so errors never clear input.
- **V3 (E2E):** **NOT VERIFIED** — Playwright E2E requires backend NestJS + SQLite (`back-end/node_modules` is absent and `back-end/` is read-only/out of scope). **Manual Verification Checklist:**
  1. Log in as a customer -> verify `/customer/dashboard` renders KPIs, Live Tracking Card, Recent Activity.
  2. Navigate to `/customer/orders` and `/customer/orders?id=<orderId>` -> verify cards render, search/filter tabs work, drawer opens automatically and closes cleanly.
  3. Navigate to `/customer/tracking` -> search valid `TRK-...`, invalid ID (`No shipment found for "..."`), send chat message if assigned, and click `Confirm Receipt` on a Delivered order.
  4. Navigate to `/customer/support` -> submit complaint/feedback with invalid ID (verify exact message `'Enter the tracking ID or order ID of one of your shipments.'`), submit valid complaint/feedback, verify banners and history list update automatically.
- **V4 (Loading / Empty / Error / Tags):** Checked on all 4 pages; `confirmDelivery`, `createComplaint`, `createFeedback` invalidate `{ type: 'Order', id: 'LIST' }`, `Complaint`, `Feedback`, and `Notification` without polling loops.
