# Remaining Team Tasks (`TEAM_TASKS.md`)

All Redux Toolkit + RTK Query code migration tasks for `frontend-react/` are **complete** and committed on `ReactEvalFixes`. Only environment-dependent verification and repository hygiene items remain:

| Priority | Task | Owner | Notes |
| --- | --- | --- | --- |
| **P0** | Install `back-end/` deps (`cd back-end && npm ci`) and run Playwright E2E (`cd frontend-react && npm run test:e2e -- --trace off`) against a copy of `back-end/data/swifttrack.db`. | `[TBD]` | Update each `docs/redux-migration/parity/*.md` V3 section with observed pass/fail counts once run. |
| **P1** | Smoke-test all 6 sections of `MANUAL_TEST_CHECKLIST.md` in a browser (especially `ShippingLabelModal` SVG printing, `BookShipment` live quote `409` recovery, and Agent photo upload `FormData`). | `[TBD]` | Confirms runtime behavior beyond static lint/build. |
| **P2** | Review `docs/redux-migration/BACKEND_ISSUES.md` (7 pre-existing backend contract mismatches such as `UpdatePricingConfigDto` omitting `agentPayoutFlat` and `ExpensesController` envelope) for post-evaluation backend cleanup. | `[TBD]` | Left untouched in this migration per strict parity rules. |
| **P3** | Repo hygiene: verify whether committed SQLite files (`back-end/data/swifttrack.db`, 0-byte `database.sqlite`, `sqlite.db`) or `.DS_Store` should remain tracked before merging `ReactEvalFixes`. | `[TBD]` | Separate PR after evaluation. |
