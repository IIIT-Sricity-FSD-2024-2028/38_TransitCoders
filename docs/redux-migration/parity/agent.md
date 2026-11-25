# Parity Checklist: Agent Portal

## Pre-Migration Inventory (V1) — Observed Before Switching

### Files Owned by Agent Portal
- `frontend-react/src/features/agent/AgentLayout.jsx`
- `frontend-react/src/features/agent/AgentDashboard.jsx`
- `frontend-react/src/features/agent/AgentWorklist.jsx`
- `frontend-react/src/features/agent/DeliveryHistory.jsx`
- `frontend-react/src/features/agent/ReportIssue.jsx`
- `frontend-react/src/features/agent/AgentProfile.jsx`

### Workflows, Routes, API Calls, Forms, Role Checks
1. **Route & Role Guard (`App.jsx:60-68`, `RequireRole.jsx`)**
   - Protected by `<RequireRole roles={['agent']} />`.
   - Routes: `/agent` -> `/agent/dashboard`, `/agent/dashboard`, `/agent/worklist`, `/agent/history`, `/agent/report-issue`, `/agent/profile`.
   - Sidebar (`AgentLayout.jsx:144-150`): `{ ...currentUser, role: 'Delivery Agent' }`.
   - Topbar (`AgentLayout.jsx:152-157`): `title="Delivery Agent Portal"`, renders `<AgentStatusBadge>` when agent profile is loaded, `profilePath="/agent/profile"`, `notificationOrderPath="/agent/worklist?id=..."`.
2. **Agent Layout & Order Transitions (`AgentLayout.jsx:18-188`)**
   - Fetches `GET /agents/:userId/worklist` (mapped via `mapOrder`) and `GET /agents/:userId`.
   - Previously passed 13 properties via `<Outlet context={...} />`.
   - `updateAvailability`: `PATCH /agents/:userId/availability`, updates notice `'Availability updated to ...'`.
   - `advanceOrder`: `PATCH /orders/:rawId/status` for `PickedUp -> InTransit` and `InTransit -> OutForDelivery`; notice `'${orderId} · ${statusLabel(updated.status)}'`.
   - `AcceptDeliveryModal`: `PATCH /orders/:rawId/status` with `{ status: 'PickedUp' }`.
   - `ConfirmDeliveryModal`: `PATCH /orders/:rawId/delivery` (multipart `FormData` with optional `photo`).
3. **Agent Dashboard (`AgentDashboard.jsx:1-76`)**
   - Reads mapped worklist orders; displays KPIs (`Total Assigned`, `In Transit`, `Pending Pickup`, `Delivered Today`) and `OrderCard` grid.
4. **Agent Worklist (`AgentWorklist.jsx:1-116`)**
   - Reads mapped worklist orders, `?id=` search param, filter tabs (`all`, `pending`, `in-transit`, `delivered`), manual `"Refresh worklist"` button.
5. **Delivery History (`DeliveryHistory.jsx:1-107`)**
   - Filters completed deliveries (`delivered` or `returned` with `deliveredAt`), period selector (`all`, `today`, `week`), search input, pagination (`pageSize = 10`), CSV export, details modal with proof-of-delivery photo note and `.txt` download.
6. **Report Issue (`ReportIssue.jsx:1-103`)**
   - Lists active orders (`Assigned`, `PickedUp`, `InTransit`, `OutForDelivery`), submits `POST /orders/:id/mishap` with `typeMap` normalization, fetches `GET /orders/mishaps` recent issues, displays `'Issue reported for ${order.orderId}.'`.
7. **Agent Profile (`AgentProfile.jsx:1-86`)**
   - Reads agent profile, worklist counts, fetches `GET /hubs/:hubId` (`agent?.hubId || user.hubId`), allows availability toggling and `PATCH /auth/me` via `EditProfile` modal (updating session user + notice `'Profile updated.'`).

---

## Post-Migration Verification (V2–V4)

- **V2 (Parity Evidence):**
  - `agentSlice.js` + `agentSelectors.js` + `useAgentPortal.js` — Eliminated the 13-prop `<Outlet context={...} />` prop-drilling chain. Serialized UI modal/notice state sits in `agentSlice` (reset on `sessionCleared`), while server data comes from RTK Query (`useGetAgentWorklistQuery`, `useGetAgentProfileQuery`).
  - `AgentLayout.jsx:10-70` — Reads `selectCurrentUser`, connects `useAgentPortal()`, renders `<Sidebar>`, `<Topbar>` (`AgentStatusBadge`), `<Outlet />` with no context props, and `<AcceptDeliveryModal>` / `<ConfirmDeliveryModal>`.
  - `AgentDashboard.jsx:6-68` — Reads mapped `orders` and triggers from `useAgentPortal()`.
  - `AgentWorklist.jsx:6-112` — Reads `orders` and `refetchOrders` from `useAgentPortal()`, keeps `?id=` filter and tabs identical.
  - `DeliveryHistory.jsx:21-23` — Reads `orders` from `useAgentPortal()`, preserves CSV export and `.txt` delivery receipt download.
  - `ReportIssue.jsx:16-55` — Uses `useGetMishapsQuery()` and `useReportMishapMutation()`, preserves active order dropdown, `typeMap`, exact `'Issue reported for ${order.orderId}.'` confirmation, and loading/error states.
  - `AgentProfile.jsx:10-49` — Uses `useAgentPortal()`, `useGetHubByIdQuery(hubId, { skip: !hubId })`, and `useUpdateProfileMutation()` (auto-syncing `authSlice` + `'Profile updated.'` notice).
- **V3 (E2E):** **NOT VERIFIED** (`back-end/node_modules` absent). **Manual Checklist:**
  1. Log in as delivery agent -> verify `/agent/dashboard` KPIs and `OrderCard` grid.
  2. Toggle availability in Topbar -> verify status updates and notice appears.
  3. On `/agent/worklist` -> accept pickup (`PickedUp`), advance `PickedUp -> InTransit -> OutForDelivery`, confirm delivery with photo (`Delivered`), test search (`?id=`) and filter tabs.
  4. On `/agent/history` -> test period filters, pagination, CSV export, and delivery details modal.
  5. On `/agent/report-issue` -> submit incident report and verify it appears in Recent Issues.
  6. On `/agent/profile` -> verify assigned hub details load and Edit Profile updates sidebar name + notice.
- **V4 (Loading / Empty / Error / Tags):** Checked on all 6 files; `completeDelivery`, `updateOrderStatus`, `reportMishap`, `updateAgentAvailability`, `updateProfile` invalidate `Order`, `Agent`, `Mishap`, `Auth`, `Notification`.
