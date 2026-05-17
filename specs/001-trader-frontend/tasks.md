---
description: 'Task list for Trader Frontend (001-trader-frontend)'
---

# Tasks: Trader Frontend

**Input**: spec.md, plan.md  
**Branch**: `feat/001-trader-frontend`  
**Total Effort**: ~41 days (P1: 16d, P2: 13d, P3: 12d)  
**Organization**: Tasks grouped by phase and user story. [P] marks tasks that can run in parallel.

---

## Phase 0: Setup & Infrastructure

- [ ] T001 [P] Create Nuxt 3 project structure with directory scaffolding at `apps/trader/src/{layouts,pages,components,composables,stores,utils,types}` | **Effort**: small (1d)
- [ ] T002 Configure Pinia store setup in `apps/trader/src/stores/trader.ts`, `ui.ts`, `cache.ts` with TypeScript types in `apps/trader/src/types/stores.ts` | **Effort**: small (1d) | **Depends on**: T001
- [ ] T003 [P] Set up Vuetify 3 theme and global configuration in `nuxt.config.ts` and `apps/trader/src/app.vue` | **Effort**: small (1d)
- [ ] T004 [P] Create HTTP error handling architecture: `useTraderApi` composable in `apps/trader/src/composables/useTraderApi.ts` with request/response interceptors and timeout logic | **Effort**: small (1d)
- [ ] T005 [P] Implement polling composable at `apps/trader/src/composables/usePolling.ts` with configurable intervals (default 5s/10s/30s), pause/resume, and auto-cleanup on unmount | **Effort**: small (1d)
- [ ] T006 [P] Create shared utility functions in `apps/trader/src/utils/formatters.ts`, `validators.ts`, `constants.ts` for dates, prices, API endpoints, and thresholds | **Effort**: small (1d)

---

## Phase 1: Dashboard & Watchlist Foundation (P1)

**Goal**: Operator can view trading status, watchlist, backtest history, and signal strength in real-time.  
**Independent Test**: Dashboard loads <2s, watchlist filters persist, backtest results render without errors, signals update every polling interval.

### User Story 1 — Dashboard and Trading Insights (Priority: P1)

- [ ] T007 [P] [US1] Create Status Card components at `apps/trader/src/components/dashboard/StatusCards.vue` showing trading mode, kill-switch state, watchlist count | **Effort**: small (1d) | **Depends on**: T003, T006
- [ ] T008 [P] [US1] Create Signal Heatmap component at `apps/trader/src/components/dashboard/SignalHeatmap.vue` with real-time per-symbol signal visualization and composite score | **Effort**: medium (2d) | **Depends on**: T003, T006
- [ ] T009 [US1] Implement dashboard page at `apps/trader/src/pages/index.vue` integrating status, watchlist summary, signal heatmap with polling updates every 10s | **Effort**: small (1d) | **Depends on**: T004, T005, T007, T008
- [ ] T010 [P] [US1] Create `usePermissions` composable at `apps/trader/src/composables/usePermissions.ts` for role-based access control (draft: all operators have same role) | **Effort**: small (1d)
- [ ] T011 [US1] Add TypeScript types for dashboard API responses in `apps/trader/src/types/trader.ts`: `StatusSnapshot`, `SignalHeatmapData`, `WatchlistAsset` | **Effort**: small (1d) | **Depends on**: T001

### User Story 2 & 3 — Watchlist & Backtest (Priority: P1)

- [ ] T012 [P] [US1] Create WatchlistTable component at `apps/trader/src/components/watchlist/WatchlistTable.vue` with sector and liquidity tier filters | **Effort**: small (1d) | **Depends on**: T003
- [ ] T013 [P] [US1] Create SectorFilter and LiquidityTierFilter components at `apps/trader/src/components/watchlist/SectorFilter.vue`, `LiquidityTierFilter.vue` | **Effort**: small (1d) | **Depends on**: T003
- [ ] T014 [US1] Implement `useLocalStorage` composable at `apps/trader/src/composables/useLocalStorage.ts` to persist filter state across sessions | **Effort**: small (1d) | **Depends on**: T001
- [ ] T015 [US1] Implement watchlist page at `apps/trader/src/pages/watchlist.vue` integrating table, filters, persistence, and polling updates every 30s | **Effort**: medium (2d) | **Depends on**: T012, T013, T014, T004, T005
- [ ] T016 [P] [US1] Create BacktestList component at `apps/trader/src/components/backtest/BacktestList.vue` displaying history with parameters, metrics (Sharpe, MaxDD, ProfitFactor, Calmar), sortable/paginated | **Effort**: medium (2d) | **Depends on**: T003
- [ ] T017 [P] [US1] Create BacktestLaunchModal component at `apps/trader/src/components/backtest/BacktestLaunchModal.vue` with form for backtest parameters and validation | **Effort**: small (1d) | **Depends on**: T003, T006
- [ ] T018 [US1] Create ResultsChart component at `apps/trader/src/components/backtest/ResultsChart.vue` rendering equity curve and metrics using Chart.js or ApexCharts | **Effort**: medium (2d) | **Depends on**: T003
- [ ] T019 [US1] Implement backtest index page at `apps/trader/src/pages/backtest/index.vue` with BacktestList + launch modal, polling every 30s | **Effort**: small (1d) | **Depends on**: T016, T017, T004, T005
- [ ] T020 [US1] Implement backtest results page at `apps/trader/src/pages/backtest/results-[id].vue` with equity chart, trade log table (paginated 50/page), metrics panel | **Effort**: medium (2d) | **Depends on**: T018, T006, T003

### User Story 1 (continued) — Signals View (Priority: P1)

- [ ] T021 [P] [US1] Create SignalContributionChart component at `apps/trader/src/components/signals/SignalContributionChart.vue` showing per-symbol signal score breakdown and composite confidence | **Effort**: small (1d) | **Depends on**: T003
- [ ] T022 [P] [US1] Create SignalStalenessIndicator component at `apps/trader/src/components/signals/SignalStalenessIndicator.vue` with stale signal warnings and degradation flags | **Effort**: small (1d) | **Depends on**: T003
- [ ] T023 [US1] Implement signals page at `apps/trader/src/pages/signals.vue` with per-symbol signal contributions, composite score, confidence intervals, polling every 10s | **Effort**: medium (2d) | **Depends on**: T021, T022, T004, T005
- [ ] T024 [P] [US1] Create shared `ApiErrorAlert.vue` component at `apps/trader/src/components/shared/ApiErrorAlert.vue` for persistent, dismissible error messages | **Effort**: small (1d) | **Depends on**: T003
- [ ] T025 [P] [US1] Create shared LoadingSpinner component at `apps/trader/src/components/shared/LoadingSpinner.vue` for async loading states | **Effort**: small (1d) | **Depends on**: T003
- [ ] T026 [US1] Add TypeScript types for backtest and signal API responses in `apps/trader/src/types/trader.ts`: `BacktestRun`, `TradeLog`, `SignalData`, `SignalContribution` | **Effort**: small (1d) | **Depends on**: T011

### P1 Testing & Validation

- [ ] T027 [P] [US1] Add unit tests for `useTraderApi` composable in `apps/trader/src/composables/__tests__/useTraderApi.spec.ts` (error handling, timeout, retry) | **Effort**: medium (2d) | **Depends on**: T004
- [ ] T028 [P] [US1] Add unit tests for `usePolling` composable in `apps/trader/src/composables/__tests__/usePolling.spec.ts` (start, pause, cleanup, interval change) | **Effort**: small (1d) | **Depends on**: T005
- [ ] T029 [P] [US1] Add unit tests for `useLocalStorage` composable in `apps/trader/src/composables/__tests__/useLocalStorage.spec.ts` | **Effort**: small (1d) | **Depends on**: T014
- [ ] T030 [US1] Add component tests for StatusCards, SignalHeatmap, WatchlistTable in `apps/trader/src/components/__tests__/` (≥50% coverage) | **Effort**: medium (2d) | **Depends on**: T007, T008, T012
- [ ] T031 [US1] Validate P1 gate: dashboard <2s load time, watchlist filters persist, backtest history renders, signals update without lag, TypeScript strict mode passes, ESLint zero warnings | **Effort**: small (1d) | **Depends on**: T030, T009, T015, T019, T023
- [ ] T032 [P] [US1] Update `apps/trader/README.md` with P1 architecture overview, API contract expectations, and local dev instructions | **Effort**: small (1d)

**P1 Subtotal**: 16 tasks + 5 setup tasks = ~21 days

---

## Phase 2: Live Trading & Position Monitoring (P2)

**Goal**: Operator can view and manage live positions, kill-switch trading, audit trades, and handle authentication errors gracefully.  
**Independent Test**: Positions update every 5s, kill-switch executes <2s, 401 redirects to login, all state mutations logged.

### User Story 2 — Live Execution Controls (Priority: P2)

- [ ] T033 [P] [US2] Create PositionsTable component at `apps/trader/src/components/positions/PositionsTable.vue` with symbol, size, entry price, P&L (realized/unrealized), leverage, risk %, time-in-position | **Effort**: medium (2d) | **Depends on**: T003
- [ ] T034 [P] [US2] Create KillSwitchButton component at `apps/trader/src/components/positions/KillSwitchButton.vue` with confirmation dialog, loading state, success/error toast | **Effort**: small (1d) | **Depends on**: T003, T024
- [ ] T035 [P] [US2] Create RiskIndicator component at `apps/trader/src/components/positions/RiskIndicator.vue` showing portfolio risk percentage and warnings | **Effort**: small (1d) | **Depends on**: T003
- [ ] T036 [US2] Implement positions page at `apps/trader/src/pages/positions.vue` with PositionsTable, kill-switch button, risk panel, polling every 5s | **Effort**: small (1d) | **Depends on**: T033, T034, T035, T004, T005
- [ ] T037 [P] [US2] Create TradesTable component at `apps/trader/src/components/trades/TradesTable.vue` (paginated 50/page, sortable by time) with expandable rows | **Effort**: medium (2d) | **Depends on**: T003
- [ ] T038 [P] [US2] Create TradeExpander component at `apps/trader/src/components/trades/TradeExpander.vue` showing full signal breakdown, regime context, entry/exit conditions | **Effort**: small (1d) | **Depends on**: T003
- [ ] T039 [P] [US2] Create TradeMetricsCard component at `apps/trader/src/components/trades/TradeMetricsCard.vue` displaying fees, funding, slippage, P&L, time-in-trade | **Effort**: small (1d) | **Depends on**: T003
- [ ] T040 [US2] Implement trades page at `apps/trader/src/pages/trades.vue` integrating TradesTable, expander, metrics, pagination, polling every 10s | **Effort**: small (1d) | **Depends on**: T037, T038, T039, T004, T005
- [ ] T041 [US2] Add TypeScript types for positions/trades API responses in `apps/trader/src/types/trader.ts`: `OpenPosition`, `TradeRecord`, `TradeMetrics` | **Effort**: small (1d) | **Depends on**: T026

### Authentication & Error Handling (Priority: P2)

- [ ] T042 [US2] Implement JWT token storage and silent refresh flow in `useTraderApi.ts` with 401 → 403 retry logic and localStorage token management | **Effort**: medium (2d) | **Depends on**: T004
- [ ] T043 [US2] Create login page at `apps/trader/src/pages/login.vue` with form, token storage, redirect to return-to-URL after success | **Effort**: small (1d) | **Depends on**: T042
- [ ] T044 [P] [US2] Enhance `ApiErrorAlert.vue` with retry button, error code display, and dismissal timer (5s auto-dismiss for non-critical errors) | **Effort**: small (1d) | **Depends on**: T024
- [ ] T045 [US2] Add auth guard middleware at `apps/trader/src/middleware/auth.ts` to check token presence and redirect to login if missing/expired | **Effort**: small (1d) | **Depends on**: T042
- [ ] T046 [P] [US2] Create `useCacheInvalidation` composable at `apps/trader/src/composables/useCacheInvalidation.ts` to invalidate cache after mutations (kill-switch, config changes) | **Effort**: small (1d) | **Depends on**: T001, T002

### P2 Testing & Validation

- [ ] T047 [P] [US2] Add integration tests for kill-switch mutation in `apps/trader/src/pages/__tests__/positions.integration.spec.ts` with staging environment API | **Effort**: medium (2d) | **Depends on**: T036
- [ ] T048 [P] [US2] Add tests for auth flow (401 → refresh → retry) in `apps/trader/src/composables/__tests__/useTraderApi.auth.spec.ts` | **Effort**: small (1d) | **Depends on**: T042
- [ ] T049 [P] [US2] Add tests for error scenarios (5xx, timeout, network) in `apps/trader/src/composables/__tests__/useTraderApi.errors.spec.ts` | **Effort**: small (1d) | **Depends on**: T004
- [ ] T050 [US2] Validate P2 gate: positions refresh every 5s without lag, kill-switch confirms and executes <2s, 401 silently refreshes and retries, all errors display `ApiErrorAlert`, integration tests pass | **Effort**: small (1d) | **Depends on**: T047, T036, T044, T050

**P2 Subtotal**: 13 tasks

---

## Phase 3: Signal Intelligence & Configuration (P3)

**Goal**: Operator can analyze signal quality, adjust strategy weights/thresholds, and audit all configuration changes.  
**Independent Test**: Correlation matrix renders with ≥30 trades, config form enforces constraints, mutations persist and log to audit table.

### User Story 3 — Signal Correlation & Analysis (Priority: P3)

- [ ] T051 [P] [US3] Create signal correlation matrix component at `apps/trader/src/components/signals/CorrelationMatrix.vue` with color-coded strength, trend arrows, degradation flags | **Effort**: medium (2d) | **Depends on**: T003
- [ ] T052 [P] [US3] Create signal trend chart component at `apps/trader/src/components/signals/SignalTrendChart.vue` showing per-signal effectiveness over time | **Effort**: small (1d) | **Depends on**: T003
- [ ] T053 [US3] Implement signals/correlation page at `apps/trader/src/pages/correlation.vue` with matrix, trend charts, signal filter UI, degradation flag summary | **Effort**: medium (2d) | **Depends on**: T051, T052, T004, T005
- [ ] T054 [P] [US3] Create signal detail tooltip component at `apps/trader/src/components/signals/SignalDetail.vue` showing hover correlation, trend direction, link to recent trades using that signal | **Effort**: small (1d) | **Depends on**: T003

### Configuration Mutations (Priority: P3)

- [ ] T055 [US3] Create ConfigForm component at `apps/trader/src/components/config/ConfigForm.vue` with weight/threshold inputs, inline validation (sum of weights = 1.0, range checks), before-after diff view | **Effort**: medium (3d) | **Depends on**: T003, T006
- [ ] T056 [US3] Implement config page at `apps/trader/src/pages/config.vue` integrating ConfigForm, mutation submission, error display, cache invalidation on success | **Effort**: small (1d) | **Depends on**: T055, T042, T046
- [ ] T057 [US3] Add TypeScript types for config API in `apps/trader/src/types/trader.ts`: `ConfigSnapshot`, `ConfigMutation`, `ValidationError`, `ConfigAuditEntry` | **Effort**: small (1d) | **Depends on**: T041
- [ ] T058 [P] [US3] Create DiffViewer component at `apps/trader/src/components/config/DiffViewer.vue` to display before-after config changes (highlighted additions/removals) | **Effort**: small (1d) | **Depends on**: T003

### Audit Logging (Priority: P3)

- [ ] T059 [P] [US3] Create AuditLog component at `apps/trader/src/components/config/AuditLog.vue` displaying timestamp, operator, change description, sortable by field | **Effort**: small (1d) | **Depends on**: T003
- [ ] T060 [US3] Implement audit log page at `apps/trader/src/pages/audit-log.vue` with AuditLog component, pagination, filters (operator, timestamp range) | **Effort**: small (1d) | **Depends on**: T059, T004, T005
- [ ] T061 [P] [US3] Create toast notification component at `apps/trader/src/components/shared/Toast.vue` for mutation success/failure feedback (auto-dismiss 5s) | **Effort**: small (1d) | **Depends on**: T003

### P3 Testing & Validation

- [ ] T062 [P] [US3] Add unit tests for ConfigForm validation in `apps/trader/src/components/__tests__/ConfigForm.validation.spec.ts` (weight sum, range, format) | **Effort**: small (1d) | **Depends on**: T055
- [ ] T063 [P] [US3] Add integration tests for config mutation in `apps/trader/src/pages/__tests__/config.integration.spec.ts` with backend validation and audit log verification | **Effort**: medium (2d) | **Depends on**: T056, T057
- [ ] T064 [P] [US3] Add correlation matrix rendering tests in `apps/trader/src/components/__tests__/CorrelationMatrix.spec.ts` | **Effort**: small (1d) | **Depends on**: T051
- [ ] T065 [US3] Validate P3 gate: correlation matrix renders correctly with ≥30 trades, config form enforces all constraints, mutations persist + audit logged, audit UI displays all changes with operator/timestamp, no P1/P2 regressions | **Effort**: small (1d) | **Depends on**: T063, T064

**P3 Subtotal**: 12 tasks

---

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T066 [P] Update comprehensive API integration guide in `apps/trader/docs/API_INTEGRATION.md` with all endpoints, request/response shapes, error codes, polling intervals | **Effort**: small (1d) | **Depends on**: T026, T041, T057
- [ ] T067 [P] Update deployment runbook in `apps/trader/docs/DEPLOYMENT.md` with environment variables, build commands, release checklist, rollback procedure | **Effort**: small (1d)
- [ ] T068 [P] Validate bundle size <500 KB gzipped using `pnpm build` and webpack-bundle-analyzer | **Effort**: small (1d) | **Depends on**: T031, T050, T065
- [ ] T069 Run full validation command: `pnpm --filter trader lint && pnpm --filter trader test && pnpm --filter trader build` and capture results | **Effort**: small (1d) | **Depends on**: T068
- [ ] T070 Final smoke test: Load app, verify dashboard <2s, toggle watchlist filters, launch backtest, view positions, trigger kill-switch, adjust config, check audit log | **Effort**: small (1d) | **Depends on**: T069

**Final Subtotal**: 5 tasks

---

## Execution Summary

| Phase | Tasks | Effort | Notes |
|-------|-------|--------|-------|
| **Setup** | T001–T006 | 6 days | Foundation; blocks all work |
| **P1 Implementation** | T007–T026 | 21 days | User Story 1 dashboard + watchlist + backtest + signals |
| **P1 Testing** | T027–T032 | 5 days | Unit/component tests, validation gate, docs |
| **P2 Implementation** | T033–T046 | 11 days | Positions, trades, kill-switch, auth, error handling |
| **P2 Testing** | T047–T050 | 4 days | Integration tests, auth flow, error scenarios, validation gate |
| **P3 Implementation** | T051–T061 | 12 days | Correlation, config mutations, audit logging |
| **P3 Testing** | T062–T065 | 4 days | Form validation, mutation integration, correlation rendering, validation gate |
| **Polish** | T066–T070 | 5 days | Docs, bundle size check, final smoke test |
| **TOTAL** | 70 tasks | **~41 days** | Includes buffer & iteration |

---

## Dependencies & Parallel Execution

**Critical Path**: T001 → T002 → T004 → T005 → T009 → T015 → (P1 testing) → T036 → T042 → (P2 testing) → T056 → (P3 testing)

**Parallel Opportunities**:
- T003, T006, T010, T024, T025 can start immediately after T001
- T007, T008, T012, T013, T016, T017, T021, T022 can run in parallel once T003 is ready
- T027–T032 can start once respective components are complete
- T033–T041 can run independently after T036 foundation
- T051–T061 can run independently after T056 foundation

**Estimated Wall-Clock Time**: ~6 weeks (3–4 developers in parallel, sequential phases with parallel work within each phase)

---

## Notes for Development Team

- Each task includes file path for implementation location
- [P] indicates tasks that can run in parallel with minimal merge conflicts
- Update this file as tasks complete; mark with `[x]` and add notes if scope changes
- If a task takes >3 days, split it into subtasks
- Report blockers on backend API availability in the GitHub issue/PR thread
- Leverage mocked API responses (via Storybook or MSW) to unblock P1 frontend work if backend is incomplete

---

## Constitution Gates

Verify before marking complete:

- [ ] Modular boundaries: Each component is independently testable and wraps only UI/UX concerns
- [ ] Validated contracts: `useTraderApi` handles all API errors; forms validate inputs against backend schema
- [ ] Data integrity: Polling and cache invalidation prevent stale state; mutations are idempotent
- [ ] Quality gates: ESLint zero warnings, TypeScript strict mode, ≥70% test coverage for composables, ≥50% for components
- [ ] Observability: All API calls logged; errors include context (URL, status, user action)
- [ ] Spec compliance: All acceptance criteria from spec.md verified; user stories independently testable
