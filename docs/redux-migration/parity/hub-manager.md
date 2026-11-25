# Parity Checklist: Hub-Manager Portal

## Pre-Migration Inventory (V1) — Observed Before Switching

### Files Owned by Hub-Manager Portal
- `frontend-react/src/App.jsx` (lines 75-84, BLK-04 flat `/hub/*` route layout)
- `frontend-react/src/features/hub-manager/HubManagerLayout.jsx`
- `frontend-react/src/features/hub-manager/DashBoard.jsx` (includes BLK-08 inline `hubId` checks)
- `frontend-react/src/features/hub-manager/OrderQueue.jsx`
- `frontend-react/src/features/hub-manager/Warehouse.jsx`
- `frontend-react/src/features/hub-manager/Dispatch.jsx`
- `frontend-react/src/features/hub-manager/HubTransfer.jsx`
- `frontend-react/src/features/hub-manager/Reports.jsx`
- `frontend-react/src/features/hub-manager/modals/AssignAgentModal.jsx`
- `frontend-react/src/features/hub-manager/modals/TransferHubModal.jsx`
- `frontend-react/src/features/hub-manager/modals/OrderDetailsModal.jsx`

### Workflows, Routes, API Calls, Forms, Role Checks
1. **Route & Role Guard (`App.jsx:75-84`, `RequireRole.jsx`)**
   - Protected by `<RequireRole roles={['hub_manager']} />`.
   - Routes: `/hub` -> `/hub/dashboard`, `/hub/dashboard`, `/hub/queue`, `/hub/dispatch`, `/hub/transfer`, `/hub/warehouse`, `/hub/reports`, `/hub/complaints`.
   - BLK-04: Each `/hub/*` route previously rendered its own `<HubManagerLayout title="...">` wrapper instead of nested `<Route path="/hub" element={<HubManagerLayout />}>` with `<Outlet />`.
   - Sidebar (`HubManagerLayout.jsx`): `{ name: user.name || 'Hub Manager', role: 'Hub Manager' }`.
   - Topbar: route title + `notificationOrderPath={id => '/hub/queue?id=' + encodeURIComponent(id)}`.
2. **DashBoard (`DashBoard.jsx:1-202`)**
   - Reads `hubId` via `authSlice` (`selectCurrentUser`) / previously `useHubOrders`. If `!hubId`, error `'No hub is assigned to this account.'`.
   - Fetches `GET /orders` and `GET /hubs/:hubId/agents`.
   - Computes KPIs (`Active Orders`, `Pending Orders`, `Available Agents`, `Delivered Orders`), filters (`All`, `Pending`, `Assigned`, `InTransit`, `OutForDelivery`, `Delivered`).
   - BLK-08: Inline assign/transfer eligibility check (`hubId && order.pickupHubId === hubId && order.status === "Pending" && !order.assignedAgentId`). Opens `AssignAgentModal`, `TransferHubModal`, `OrderDetailsModal`.
3. **OrderQueue (`OrderQueue.jsx:1-137`)**
   - Uses `GET /orders`, `?id=` URL search param, status tabs (`All`..`Failed`), `canAssign`/`canTransfer` from `warehouseWorkflow.js`, opens all 3 modals.
4. **Warehouse (`Warehouse.jsx:1-154`)**
   - Fetches `GET /hubs/:hubId` and `GET /orders` (requires `hubId`, else `'Your account needs a hub before you can scan parcels.'`).
   - Submits `PATCH /orders/:reference/warehouse` (`action: 'check-in' | 'check-out'`, `autoAssign`). Refocuses barcode input after scan. Displays next-step text & queue link.
5. **Dispatch (`Dispatch.jsx:1-84`)**
   - Fetches `GET /orders`, filters with `canAssign(order, hubId)`, opens `AssignAgentModal` and `OrderDetailsModal`.
6. **HubTransfer (`HubTransfer.jsx:1-63`)**
   - Fetches `GET /orders`, filters with `canTransfer(order, hubId)`, opens `TransferHubModal` and `OrderDetailsModal`.
7. **Reports (`Reports.jsx:1-337`)**
   - Fetches `GET /orders` + `GET /hubs/:hubId/agents` (requires `hubId`, else `'No hub is assigned to this account.'`), computes hub KPIs, order status bar chart, pending backlog age distribution, and agent workload table.
8. **Modals (`AssignAgentModal`, `TransferHubModal`, `OrderDetailsModal`)**
   - `AssignAgentModal`: fetches `GET /hubs/:hubId/agents`, dispatches `PATCH /orders/:id/auto-assign` or `PATCH /orders/:id/assign`, refetches hub agents on 409/400.
   - `TransferHubModal`: fetches `GET /hubs` filtered to `hub.hubId !== pickupHub && hub.status === 'active' && (!reservedDestination || hub.hubId === reservedDestination)`, submits `PATCH /orders/:id/transfer`.
   - `OrderDetailsModal`: shows `WarehouseNextStep` + `OrderMessages` (`channel="hub"` when `order.assignedAgentId && order.pickupHubId === hubId`), edits order via `PUT /orders/:id`, authorizes return via `PATCH /orders/:id/return`.

---

## Post-Migration Verification (V2–V4)

- **V2 (Parity Evidence):**
  - `App.jsx:75-84` & `HubManagerLayout.jsx:1-51` (**BLK-04 fix**): Nested `<Route path="/hub" element={<HubManagerLayout />}>` with `<Outlet />`, `HUB_PAGE_TITLES` per-route Topbar title mapping, `useAppSelector(selectCurrentUser)` for Sidebar user.
  - `DashBoard.jsx:15-61` (**BLK-08 fix**): Reads `hubId` from `selectCurrentUser`, fetches `useGetOrdersQuery` + `useGetAgentsForHubQuery`, preserves `canHandlePendingPickup` inline check (`hubId && order.pickupHubId === hubId && order.status === "Pending" && !order.assignedAgentId`) with identical access behavior.
  - `OrderQueue.jsx:12-23`, `Dispatch.jsx:9-21`, `HubTransfer.jsx:10-21` — Read `hubId` from `selectCurrentUser`, `useGetOrdersQuery(undefined, { skip: !hubId })`, keep `?id=` URL param and `warehouseWorkflow` (`canAssign`, `canTransfer`) identical.
  - `Warehouse.jsx:9-62` — Reads `hubId` from `selectCurrentUser`, uses `useGetHubByIdQuery`, `useGetOrdersQuery`, `useScanWarehouseMutation`, refocuses barcode input cleanly, and preserves `Refresh inventory`.
  - `Reports.jsx:37-65` — Reads `hubId` from `selectCurrentUser`, uses `useGetOrdersQuery` + `useGetAgentsForHubQuery`, preserves KPI cards, charts, and overdue/attention lists.
  - `AssignAgentModal.jsx:12-41` — Uses `selectCurrentUser`, `useGetAgentsForHubQuery`, `useAssignAgentMutation`, `useAutoAssignAgentMutation`, refetches agents on `409`/`400`.
  - `TransferHubModal.jsx:10-49` — Uses `useGetHubsQuery`, `useTransferOrderMutation`.
  - `OrderDetailsModal.jsx:13-53` — Uses `selectCurrentUser`, `useAuthorizeReturnMutation`, `useUpdateOrderMutation`, renders `<OrderMessages channel="hub" />`.
- **V3 (E2E):** **NOT VERIFIED** (`back-end/node_modules` absent). **Manual Checklist:**
  1. Log in as Hub Manager -> navigate across `/hub/dashboard`, `/hub/queue`, `/hub/dispatch`, `/hub/transfer`, `/hub/warehouse`, `/hub/reports`, `/hub/complaints` -> verify persistent Sidebar/Topbar does NOT remount on route change and Topbar title updates accurately per route.
  2. On `/hub/warehouse` -> scan check-in/check-out, verify slot KPIs + table update + barcode input refocuses + `Open order in queue` link works.
  3. On `/hub/dispatch`, `/hub/transfer`, `/hub/queue`, `/hub/dashboard` -> test auto-assign, manual assign, transfer hub, edit order, authorize return, and hub chat (`OrderMessages`).
  4. On `/hub/reports` -> verify charts and agent workload render accurately.
- **V4 (Loading / Empty / Error / Tags):** Checked across all 9 files; no-hub fallback messages preserved; RTK Query mutations invalidate `Order`, `Agent`, `Hub`, `Revenue`, `Notification`.
