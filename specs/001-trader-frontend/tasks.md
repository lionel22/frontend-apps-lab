---
description: 'Task list for Trader Frontend (001-trader-frontend)'
---

# Tasks: Trader Frontend

**Input**: spec.md, plan.md  
**Branch**: `feat/001-trader-frontend`  
**Scope**: Release 001 includes `P1 + P2 + P3` in one release  
**Organization**: Tasks grouped by implementation sequence, not by separate release commitments. `[P]` marks tasks that can run in parallel. `[BE]` marks paired backend work required to unblock the frontend.

---

## Sequence 0: Contract Lock And Frontend Foundation

**Goal**: Establish the app shell, typed adapter layer, auth-aware API handling, test tooling, and mock fixtures for backend gaps.

- [x] T001 [P] Create the frontend app structure under `apps/trader/src/{layouts,pages,components,composables,stores,utils,types}` and confirm route naming conventions for Release 001 | **Effort**: small (1d)
- [x] T002 [P] Configure Vuetify app shell in `apps/trader/nuxt.config.ts`, `apps/trader/src/app.vue`, and `apps/trader/src/layouts/default.vue` | **Effort**: small (1d)
- [x] T003 Create Pinia stores in `apps/trader/src/stores/{trader,ui,cache}.ts` with typed state and invalidation hooks | **Effort**: small (1d) | **Depends on**: T001
- [x] T004 Create typed API endpoint constants and shared normalization utilities in `apps/trader/src/utils/{constants,formatters}.ts` for numeric-string parsing and date handling | **Effort**: small (1d) | **Depends on**: T001
- [x] T005 Implement `useTraderApi.ts` with support for guarded trader endpoints, 401/403/429 handling, request cancellation, and structured error mapping | **Effort**: medium (2d) | **Depends on**: T004
- [x] T006 Implement `usePolling.ts`, `useLocalStorage.ts`, and `useCacheInvalidation.ts` for refresh, filter persistence, and mutation refetches | **Effort**: medium (2d) | **Depends on**: T003, T004
- [x] T007 Create frontend API adapters and base types in `apps/trader/src/types/trader.ts` for status, watchlist, signals, positions, trades, backtest run detail, and weight profile | **Effort**: medium (2d) | **Depends on**: T004, T005
- [x] T008 Add shared UI primitives: `ApiErrorAlert.vue`, `LoadingSpinner.vue`, `Toast.vue`, confirmation dialog, and empty-state patterns | **Effort**: medium (2d) | **Depends on**: T002
- [x] T009 Add frontend test tooling for the app package: Vitest, Vue Test Utils, and mock server strategy (MSW or equivalent) | **Effort**: medium (2d) | **Depends on**: T001
- [x] T010 Create mock fixtures and handlers for currently missing backend endpoints: backtest history, signal correlation, audit log, and optional trades total count | **Effort**: medium (2d) | **Depends on**: T007, T009

---

## Sequence 1: Read Surfaces On Existing Backend Contracts

**Goal**: Deliver all read-only views that are already supported by live trader backend endpoints.

- [x] T011 Build dashboard summary card components for `GET /api/v1/status` in `apps/trader/src/components/dashboard/StatusCards.vue` | **Effort**: small (1d) | **Depends on**: T002, T007
- [x] T012 Build dashboard signal heatmap in `apps/trader/src/components/dashboard/SignalHeatmap.vue` using aggregated signal responses | **Effort**: medium (2d) | **Depends on**: T002, T007
- [x] T013 Implement dashboard page in `apps/trader/src/pages/index.vue` with status, watchlist snapshot, signal snapshot, and stale/error states | **Effort**: medium (2d) | **Depends on**: T005, T006, T011, T012
- [x] T014 Build watchlist table and filter controls in `apps/trader/src/components/watchlist/` using live `WatchlistAsset[]` data | **Effort**: medium (2d) | **Depends on**: T002, T006, T007
- [x] T015 Implement watchlist page in `apps/trader/src/pages/watchlist.vue` with persisted sector/liquidity filters | **Effort**: small (1d) | **Depends on**: T014
- [x] T016 Build signal contribution and stale-indicator components in `apps/trader/src/components/signals/` from `GET /api/v1/signals` | **Effort**: medium (2d) | **Depends on**: T002, T007
- [x] T017 Implement signals page in `apps/trader/src/pages/signals.vue` with symbol drill-down, staleness display, and polling | **Effort**: medium (2d) | **Depends on**: T005, T006, T016
- [x] T018 Build positions table and risk summary components in `apps/trader/src/components/positions/` from `GET /api/v1/positions` | **Effort**: medium (2d) | **Depends on**: T002, T007
- [x] T019 Implement positions page baseline in `apps/trader/src/pages/positions.vue` with read-only polling before actions are enabled | **Effort**: small (1d) | **Depends on**: T018, T005, T006
- [x] T020 Build trades table, expander, and metrics components in `apps/trader/src/components/trades/` using current offset/limit array response | **Effort**: medium (2d) | **Depends on**: T002, T007
- [x] T021 Implement trades page baseline in `apps/trader/src/pages/trades.vue` with current pagination contract and normalization of PnL/fees/funding | **Effort**: medium (2d) | **Depends on**: T020, T005, T006
- [x] T022 Build backtest launch form around `BacktestLaunchDto` constraints in `apps/trader/src/components/backtest/BacktestLaunchModal.vue` | **Effort**: medium (2d) | **Depends on**: T002, T004, T007
- [x] T023 Implement backtest launch page shell in `apps/trader/src/pages/backtest/index.vue` using mocks for history but real launch action wiring | **Effort**: medium (2d) | **Depends on**: T010, T022, T005, T006
- [x] T024 Build backtest run detail chart and trade log components in `apps/trader/src/components/backtest/` from `GET /api/v1/backtest/:runId` | **Effort**: medium (2d) | **Depends on**: T002, T007
- [x] T025 Implement backtest run detail page in `apps/trader/src/pages/backtest/results-[id].vue` or route-equivalent with status polling | **Effort**: medium (2d) | **Depends on**: T024, T005, T006
- [x] T026 Add read-surface manual proof pass for dashboard, watchlist, signals, positions, trades, and backtest run detail against current backend | **Effort**: small (1d) | **Depends on**: T013, T015, T017, T019, T021, T025

---

## Sequence 2: Protected Mutations And Safety UX

**Goal**: Add operator actions and validation-heavy flows on top of the existing protected backend endpoints.

- [x] T027 Decide and implement frontend session bootstrap strategy for guarded `CombinedAuth` endpoints in `apps/trader/src/composables/useSession.ts` or equivalent | **Effort**: medium (2d) | **Depends on**: T005
- [x] T028 Add route/middleware protection and operator-facing unauthorized/forbidden states without inventing unsupported backend auth routes | **Effort**: medium (2d) | **Depends on**: T027
- [x] T029 Implement `kill-switch` and `resume` action composables using `POST /api/v1/control/kill-switch` and `POST /api/v1/control/resume` with required `actor` and `reason` | **Effort**: medium (2d) | **Depends on**: T005, T027
- [x] T030 Build kill-switch and resume confirmation UX in `apps/trader/src/components/positions/KillSwitchButton.vue` and related dialog components | **Effort**: small (1d) | **Depends on**: T008, T029
- [x] T031 Wire action surfaces into dashboard and positions pages with disabled/loading/retry behavior and status refetch | **Effort**: medium (2d) | **Depends on**: T013, T019, T030, T006
- [x] T032 Build config form input model around current `PUT /api/v1/config/weights` contract, including `actor`, optional `reason`, `weights`, and `thresholds` | **Effort**: medium (2d) | **Depends on**: T004, T007, T027
- [x] T033 Create `ConfigForm.vue` and `DiffViewer.vue` with sum-to-one and threshold validation matching backend behavior | **Effort**: medium (2d) | **Depends on**: T032
- [x] T034 Implement config page in `apps/trader/src/pages/config.vue` with versioned readback, inline `422` mapping, and cache invalidation | **Effort**: medium (2d) | **Depends on**: T033, T005, T006
- [x] T035 Harden `useTraderApi.ts` and shared error UX for `401`, `403`, `422`, and `429` responses with operator-readable messaging | **Effort**: medium (2d) | **Depends on**: T005, T008, T027
- [ ] T036 Add mutation-proof manual validation for kill-switch, resume, and config update in a safe environment | **Effort**: small (1d) | **Depends on**: T031, T034, T035

---

## Sequence 3: Release 001 Backend Contract Gap Closure

**Goal**: Close the backend gaps that currently block full Release 001 feature completion.

- [x] T037 [BE] Add a backtest history/list endpoint in [apps/trader/src/api/controllers/backtest.controller.ts](/Users/demax/Documents/dev/breexio/nestjs-apps-lab/apps/trader/src/api/controllers/backtest.controller.ts) returning recent runs with enough metadata for the history UI | **Effort**: medium (2d) | **Depends on**: none
- [x] T038 Replace frontend mock backtest history with the real backend endpoint and finalize `BacktestList.vue` | **Effort**: medium (2d) | **Depends on**: T023, T037
- [x] T039 [BE] Add a signal-correlation read endpoint plus DTO/service projection in [apps/trader](/Users/demax/Documents/dev/breexio/nestjs-apps-lab/apps/trader) for Release 001 analytics | **Effort**: medium (3d) | **Depends on**: none
- [x] T040 Build correlation matrix, trend chart, and signal detail components against the real correlation contract in `apps/trader/src/components/signals/` | **Effort**: medium (3d) | **Depends on**: T010, T039
- [x] T041 Implement correlation page in `apps/trader/src/pages/correlation.vue` with real data and seeded/empty-state handling | **Effort**: medium (2d) | **Depends on**: T040, T005, T006
- [x] T042 [BE] Add an audit-log read endpoint for configuration changes, preferably based on explicit projection rather than raw notification records | **Effort**: medium (3d) | **Depends on**: none
- [x] T043 Build audit-log table and filter UI in `apps/trader/src/components/config/AuditLog.vue` against the real read model | **Effort**: medium (2d) | **Depends on**: T010, T042
- [x] T044 Implement audit-log page in `apps/trader/src/pages/audit-log.vue` with date/operator filtering and pagination or load-more | **Effort**: medium (2d) | **Depends on**: T043, T005, T006
- [x] T045 [BE] Decide and implement the trades pagination completion strategy: either add a `total` count or explicitly bless a load-more contract | **Effort**: small (1d) | **Depends on**: none
- [x] T046 Finalize frontend trades pagination UX using the agreed backend contract | **Effort**: small (1d) | **Depends on**: T021, T045

---

## Sequence 4: Hardening, Tests, And Release Proof

**Goal**: Produce reproducible evidence that Release 001 is correct, safe, and aligned with the constitution.

- [x] T047 [P] Add unit tests for numeric normalization, date formatting, and adapter mapping in `apps/trader/src/**/__tests__/` | **Effort**: medium (2d) | **Depends on**: T004, T007, T009
- [x] T048 [P] Add tests for `useTraderApi.ts` covering guarded requests, auth failures, rate limiting, and validation errors | **Effort**: medium (2d) | **Depends on**: T005, T035, T009
- [x] T049 [P] Add tests for polling, stale refresh, and cache invalidation composables | **Effort**: medium (2d) | **Depends on**: T006, T009
- [x] T050 [P] Add component tests for dashboard, watchlist, and signals slices | **Effort**: medium (2d) | **Depends on**: T013, T015, T017, T009
- [x] T051 [P] Add component tests for positions, trades, config, and correlation slices | **Effort**: medium (2d) | **Depends on**: T031, T034, T041, T046, T009
- [x] T052 Add integration tests for backtest launch and run-status polling against the real or staged backend contract | **Effort**: medium (2d) | **Depends on**: T023, T025, T009
- [x] T053 Add integration tests for kill-switch and resume flows including required `actor` and `reason` payloads | **Effort**: medium (2d) | **Depends on**: T031, T009
- [x] T054 Add integration tests for config update and audit-log visibility | **Effort**: medium (2d) | **Depends on**: T034, T044, T009
- [ ] T055 Validate frontend performance budgets: initial load, polling render cost, and bundle size | **Effort**: medium (2d) | **Depends on**: T013, T015, T017, T041, T044
  Validation snapshot (2026-05-18, post-optimization): local preview nav timing `domContentLoaded=43.3ms`, `load=43.4ms`, HTML transfer reduced to `~406.9KB` (from `~849.7KB` in prior Lighthouse run).
  Polling render latency on `/positions` remains within budget at p50=`1.9ms`, p95=`2.3ms`; client bundle gzip total=`251.81KB` (29 JS/CSS assets) => polling and bundle budgets pass.
  Lighthouse simulated network checks improved but still miss initial-load target: `3G FCP=11.10s`, `4G FCP=1.04s` (`LCP=18.91s` and `1.64s`) vs required `<3s` on 3G and `<1s` on 4G, so T055 remains open.
- [x] T056 Run frontend validation commands and capture results: `pnpm lint`, `pnpm typecheck`, `pnpm --filter @trader-frontend/trader build`, plus app tests when configured | **Effort**: small (1d) | **Depends on**: T047, T048, T049, T050, T051, T052, T053, T054, T055
- [x] T057 [BE] Run backend validation for any contract changes: `pnpm trader:test`, `pnpm trader:build`, `pnpm trader:lint` | **Effort**: small (1d) | **Depends on**: T037, T039, T042, T045
- [ ] T058 Execute final Release 001 smoke test: dashboard, watchlist, signals, backtest launch/history/detail, positions, trades, kill-switch, resume, config update, correlation, audit log | **Effort**: medium (2d) | **Depends on**: T056, T057
- [ ] T059 Update [quickstart.md](/Users/demax/Documents/dev/breexio/frontend-apps-lab/specs/001-trader-frontend/quickstart.md), [system-design.md](/Users/demax/Documents/dev/breexio/frontend-apps-lab/specs/001-trader-frontend/system-design.md), and app README only where implementation reality changed | **Effort**: small (1d) | **Depends on**: T058
- [ ] T060 Mark release exit only after all acceptance criteria in [spec.md](spec.md) and all contract gaps in [plan.md](plan.md) are satisfied or explicitly re-scoped | **Effort**: small (1d) | **Depends on**: T059

---

## Execution Summary

| Sequence | Tasks | Purpose |
| --- | --- | --- |
| 0 | T001–T010 | Foundation, typed adapters, test tooling, mocks |
| 1 | T011–T026 | Read surfaces already supported by backend |
| 2 | T027–T036 | Protected mutations and safety UX |
| 3 | T037–T046 | Paired backend contract gap closure |
| 4 | T047–T060 | Tests, hardening, release proof |

**Estimated effort**: ~42 to 46 days depending on whether backend contract gaps are handled by the same team or in parallel.  
**Critical path**: T001 → T003 → T005 → T007 → T013 → T023/T025 → T027 → T031 → T037/T039/T042 → T041/T044 → T056 → T058 → T060.

---

## Notes For The Team

- Update checkboxes as work actually completes.
- Do not treat Sequence 1 to 4 as separate releases; they are delivery order inside Release 001.
- If backend gap tasks are postponed, Release 001 is blocked unless the spec is explicitly reduced.
- Prefer adapter-layer fixes over per-component data parsing.
- For risky actions, require proof in tests plus a manual check in a safe environment.

---

## Constitution Gates

- [x] App boundaries remain explicit: frontend work stays in `apps/trader` unless reuse is proven
- [x] External contracts are validated and mirrored in typed adapters and form validation
- [x] Dangerous actions (`kill-switch`, `resume`, config update) require deliberate UX guardrails
- [x] Async and polling flows expose observable loading, stale, retry, and failure states
- [x] Validation evidence exists for frontend changes and any paired backend contract changes
- [ ] Spec, plan, and tasks stay synchronized through Release 001 completion
