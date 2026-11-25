# 📌 SwiftTrack: Redux Migration — Live Handoff & Status

**BRANCH BASELINE:** `ReactEvalFixes` (`fa7d7cdf`)  
**STACK (Verified):** React `19.2.8` (`19.3.0`) + Vite `8.3` (`frontend-react/`), NestJS `11.0.1` + `node:sqlite` (`back-end/`), 5 portals (`admin`, `customer`, `hub-manager`, `merchant`, `agent`).  
**OWNER:** `[TBD]` | **BACKUP:** `[TBD]` | **LAST UPDATED:** `2026-11-25`

---

## Phase Status Table

| Phase | Branch | Status | Owner | Summary / Next Action |
| --- | --- | --- | --- | --- |
| **Phase 0: Audit (READ-ONLY)** | `ReactEvalFixes` | **DONE** | Antigravity | Audit complete (`00`–`07` + `appendix-coverage-checklist.md`). Recommendation: **Go with modifications** (RTK + RTK Query; fix Phase 2 blockers first). |
| **Phase 1: Review & Decide** | `ReactEvalFixes` | **NEXT** | Team | Read `00-executive-summary.md` & `05-migration-plan.md`. Fill Open Decisions below and pick pilot portal. |
| **Phase 2: Safety Net** | `redux/phase-2-safety-net` | Pending | — | Run `npm ci` in both apps, clean untracked `components/hub-manager/` & dead `RoleSelector.jsx`, fix `/hub` `<Outlet />` (`BLK-04`) & `DashBoard.jsx` (`BLK-08`), add Vitest, pass 16/16 Playwright E2E. |
| **Phase 3: Foundation** | `redux/phase-3-foundation` | Pending | — | Install `@reduxjs/toolkit` + `react-redux`, create `store.js`, `authSlice`, `authListeners`, `uiSlice`, `apiSlice`, migrate `RequireRole`/`Login`/`Sidebar`. |
| **Phase 4: Pilot Portal** | `redux/phase-4-customer-pilot` | Pending | — | Recommended pilot: **Customer** (`CustomerDashboard`, `CustomerOrders`, `CustomerTracking`, `CustomerSupport`). |
| **Phase 5a–d: Rollout** | `redux/phase-5a-*` .. `5d-*` | Pending | — | 1 PR per portal: `Merchant` → `Agent` → `Hub Manager` → `Admin + Topbar`. |
| **Phase 6: Cleanup** | `redux/phase-6-cleanup` | Pending | — | Remove `session.js`, `useHubOrders.js`, `AgentLayout` Outlet context, redundant `api.js` wrappers; update docs. |

---

## Open Decisions (Settle in Phase 1)

- [ ] **Active frontend:** Confirm `frontend-react/` is the only live frontend (`front-end/` archived).
- [ ] **Language:** Stay on JavaScript in `frontend-react/` or adopt TypeScript incrementally?
- [ ] **Pilot portal:** Confirm `Customer` as Phase 4 pilot?
- [ ] **Ownership & deadline:** Assign Owner, Backup, portal owners, and target completion date.
- [ ] **Repo hygiene:** Untrack `.DS_Store`, 0-byte `back-end/database.sqlite` & `sqlite.db`, and confirm whether `back-end/data/swifttrack.db` should be untracked.

---

## Deliverables Index (`docs/redux-migration/`)

- [00-executive-summary.md](./00-executive-summary.md) — Recommendation, top risks, effort, decisions needed
- [01-state-inventory.md](./01-state-inventory.md) — Full 50-entry frontend state table + pathologies
- [02-architecture-and-repo-overview.md](./02-architecture-and-repo-overview.md) — Directory tree, deps, routing, 45-endpoint API & DB map
- [03-blockers-and-risks.md](./03-blockers-and-risks.md) — Baseline check results, test survivability, `BLK-01`..`BLK-11`
- [04-options-evaluation.md](./04-options-evaluation.md) — 5-option scoring matrix & state boundary rules
- [05-migration-plan.md](./05-migration-plan.md) — Target architecture, strangler-fig phases, 3 before/after examples
- [06-first-sprint-tasks.md](./06-first-sprint-tasks.md) — Developer checklist (`T1`–`T16`)
- [07-open-questions.md](./07-open-questions.md) — Open decisions & runtime items to verify
- [appendix-coverage-checklist.md](./appendix-coverage-checklist.md) — 100% frontend file audit checklist (79/79 JS/JSX)
