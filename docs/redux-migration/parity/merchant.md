# Parity Checklist: Merchant Portal

## Pre-Migration Inventory (V1) — Observed Before Switching

### Files Owned by Merchant Portal
- `frontend-react/src/features/merchant/MerchantLayout.jsx`
- `frontend-react/src/features/merchant/MerchantDashboard.jsx`
- `frontend-react/src/features/merchant/BookShipment.jsx`
- `frontend-react/src/features/merchant/MerchantOrders.jsx`
- `frontend-react/src/features/merchant/TrackShipment.jsx`
- `frontend-react/src/features/merchant/AnalyticsReport.jsx`
- `frontend-react/src/features/merchant/MerchantSupport.jsx`
- `frontend-react/src/components/merchant/ShippingLabelModal.jsx`

### Workflows, Routes, API Calls, Forms, Role Checks
1. **Route & Role Guard (`App.jsx:50-58`, `RequireRole.jsx`)**
   - Protected by `<RequireRole roles={['merchant']} />`.
   - Routes: `/merchant` -> `/merchant/dashboard`, `/merchant/dashboard`, `/merchant/book`, `/merchant/orders`, `/merchant/track`, `/merchant/analytics`, `/merchant/support`.
   - Sidebar (`MerchantLayout.jsx:22-58`): `{ name: user.name, role: 'Merchant' }`.
2. **Merchant Dashboard (`MerchantDashboard.jsx:1-301`)**
   - Fetches `GET /orders` normalized with `normalizeBackendOrder`.
   - Status badge in header: `'CONNECTED'` / `'UNAVAILABLE'` / `'LOADING'`.
   - Computes KPIs (`total`, `delivered`, `transit`, `pending`, `cancelled`, `spend` for `paymentStatus === 'paid'`), progress bar percentages, `activeOrder` widget with AWB Barcode button + `/merchant/track?id=...` link, and recent 5 orders table with `ShippingLabelModal`.
3. **Book Shipment (`BookShipment.jsx:1-184`)**
   - Fetches `GET /hubs` filtered to `hub.status === 'active'`.
   - Requests live quote via `POST /pricing/quote` whenever `serviceLevel`, `weight` (0.1–50 kg), or `paymentMode` changes (or manual refresh button).
   - Computes auto dimensions via `getAutoDimensions(packageType, weight)`.
   - Validates hubs selected, neither selected hub full (`remainingCapacity === 0`), optional `pickupScheduledAt` in the future.
   - Submits `POST /orders` with `quotedTotal: currentQuote.data.total`; opens `ShippingLabelModal` for booked order; preserves form state on error and refreshes hubs + quote on HTTP `409` or `400`.
4. **My Shipments (`MerchantOrders.jsx:1-255`)**
   - Fetches `GET /orders`, filters by `searchTerm` and status pills (`ALL`, `PENDING`, `ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RETURNED`, `FAILED`).
   - Allows `PATCH /orders/:id/cancel` when status is `PENDING` or `ASSIGNED`.
   - Opens `ShippingLabelModal` on tracking ID / Label click.
5. **Track Shipment (`TrackShipment.jsx:1-89`)**
   - Uses `?id=` query param, fetches `GET /orders`, finds match on `id`, `trackingNumber`, or `backendId` (case-insensitive).
   - Shows quick-pick chips for up to 6 orders when no `?id=` selected.
   - Re-submitting same ID forces refresh; different ID updates `?id=`.
   - Shows timeline + `ShippingLabelModal` trigger.
6. **Analytics Report (`AnalyticsReport.jsx:1-275`)**
   - Fetches `GET /orders` and `GET /tickets` in parallel.
   - Filters orders by timeframe (`All Time`, `Last 30 Days`, `Last 90 Days`, `This Year`) and renders KPIs, top routes table, and issue breakdown.
7. **Support Center (`MerchantSupport.jsx:1-190`)**
   - Fetches `GET /tickets` normalized (`id: ticket.ticketId || ticket.id`, uppercase status & priority).
   - Modal form submits `POST /tickets` (`{ subject, category, description, priority: 'med' }`). Preserves modal open + inputs on error (`503` retry parity).
8. **ShippingLabelModal (`ShippingLabelModal.jsx:1-184`)**
   - Fetches SVG barcode Blob via `GET /orders/${backendId}/barcode` using `AbortController`, displays via `URL.createObjectURL`, revokes on cleanup, uses `getAutoDimensions`.

---

## Post-Migration Verification (V2–V4)

- **V2 (Parity Evidence):**
  - `MerchantLayout.jsx:22-23` — Uses `useAppSelector(selectCurrentUser)`, passes `{ name: user?.name || '', role: 'Merchant' }`.
  - `MerchantDashboard.jsx:25-33` — Uses `useGetOrdersQuery()`, computes KPIs/percentages/activeOrder via `normalizeMerchantOrder`, preserves `CONNECTED` / `UNAVAILABLE` / `LOADING` pill, progress bar, and recent 5 table.
  - `BookShipment.jsx:16-100` — Uses `useGetHubsQuery()` (`status === 'active'`), `useGetPricingQuoteMutation()` with request `.abort()` cleanup, `useCreateOrderMutation()` returning `normalizeMerchantOrder(created)`, and calls `refetchHubs()` + `setQuoteRefresh` on HTTP `409`/`400` without clearing `form`.
  - `MerchantOrders.jsx:23-70` — Uses `useGetOrdersQuery()` and `useCancelOrderMutation()`, preserves `searchTerm`, `statusFilter`, `cancelling` guard, and `ShippingLabelModal`.
  - `TrackShipment.jsx:14-70` — Uses `useGetOrdersQuery()`, matches `[item.id, item.trackingNumber, item.backendId]` case-insensitively, preserves quick-pick chips, same-ID `refetch()`, timeline, and `ShippingLabelModal`.
  - `AnalyticsReport.jsx:14-35` — Uses `useGetOrdersQuery()` + `useGetTicketsQuery()`, preserves timeframe filtering, route grouping, and ticket exception breakdown.
  - `MerchantSupport.jsx:14-56` — Uses `useGetTicketsQuery()` + `useCreateTicketMutation()`, keeps modal open and inputs intact on submission error.
  - `ShippingLabelModal.jsx:19-46` — Uses non-Redux `fetchOrderBarcodeBlob(order.backendId, { signal, token })` (`selectAuthToken`) and `getAutoDimensions` from `merchantSelectors.js`.
- **V3 (E2E):** **NOT VERIFIED** (`back-end/node_modules` absent). **Manual Checklist:**
  1. Log in as merchant -> verify `/merchant/dashboard` shows `CONNECTED` badge, KPIs, progress bar, recent shipments table.
  2. Go to `/merchant/book` -> pick hubs, change weight/service level, verify live quote updates, submit order -> verify `ShippingLabelModal` renders AWB SVG barcode.
  3. Go to `/merchant/orders` -> filter by status/search, open barcode label, cancel a `PENDING`/`ASSIGNED` order.
  4. Go to `/merchant/track`, `/merchant/analytics`, `/merchant/support` -> search by order ID, inspect analytics routes/issues, create a support ticket and verify error retention on failure.
- **V4 (Loading / Empty / Error / Tags):** Checked on all 7 files; `createOrder`/`cancelOrder` invalidate `Order` list, `Hub`, `Revenue`, `Notification`; `createTicket` invalidates `Ticket` and `Notification`.
