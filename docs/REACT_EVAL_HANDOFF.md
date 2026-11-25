# SwiftTrack React evaluation handoff

Use the `ReactEvalFixes` branch. The app runs from `frontend-react` and `back-end`. See the [README](../README.md#5-testing-instructions) for the full startup instructions, demo accounts, and shipment walkthrough.

## What changed

| Area | Changes |
| --- | --- |
| Access and navigation | Shared session handling, role-protected routes, registration, sign-out, responsive navigation, and persisted notifications for all five portals. |
| Booking and merchant tools | Booking uses registered customer accounts and backend prices. The merchant can view real orders, track shipments, print barcode labels, cancel eligible shipments, and open support tickets. The label dialog sits above page content and scrolls on small screens. |
| Warehouse and dispatch | Hub managers can check parcels in and out using a tracking barcode or order ID. The queue shows the next available action, and transfers update the current hub. Destination check-in can assign an eligible agent automatically. |
| Agent and customer portals | Agents can update availability, advance assigned deliveries, attach proof photos, report issues, and export delivery history. Customers can track their own shipments, confirm receipt, file complaints, and submit feedback. Eligible cancellation and return actions update payment records. |
| Shipment messaging | Hub managers and assigned agents can message each other. Agents and customers have a separate conversation on the same shipment. Messages persist and generate notifications for the participants. |
| Admin and support | Account and agent approval, hub and pricing configuration, expenses, reports, complaint handling, feedback review, and merchant ticket resolution use live backend data. |

## Rules to know

- A new booking with a pickup hub reserves one parcel slot per distinct hub. Check-in converts the reservation into stored inventory, and check-out frees the slot. A cancelled parcel that was physically checked in still needs to be checked out.
- Inter-hub parcels are checked in and out at the origin, transferred, then checked in at the destination. Final delivery assignment happens at the destination. At that hub, check-out is required before the agent can mark the parcel picked up.
- **Auto-assign at the destination hub** is enabled by default in Warehouse. Clear it before check-in to choose an agent manually. Each eligible agent can carry up to eight active deliveries. Automatic assignment selects the eligible agent with the fewest active deliveries. If every agent is full or unavailable, the parcel stays checked in and pending. Retry with **Auto-assign** from the order or rescan with auto-assignment enabled after an agent becomes available.
- Billable weight rounds up in half-kilogram increments. The backend uses the configured rates and rechecks the confirmed quote at booking. If the price changes, the merchant must review the new total before submitting again.
- SQLite adds warehouse and message records on startup and preserves existing orders and hub load figures. Orders created before warehouse reservations were introduced follow their original workflow. The migration was checked against a database copy.

## Run and verify

Use Node.js 22. In separate terminals, install dependencies in `back-end` and `frontend-react` with `npm ci`. Start `npm run start:dev` in the backend and `npm run dev` in the frontend. The React app opens at `http://localhost:5173`. For a fresh demo database, set `NODE_ENV=development` and `SEED_DEV_DATA=true` in the backend terminal before startup. Set `DB_FILE` to a fresh local path when you want isolated demo data.

For the Windows browser suite, run the following from the repo root with Chrome installed.

```powershell
cd frontend-react
$env:SWIFTTRACK_BROWSER = 'chrome'
npm.cmd run test:e2e
```

Append `-- --headed` to watch it run. The suite builds both apps and uses a temporary seeded database. If Playwright reports a trace archive write error, rerun with `npm.cmd run test:e2e -- --trace off`.

For a manual review, book a parcel from Chennai (`H001`) to Mumbai (`H002`). Check it in and out in Chennai and choose **Transfer Hub**. In Mumbai, check it in to auto-assign a local agent, open the order to message the agent, and check it out for handoff. As that agent, accept and deliver the parcel. As the customer, use **Live Tracking** to follow the shipment, exchange a message, and confirm receipt. The README has the exact demo logins and controls.

## Verification and follow-up

- The full 16-scenario Chrome suite passed before the final assignment and label changes. After those changes, three focused Chrome scenarios passed, including mobile label controls, both assignment modes, and retrying assignment when capacity opens up. The broader first rerun hit a timeout and a Playwright trace archive error.
- The backend checks passed with 12 unit tests, 22 integration tests, and 54 live API checks during the evaluation. The final UI and assignment changes were verified against a compiled backend in Chrome. An affected H001-to-H002 shipment was reproduced successfully on a SQLite snapshot.
- Verify a physical keyboard-input scanner at the hub. The browser tests entered tracking IDs through the scanner field.
