# Implementation Plan: Trader Frontend

**Branch**: `feat/001-trader-frontend` | **Date**: 2026-05-17 | **Spec**: [spec.md](spec.md)

---

## Summary

This plan delivers the Trader Frontend UI in three independently validatable phases aligned to backend trading phases.

**P1 — Dashboard, Watchlist & Backtest Foundation (Weeks 1–4)**
Bootstrap Nuxt 3 scaffold, Pinia stores, API client layer (`useTraderApi` composable), dashboard view with status cards and signal heatmap, watchlist table with filtering, backtest history and results views. Reads from backend only; no mutations. Success: Dashboard loads <2s, polling stable at configurable intervals, all views render without console errors.

**P2 — Live Trading Controls, Position Monitoring & Audit (Weeks 5–7)**
Add positions view (real-time P&L updated every 5s), trades table with expandable signal detail, kill-switch button with confirmation dialog, risk indicators, error alert persistence, token refresh flow, and audit logging for future mutations. Success: Kill-switch executes <2s, positions refresh every 5s without lag, all state mutations logged, 401/5xx errors handled gracefully.

**P3 — Signal Intelligence & Configuration Mutations (Weeks 8–10)**
Add signal-correlation view with matrix and trend charts, configuration form with validation (sum-of-weights, range checks), before-after diff display, mutation submission, and audit log UI. Success: Correlation matrix renders correctly, config form enforces all constraints, all mutations persisted and logged, ≥30 historical trades available for correlation analysis.

**Go-Live Gates**: P1→P2 requires backend `/dashboard`, `/watchlist`, `/backtest` APIs stable and documented. P2→P3 requires `/positions`, `/trades`, and kill-switch mutation endpoints tested.

---

## Technical Context

**Framework**: Nuxt 3 with Vue 3 Composition API, TypeScript strict mode  
**UI Library**: Vuetify 3 (Material Design)  
**State Management**: Pinia  
**HTTP Client**: Fetch API (wrapped in composable)  
**Charts**: Chart.js or ApexCharts  
**Testing**: Vitest + Vue Test Utils  
**Browser Target**: Modern browsers (Chrome, Firefox, Safari, Edge) last 2 versions, ES2020  
**Deployment**: Static SPA hosted behind auth proxy (environment-specific API URLs injected at runtime)  

**Existing Scaffold State**:
- Nuxt 3 app initialized at `frontend-apps-lab/apps/trader/`
- `nuxt.config.ts` exists with basic setup
- No Pinia store, no API client, no domain components

---

## Work Blocks & Milestones

| Phase | Work Block | Description | Dependencies |
|-------|-----------|-------------|--------------|
| **P1** | 1.1 — Scaffold & API Client | Configure Pinia, set up `useTraderApi` composable, HTTP error handling, cache store, polling composable | Backend API docs stable |
| **P1** | 1.2 — Dashboard View | Status cards (trading mode, kill-switch state, watchlist count), signal heatmap, real-time polling | Backend `/dashboard`, `/status` endpoints |
| **P1** | 1.3 — Watchlist Table | Asset table with sector/liquidity filters, filter persistence, responsive layout | Backend `/watchlist` endpoint |
| **P1** | 1.4 — Backtest Views | History list with parameters/metrics, launch modal with input form, results page with equity chart & trade log, sorting/pagination | Backend `/backtest/list`, `/backtest/launch`, `/backtest/{id}` |
| **P1** | 1.5 — Signals View | Per-symbol signal contributions, composite score, staleness indicators, real-time updates | Backend `/signals` endpoint |
| **P1** | 1.6 — Testing & QA (P1) | Unit tests for composables (>70% coverage), component tests (>50% coverage), integration smoke tests, performance profiling | All P1 components complete |
| **P2** | 2.1 — Positions & Trades | Positions table (real-time P&L every 5s), trades table (paginated, expandable detail), risk indicators | Backend `/positions`, `/trades` endpoints |
| **P2** | 2.2 — Kill-Switch & Controls | Kill-switch button with confirmation, success/error toasts, disabled state management, immediate UI feedback | Backend kill-switch mutation endpoint |
| **P2** | 2.3 — Auth & Token Refresh | JWT token storage, silent refresh on 401, re-login flow with return-to-URL, token expiry handling | Backend JWT auth implemented |
| **P2** | 2.4 — Error Handling & Alerts | `ApiErrorAlert` component (persistent, dismissible), network error retry logic, 5xx fallback UX, log all errors to console | All P2 API integrations complete |
| **P2** | 2.5 — Testing & QA (P2) | Integration tests for mutations (kill-switch, auth), error scenarios (401/5xx/timeout), real-time polling under load | All P2 features complete |
| **P3** | 3.1 — Signal Correlation | Correlation matrix (signals vs. trade outcome), trend charts, degradation flags, hover tooltips, signal filter UI | Backend `/signals/correlation` endpoint, ≥30 historical trades |
| **P3** | 3.2 — Configuration Mutations | Config form (weight/threshold inputs), schema validation, before-after diff view, mutation submission, error display | Backend `/config` mutation endpoint, schema endpoint |
| **P3** | 3.3 — Audit Log UI | Audit log view (who/what/when table), sortable by timestamp/operator, view-only until archival policy defined | Backend `/audit-log` endpoint |
| **P3** | 3.4 — Testing & QA (P3) | Form validation tests, mutation state consistency, audit log completeness, correlation data accuracy | All P3 features complete |

---

## Dependencies Matrix

| Blocker | Dependent Work Blocks | Backend Requirement | Status | Mitigation |
|---------|------------------------|-------------------|--------|-----------|
| Backend API contracts stable | P1.1–P1.6 | OpenAPI/Swagger docs + endpoint responses | TBD | Mock API responses for P1 frontend dev in parallel |
| `/dashboard`, `/status` endpoints | P1.2 | Trading mode, watchlist count, kill-switch state, signal snapshot | TBD | Use Storybook to prototype dashboard UI with fixtures |
| `/backtest/{id}` endpoint | P1.4 | Full trade log + equity curve data in response | TBD | Chunk P1.4 into history (dep on `/backtest/list`) + results (dep on `/backtest/{id}` later) |
| Kill-switch mutation endpoint | P2.2 | Accepts auth + returns success/error within 2s | TBD | QA against staging environment, manual test in paper trading |
| `/signals/correlation` endpoint | P3.1 | Returns correlation matrix + trend data, requires ≥30 trades | TBD | Add backend flag to enable/disable correlation; P3 not blocking live trading |
| `/config` mutation endpoint + schema | P3.2 | Validates request body against schema; returns updated config + audit entry | TBD | Use JSON Schema validation library on frontend as fallback |

---

## Effort Estimation

| Work Block | Size | Effort (days) | Assignee Assumption |
|-----------|------|---------|-----------------|
| 1.1 — Scaffold & API Client | Small | 2 | 1 FE developer |
| 1.2 — Dashboard View | Medium | 3 | 1 FE developer |
| 1.3 — Watchlist Table | Small | 2 | 1 FE developer |
| 1.4 — Backtest Views | Medium | 4 | 1–2 FE developers (chart integration is iterative) |
| 1.5 — Signals View | Small | 2 | 1 FE developer |
| 1.6 — Testing & QA (P1) | Medium | 3 | 1 QA + 1 FE developer |
| **P1 Total** | — | **16 days** | — |
| 2.1 — Positions & Trades | Medium | 3 | 1 FE developer |
| 2.2 — Kill-Switch & Controls | Small | 2 | 1 FE developer |
| 2.3 — Auth & Token Refresh | Small | 2 | 1 FE developer |
| 2.4 — Error Handling & Alerts | Medium | 3 | 1 FE developer |
| 2.5 — Testing & QA (P2) | Medium | 3 | 1 QA + 1 FE developer |
| **P2 Total** | — | **13 days** | — |
| 3.1 — Signal Correlation | Medium | 3 | 1 FE developer |
| 3.2 — Configuration Mutations | Medium | 4 | 1–2 FE developers |
| 3.3 — Audit Log UI | Small | 2 | 1 FE developer |
| 3.4 — Testing & QA (P3) | Medium | 3 | 1 QA + 1 FE developer |
| **P3 Total** | — | **12 days** | — |
| **Grand Total** | — | **~41 days** (includes buffer, iteration, and rework) | — |

---

## Validation Checkpoints

### P1 Validation Gate

**Before moving to P2, all of the following must pass:**

- [ ] Dashboard page loads in < 2 seconds (3G throttle in DevTools)
- [ ] Watchlist renders and filters work; filter state persists across page refresh
- [ ] Backtest history displays ≥ 20 completed runs with correct parameters and metrics
- [ ] Backtest results page displays equity curve and trade log without truncation
- [ ] Signal view updates every polling interval without UI lag or console errors
- [ ] All API calls wrapped in `useTraderApi`; error cases trigger `ApiErrorAlert`
- [ ] TypeScript strict mode passes; ESLint zero warnings; Prettier formatted
- [ ] Unit tests for composables: ≥ 70% coverage
- [ ] Component tests: ≥ 50% coverage
- [ ] No hardcoded API URLs; all environment variables injected
- [ ] Bundle size < 500 KB gzipped

### P2 Validation Gate

**Before moving to P3, all of the following must pass:**

- [ ] Positions table updates every 5 seconds with zero visual lag
- [ ] Trades table renders paginated, closed trades; expander shows full signal detail
- [ ] Kill-switch button: confirmation dialog appears, mutation sends within 2s, success/error toast persists
- [ ] Token refresh: 401 response triggers silent refresh; if refresh fails, redirect to login with return-to-URL
- [ ] API errors (5xx, network timeout): `ApiErrorAlert` displays; user can retry or dismiss
- [ ] Integration tests for mutations pass in staging environment
- [ ] All P1 acceptance criteria still met; no regressions
- [ ] Manual smoke test passed: open app, verify real-time updates, execute kill-switch, restart, confirm state restored

### P3 Validation Gate

**Before marking complete, all of the following must pass:**

- [ ] Signal-correlation view: correlation matrix renders with color coding, trend charts visible
- [ ] Configuration form: validates weight sum ≠ 1.0 with inline error; enforces threshold ranges; shows before-after diff
- [ ] Configuration mutation: POST succeeds, UI reflects change, audit log entry created
- [ ] Audit log view: displays all mutations with timestamp, operator, change description; sortable by timestamp
- [ ] ≥ 30 historical trades available in the test environment for correlation analysis
- [ ] All P1 + P2 acceptance criteria still met; no regressions
- [ ] Manual smoke test: adjust a weight, confirm mutation persists, navigate back and forth, verify state unchanged

---

## Assumptions

1. **Backend API contracts are stable** by the time P1 frontend dev starts; if not, mocked API responses allow parallel development.
2. **Single operator deployment**: Auth is single-user JWT (future: multi-operator RBAC in P4).
3. **Polling is sufficient for P1 + P2**: WebSocket support deferred to P3+.
4. **No i18n in P1**: All UI labels in English.
5. **Desktop-first UX**: No mobile-responsive breakpoints in P1; laptop/desktop operator workstation assumed.
6. **Vuetify theme defaults**: No custom dark mode or theming in P1.
7. **Backend will provide audit trail**: Frontend receives audit log via API; no client-side audit log generation.
8. **Exchange API keys stored on backend only**: Frontend never handles secrets.

---

## Key Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Backend API contracts change mid-P1 | Frontend breaks on data binding; rework components | Medium | Enforce API versioning in backend; use SDK codegen or OpenAPI-generated client types if available; parallel mock API for frontend-first dev |
| Polling interval too aggressive | Backend CPU/DB overloaded; 429 rate-limit responses | High | Start with 30s interval (conservative); add adaptive backoff logic in `usePolling` if 429 detected; monitor backend metrics during QA |
| Auth token expires during long operator session | Silent API calls fail; user logged out unexpectedly | Medium | Implement token refresh + retry logic in `useTraderApi`; test with token expiry in QA; log all auth state transitions |
| Chart rendering performance degrades with large trade logs | Backtest results page hangs with 500+ trades | Medium | Use virtual scrolling for trade table; defer chart render with lazy loading; paginate trade log (show 50/page initially) |
| Kill-switch UX confusing; operator accidentally disables trading | User error; unintended bot halt | Low | Require 2-click confirmation dialog; show current kill-switch state as large visual badge on dashboard; audit log all state changes |
| Real-time polling causes browser tab to become stale after hours in background | User sees outdated data on tab focus | Medium | Implement `useVisibilityChange` composable; trigger full store refresh when tab becomes visible again; add "data refreshed" toast |
| Cross-site scripting (XSS) via unescaped API response data | Security vulnerability; unauthorized code execution | Low | Use Vue's built-in XSS protection (template syntax, no `v-html` without sanitization); lint with ESLint security plugin |

---

## Definition of Done

- [ ] All work blocks completed and tested per acceptance criteria above
- [ ] Code reviewed and merged to `main` branch
- [ ] All three validation gates passed (P1, P2, P3)
- [ ] tasks.md generated from this plan with granular tickets for dev team
- [ ] No known regressions or critical bugs
- [ ] Performance targets met (load time, polling latency, bundle size)
- [ ] Documentation updated: README.md, API integration guide, deployment runbook
- [ ] Ready-to-deploy artifact built and versioned
