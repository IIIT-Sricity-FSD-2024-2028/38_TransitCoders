# Parity Checklist: Admin Portal & Shared Chrome

## Pre-Migration Inventory (V1) — Observed Before Switching

### Files Owned by Admin Portal & Shared Chrome
- Shared Auth/Chrome: `Login.jsx`, `Register.jsx`, `RequireRole.jsx`, `Sidebar.jsx`, `Topbar.jsx`, `OrderMessages.jsx`, `LandingPage.jsx`
- Admin Layouts & Views: `AdminLayout.jsx`, `AdminDashboard.jsx`, `UserManagement.jsx`, `SystemConfiguration.jsx`, `ComplaintsManagement.jsx`, `FeedbackReview.jsx`, `MerchantTickets.jsx`, `ReportsAnalytics.jsx`, `FinancialAnalytics.jsx`
- Admin Modals & Panels: `AddOrEditUserModal.jsx`, `AddOrEditDeliveryZone.jsx`, `PricingConfiguration.jsx`, `ExpenseView.jsx`

### Workflows, Routes, API Calls, Forms, Role Checks
1. **Shared Auth & Chrome**
   - `Login.jsx`: `POST /auth/login`, validates `DASHBOARDS[user.role]`, dispatches `setCredentials({ token, user })`, persists `swifttrack_remembered_email`.
   - `Register.jsx`: `POST /auth/register`, role toggle `customer`/`merchant`, shows role-specific status copy.
   - `RequireRole.jsx`: calls `GET /auth/me` when token present; redirects `/login` if missing or wrong role's dashboard; shows `'Checking your session…'` and `'Try again'` retry on error.
   - `Sidebar.jsx`: `POST /auth/logout` -> clears session and navigates `'/'`.
   - `Topbar.jsx`: polls `GET /notifications/unread-count` every 30s; opens dropdown to fetch `GET /notifications`, mark read (`PATCH /notifications/:id/read`), mark all read (`PATCH /notifications/read-all`), and link `orderPath(item.orderId)`.
   - `OrderMessages.jsx`: when toggled open, polls `GET /orders/:id/messages/:channel` every 5s; posts `POST /orders/:id/messages/:channel`; compares `senderId === currentUser.id` (`'You'` vs `senderName`).
   - `LandingPage.jsx`: public `GET /tracking/:trackingId` lookup.
2. **Admin Route & Role Guard (`App.jsx:29-40`)**
   - Protected by `<RequireRole roles={['admin', 'super_user']} />`.
   - `AdminLayout.jsx`: role label `'Super User'` vs `'Admin'`.
3. **Admin Dashboard (`AdminDashboard.jsx:1-191`)**
   - Parallel fetches: `GET /users`, `GET /orders`, `GET /complaints`, `GET /hubs`.
   - Computes KPIs (`Total Users`, `Active Shipments`, `Open Complaints`, `Database Status`, `API Latency`, `Pending Approvals`, `Active Hubs`) + 5 recent users + 5 recent complaints.
4. **User Management (`UserManagement.jsx`, `AddOrEditUserModal.jsx`)**
   - Fetches `GET /users` + `GET /hubs`. Role gate `canManagePrivilegedRoles = role === 'super_user'`.
   - Supports approve (`PATCH /users/:id/approve`), delete (`DELETE /users/:id`), create (`POST /users`), edit (`PUT /users/:id` with optional password and hub assignment).
5. **System Configuration (`SystemConfiguration.jsx`, `AddOrEditDeliveryZone.jsx`, `PricingConfiguration.jsx`)**
   - Delivery Zones tab: `GET /hubs`, create (`POST /hubs`), edit (`PUT /hubs/:id`), delete (`DELETE /hubs/:id`, gated by `role === 'super_user'`).
   - Pricing tab: `GET /pricing/config`, updates ONLY the 8 `pricingFields` via `PUT /pricing/config` (omitting `agentPayoutFlat` per `BACKEND_ISSUES.md #2`).
6. **Complaints Management (`ComplaintsManagement.jsx:1-331`)**
   - Fetches `GET /complaints` + `GET /orders/mishaps`, normalizes mishaps (`isMishap: true`), sorts newest-first, filters by search/priority/status, updates complaint status via `PUT /complaints/:id`.
7. **Feedback Review (`FeedbackReview.jsx:1-264`)**
   - Fetches `GET /feedback`, filters by search/rating/status, marks `'Reviewed'` via `PUT /feedback/:id`.
8. **Merchant Tickets (`MerchantTickets.jsx:1-61`)**
   - Fetches `GET /tickets` + `GET /users`, updates ticket status via `PUT /tickets/:id`.
9. **Reports & Analytics (`ReportsAnalytics.jsx:1-208`)**
   - Fetches `GET /users`, `GET /complaints`, `GET /feedback` and derives 5 chart datasets (`roleData`, `activeUsers`, `complaintData`, `complaintStatus`, `feedbackRatings`).
10. **Financial Analytics & Expenses (`FinancialAnalytics.jsx`, `ExpenseView.jsx`)**
   - Fetches `GET /reports/revenue` + `GET /expenses`; Expense Ledger creates (`POST /expenses`) and deletes (`DELETE /expenses/:id`).

---

## Post-Migration Verification (V2–V4)

- **V2 (Parity Evidence):**
  - Shared Chrome/Auth:
    - `Login.jsx:11-50` — `useLoginMutation()` (`authApi`), `DASHBOARDS[user.role]`, `dispatch(setCredentials({ token, user }))`, remembered email localStorage preserved.
    - `Register.jsx:7-34` — `useRegisterMutation()` (`authApi`), exact role confirmation copy.
    - `RequireRole.jsx:5-27` — `selectAuthToken` + `useGetMeQuery(undefined, { skip: !token })`, `Try again` `refetch()`, `DASHBOARDS` redirect.
    - `Sidebar.jsx:13-30` — `useLogoutMutation()` (`authApi`) + `sessionCleared()` in `onQueryStarted`.
    - `Topbar.jsx:14-67` — `useGetUnreadCountQuery(undefined, { pollingInterval: 30_000 })`, `useGetNotificationsQuery(undefined, { skip: !open })`, mark read / mark all read mutations.
    - `OrderMessages.jsx:19-60` — `selectCurrentUser`, `useGetOrderMessagesQuery({ id: orderId, channel }, { pollingInterval: 5000 })`, `useSendOrderMessageMutation()`.
    - `LandingPage.jsx:9-33` — `useLazyTrackOrderQuery()` public tracking lookup.
  - Admin Portal:
    - `AdminLayout.jsx:8-10` — `useAppSelector(selectCurrentUser)` (`Super User` vs `Admin`).
    - `AdminDashboard.jsx:11-94` — `useGetUsersQuery`, `useGetOrdersQuery`, `useGetComplaintsQuery`, `useGetHubsQuery`, memoized KPIs + DB status + latency.
    - `UserManagement.jsx:9-50` + `AddOrEditUserModal.jsx:4-70` — `selectCurrentUser`, `useGetUsersQuery`, `useGetHubsQuery`, `useApproveUserMutation`, `useDeleteUserMutation`, `useCreateUserMutation`, `useUpdateUserMutation`.
    - `SystemConfiguration.jsx:8-44` + `AddOrEditDeliveryZone.jsx:4-84` + `PricingConfiguration.jsx:11-55` — `selectCurrentRole`, `useGetHubsQuery`, `useDeleteHubMutation`, `useCreateHubMutation`, `useUpdateHubMutation`, `useGetPricingConfigQuery`, `useUpdatePricingConfigMutation` (sending only the 8 `pricingFields`).
    - `ComplaintsManagement.jsx:7-49` — `useGetComplaintsQuery`, `useGetMishapsQuery`, `useUpdateComplaintMutation` with identical mishap normalization and sort.
    - `FeedbackReview.jsx:7-45` — `useGetFeedbackQuery`, `useUpdateFeedbackMutation`.
    - `MerchantTickets.jsx:8-45` — `useGetTicketsQuery`, `useGetUsersQuery`, `useUpdateTicketMutation`.
    - `ReportsAnalytics.jsx:9-62` — `useGetUsersQuery`, `useGetComplaintsQuery`, `useGetFeedbackQuery`.
    - `FinancialAnalytics.jsx:7-16` + `ExpenseView.jsx:5-42` — `useGetRevenueReportQuery`, `useGetExpensesQuery`, `useCreateExpenseMutation`, `useDeleteExpenseMutation` (auto-invalidating `['Expense', 'Revenue']`).
- **V3 (E2E):** **NOT VERIFIED** (`back-end/node_modules` absent). **Manual Checklist:**
  1. Log in / Register / Logout -> verify role redirect, `RequireRole` session verify/retry, Topbar 30s notification feed & mark-read, public landing page tracking.
  2. Admin Dashboard -> verify KPIs, Infrastructure Monitoring cards, Recent Activity lists.
  3. User Management -> search/filter, approve pending user, create/edit user with hub assignment, delete user (`super_user`).
  4. System Configuration -> create/edit/delete delivery zone (`super_user`), edit and save pricing config (`PUT /pricing/config` 200 OK).
  5. Complaints / Feedback / Merchant Tickets / Reports / Financial Analytics & Expenses -> filter, update statuses, review feedback, add & delete expense (verify Revenue overview refreshes automatically).
- **V4 (Loading / Empty / Error / Tags):** Checked across all 20 files; mutations invalidate their respective domain tags plus cross-domain (`User -> Agent/Hub`, `Expense -> Revenue`, `Complaint/Ticket -> Notification`). Note `Sidebar.jsx` previously imported `sessionCleared` which was removed in this diff; lint will confirm zero unused imports.
