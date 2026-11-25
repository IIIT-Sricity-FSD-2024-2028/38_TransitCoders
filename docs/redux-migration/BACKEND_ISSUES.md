# Backend Contract Mismatches & Notes (`BACKEND_ISSUES.md`)

All items below were verified directly against `back-end/src/` and `frontend-react/src/`. Per migration rules, **`back-end/` was NOT modified**; the Redux Toolkit / RTK Query layer adapts to the backend's current behavior while preserving strict parity.

---

## 1. `ExpensesController` response envelope mismatch
- **Backend (`back-end/src/expenses/expenses.controller.ts:17-59`):** Returns `{ status: 'success', data, message }` instead of the standard `{ success: true, data, message }` (`IApiResponse`). Also omits `@ApiTags` / `@ApiHeader` Swagger decorators.
- **Frontend adaptation (`frontend-react/src/app/api/baseApi.js:60-68`):** `baseQueryWithReauth` unwraps `'data' in payload` whenever `payload` is a non-`Blob` object, so both envelopes unwrap seamlessly.

## 2. `UpdatePricingConfigDto` rejects `agentPayoutFlat` despite `GET /pricing/config` returning it
- **Backend (`back-end/src/pricing/pricing.service.ts:23-33,88` vs `back-end/src/pricing/dto/quote.dto.ts:21-70`):** `GET /pricing/config` returns `agentPayoutFlat`, but `UpdatePricingConfigDto` does not declare it. With global `ValidationPipe({ forbidNonWhitelisted: true })`, sending the full config object back to `PUT /pricing/config` returns HTTP `400`.
- **Frontend adaptation (`frontend-react/src/components/admin/PricingConfiguration.jsx`):** Sends only the 8 whitelisted pricing fields rather than echoing the full `GET /pricing/config` object.

## 3. `TicketsRepository.update` ignores `category` and `description`
- **Backend (`back-end/src/tickets/tickets.repository.ts:76-92`):** `PUT /tickets/:id` only persists a subset of fields and ignores updates to `category` and `description`.
- **Frontend impact:** Reported as-is; UI matches existing behavior.

## 4. Hub-manager order visibility vs hub order chat restriction
- **Backend (`back-end/src/orders/orders.service.ts:105-116` vs `back-end/src/orders/order-messages.service.ts:33-34`):** `getAuthorizedOrder` grants Hub Managers read access when `user.hubId` matches either `pickupHubId` OR `deliveryHubId`, whereas `OrderMessagesService.thread` restricts the `hub` message channel strictly to `user.hubId === order.pickupHubId`.
- **Frontend adaptation (`frontend-react/src/features/hub-manager/modals/OrderDetailsModal.jsx`):** Keeps the existing hub message channel behavior intact and reports any 403/empty state cleanly.

## 5. `ComplaintsService.create` / `FeedbackService.create` unowned-order error wording
- **Backend (`back-end/src/complaints/complaints.service.ts` / `back-end/src/feedback/feedback.service.ts`):** Returns HTTP `403` / `404` (`You do not have access to this order` / `Order ... not found`) when submitting against an order not owned by the customer.
- **Frontend parity requirement (`frontend-react/src/features/customer/CustomerSupport.jsx`, `frontend-react/e2e/workflows.spec.mjs:261-264`):** The UI and E2E suite assert the exact message `'Enter the tracking ID or order ID of one of your shipments.'`. Frontend preserves the pre-submission `ordersApi.endpoints.getOrderById` lookup check (mapping `403`/`404` to `null`) so the exact error copy is preserved.

## 6. Legacy `: any` fields on `CreateComplaintDto` and `CreateFeedbackDto`
- **Backend (`back-end/src/complaints/dto/create-complaint.dto.ts:31-44`, `back-end/src/feedback/dto/create-feedback.dto.ts:32-48`):** Declare optional `: any` legacy fields (`customer`, `status`, `userId`) to avoid `forbidNonWhitelisted` `400` rejections from legacy clients.
- **Frontend adaptation (`frontend-react/src/features/support/supportApi.js`):** Sends only the canonical normalized fields matching `services/api.js`.

## 7. Unused backend routes/modules relative to `frontend-react/`
- **Backend:** Exposes `/roles`, `/shipments`, `PATCH /orders/:id/pickup`, `DELETE /orders/:id`, `POST /agents/:id/delivery-photo` (superseded by `PATCH /orders/:id/delivery`), `GET /reports/operations`, and `GET /reports/payments` (note `GET /reports/payments` exists in `api.js` and `FinancialAnalytics` — unused routes are `/roles`, `/shipments`, `PATCH /orders/:id/pickup`, `DELETE /orders/:id`, `POST /agents/:id/delivery-photo`, `GET /reports/operations`).
- **Frontend adaptation:** Only active endpoints used by `frontend-react/` are exposed by default in RTK Query slices (plus `getOperationsReport` / `getPaymentLedger` in `financeApi.js` where used or part of reports).
