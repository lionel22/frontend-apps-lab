# Feature Specification: Trader Frontend

**Feature Branch**: `[001-trader-frontend]`  
**Created**: 2026-05-17  
**Status**: Draft  
**Input**: Operator requirement - "Build the primary frontend UI for the trader platform using Nuxt 3, Vue 3, TypeScript, and Vuetify to consume backend trader APIs and provide operator-facing trading dashboards, controls, and analytics."

## Objective

Build a responsive, typed operator-facing frontend application using Nuxt 3, Vue 3, TypeScript, and Vuetify that consumes the NestJS trader backend APIs across three planned capability groups within the same target release scope. Release 001 MUST include P1, P2, and P3; these labels organize delivery priority and capability grouping, not separate release commitments:

- **P1**: Dashboard and real-time status displays, watchlist visualization, backtest launch and results review
- **P2**: Live trading controls, positions and trades views, execution and risk monitoring, operator kill-switch and resume commands
- **P3**: Signal analysis, correlation dashboards, configuration mutation surfaces, and knowledge-base browsing

The frontend is the primary operator interface to the trader platform and MUST isolate backend API contracts behind a composable, testable client layer so the UI remains evolvable as the backend expands.

## User Scenarios and Testing _(mandatory)_

### User Story 1 - Operator Dashboard and Trading Insights (Priority: P1)

As an operator, I want a real-time dashboard that shows the watchlist, bot status, recent signals, and backtest results so I can understand the platform's trading state and decision quality without querying the backend database directly.

**Why this priority**: P1 provides immediate visibility into the foundation phase (watchlist, signals, readiness state) and enables data-driven backtest evaluation before execution is enabled.

**Independent Test**: Navigate to the dashboard, verify the watchlist, status indicators, and signal visualizations load and refresh without console errors, and confirm that all data matches backend truth by comparing with API responses.

**Acceptance Scenarios**:

1. **Given** a running backend trader with valid configuration, **When** the frontend loads, **Then** the dashboard renders status cards (trading mode, watchlist count, kill-switch state), watchlist assets with sector tags, and a live signal heatmap updated every polling interval without blocking UI interactivity.
2. **Given** completed backtest runs, **When** the operator views the backtest history view, **Then** the UI displays a list of backtest runs with parameters, metrics (Sharpe Ratio, Max Drawdown, Profit Factor, Calmar Ratio), equity curve chart, and trade logs in a tabbed, sortable interface.
3. **Given** the backend emits new signals, **When** the operator opens the signal view, **Then** the UI displays per-symbol signal contributions, composite score, confidence intervals, and signal staleness indicators updated on a configurable polling interval.
4. **Given** multiple watchlist categories, **When** the operator filters by sector or liquidity tier, **Then** the watchlist view re-renders only matching assets and persists the filter state in browser localStorage.

---

### User Story 2 - Operator Execution Controls and Position Monitoring (Priority: P2)

As an operator, I want a positions view, trading history, kill-switch button, and execution-status monitors so I can supervise live trading, intervene immediately when risk thresholds trigger, and audit all trades from one interface.

**Why this priority**: P2 operators must be able to stop the bot, understand open risk, and review filled trades. This requires trusted UI controls that are never stale and audit-worthy.

**Independent Test**: With the backend in paper or testnet mode, attempt to view open positions, trigger the kill-switch, and review the trade history to confirm all controls work, permissions are enforced, and state matches backend truth.

**Acceptance Scenarios**:

1. **Given** the operator has kill-switch control privilege, **When** they click the kill-switch button on the positions view, **Then** an inline confirmation dialog appears, and upon confirmation, the UI sends the kill-switch command, shows a loading state, and displays a success or error toast that persists briefly.
2. **Given** live trading is active, **When** the operator opens the positions view, **Then** the UI displays a table of open positions with symbol, size, entry price, current price, P&L (realized and unrealized), leverage, risk % of portfolio, and time-in-position without needing a page refresh.
3. **Given** completed trades exist, **When** the operator opens the trades view and sorts by recent, **Then** the UI displays a paginated list of closed trades with entry time, exit time, entry signal snapshot (key signals and score), outcome metrics (fees, funding, slippage, P&L), and a click-to-expand row that shows the full signal breakdown and regime context.
4. **Given** a risk circuit-breaker is triggered, **When** the backend sends a critical Telegram alert, **Then** a corresponding dismissible alert banner appears on the dashboard with the halt reason and prompts the operator to review the risk panel for immediate context.

---

### User Story 3 - Signal Analysis and Configuration (Priority: P3)

As an operator, I want to visualize signal quality over time, compare signal effectiveness against outcomes, and adjust weights and thresholds through a validated configuration form so I can improve the strategy without database access or code changes.

**Why this priority**: P3 unlocks data-driven tuning and knowledge extraction from past trades. It is lower priority within the same release scope because it depends on the data and controls introduced in P2.

**Independent Test**: With sufficient historical or seeded trade data, navigate the correlation dashboard, apply signal filters, and attempt to adjust a weight or threshold through the configuration form to confirm the UI enforces constraints and persists changes.

**Acceptance Scenarios**:

1. **Given** at least 30 historical closed trades, **When** the operator opens the signal-correlation view, **Then** the UI displays a correlation matrix (signals vs. trade outcome) with color-coded strength indicators, trend charts per signal, and a degradation flag summary for signals with <0.3 correlation or high variance.
2. **Given** a signal marked as degraded, **When** the operator hovers over the degradation flag, **Then** a tooltip appears with the signal name, historical correlation, trend direction, and a link to review the last N trades using that signal.
3. **Given** the operator opens the configuration form, **When** they adjust a weight, threshold, or risk parameter, **Then** the form validates the input against the backend schema (sum of weights must equal 1.0, thresholds must be numeric within defined ranges), displays validation errors inline, and shows a before-after diff before submission.
4. **Given** a valid configuration update, **When** the operator submits the form, **Then** the UI sends the mutation, persists the change, displays a success message with a timestamp, and adds a record to an audit log view showing who changed what and when.

---

## Architecture

### Layered Component and Store Architecture

The frontend is organized into composable, testable layers:

```
frontend-apps-lab/apps/trader/src/
├── layouts/
│   ├── default.vue
│   └── blank.vue
├── pages/
│   ├── index.vue (dashboard landing)
│   ├── watchlist.vue
│   ├── status.vue
│   ├── backtest/
│   │   ├── index.vue (list and launch)
│   │   └── results-[id].vue (detailed results)
│   ├── positions.vue
│   ├── trades.vue
│   ├── signals.vue (signal heatmap and details)
│   ├── correlation.vue (P3)
│   ├── config.vue (P3)
│   └── 404.vue
├── components/
│   ├── shared/
│   │   ├── ApiErrorAlert.vue (error state displays)
│   │   ├── LoadingSpinner.vue (async state UI)
│   │   └── DataTable.vue (reusable table component)
│   ├── dashboard/
│   │   ├── StatusCards.vue (trading mode, kill-switch, watchlist status)
│   │   ├── WatchlistSummary.vue (sector breakdown, liquidity tiers)
│   │   └── SignalHeatmap.vue (real-time signal grid)
│   ├── watchlist/
│   │   ├── WatchlistTable.vue (assets with filters)
│   │   ├── SectorFilter.vue
│   │   └── LiquidityTierFilter.vue
│   ├── backtest/
│   │   ├── BacktestList.vue (history, launch button)
│   │   ├── BacktestLaunchModal.vue
│   │   └── ResultsChart.vue (equity curve, metrics)
│   ├── positions/
│   │   ├── PositionsTable.vue (open positions, real-time P&L)
│   │   ├── KillSwitchButton.vue (confirmation dialog)
│   │   └── RiskIndicator.vue (% of portfolio risk)
│   ├── trades/
│   │   ├── TradesTable.vue (paginated closed trades)
│   │   ├── TradeExpander.vue (signal breakdown detail)
│   │   └── TradeMetricsCard.vue (fees, funding, slippage)
│   ├── signals/
│   │   ├── SignalContributionChart.vue (per-symbol signal score)
│   │   └── SignalStalenessIndicator.vue
│   └── config/
│       ├── ConfigForm.vue (validated weight/threshold mutations)
│       └── AuditLog.vue (change history)
├── composables/
│   ├── useTraderApi.ts (centralized API client)
│   ├── usePolling.ts (refresh logic)
│   ├── usePermissions.ts (role-based access)
│   ├── usePagination.ts (table pagination state)
│   └── useLocalStorage.ts (filter persistence)
├── stores/
│   ├── trader.ts (Pinia store for global trader state)
│   ├── ui.ts (UI state: modals, alerts, selected filters)
│   └── cache.ts (API response cache and invalidation)
├── utils/
│   ├── formatters.ts (number, date, price formatting)
│   ├── api-client.ts (HTTP client with error handling)
│   ├── validators.ts (form validation rules)
│   └── constants.ts (API endpoints, polling intervals, thresholds)
└── types/
    ├── trader.ts (API response and entity types)
    ├── components.ts (component prop interfaces)
    └── stores.ts (Pinia store state shapes)
```

### API Contract Layer

- **useTraderApi composable**: Wraps all HTTP calls to the backend. Every method returns `{ data, error, loading }`.
- **Error handling**: Network errors, 401/403 auth failures, and 5xx backend errors trigger an `ApiErrorAlert` component that persists until dismissed.
- **Polling strategy**: Each view that needs real-time data (dashboard, positions, trades) uses the `usePolling` composable with configurable intervals (default: 5s for positions, 10s for trades, 30s for backtest list).
- **Cache invalidation**: The `cache` store tracks which API resources are stale and triggers re-fetches on view mount and after mutations.

### State Management

- **Pinia stores**:
  - `trader`: Holds watchlist, positions, trades, signals, config. Loaded on app init, refreshed via polling.
  - `ui`: Modal visibility, filter selections, alert queue, selected row in tables.
  - `cache`: Timestamp of last successful fetch per resource. Invalidate aggressively after mutations.

### Real-time Updates (Post-Release Extension)

- WebSocket support: Optional connection to `/trader/ws` for live position and trade feeds to replace polling after Release 001.

---

## Constraints

### Technology

- **Framework**: Nuxt 3 with Vite, Vue 3 Composition API
- **UI Library**: Vuetify 3 (Material Design components)
- **State**: Pinia (Vuex successor)
- **HTTP**: Fetch API or axios (wrapped in useTraderApi composable)
- **TypeScript**: Strict mode, no `any` types except in legacy integration points
- **Testing**: Vitest + Vue Test Utils for unit and component tests; no dedicated E2E framework required for Release 001

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge) last 2 versions
- ES2020 JavaScript target
- No IE11 support

### Operational

- API consumption only—no backend implementation in this repo
- All environment variables (API URL, auth tokens) injected at build/runtime, not hardcoded
- Auth tokens refreshed transparently; 401 responses trigger a re-login flow
- Graceful degradation: If an optional API fails (e.g., correlation data), the page still loads but shows a muted warning instead of crashing

---

## Acceptance Criteria

### Functional

- [ ] Dashboard loads and displays status cards, watchlist summary, and signal heatmap without console errors
- [ ] Watchlist view filters by sector and liquidity tier; filters persist across sessions
- [ ] Backtest history view lists all completed backtests with parameters and metrics
- [ ] Backtest details page displays equity curve chart and detailed trade log
- [ ] Positions table shows open positions with real-time P&L, updated at least every 5 seconds
- [ ] Kill-switch button triggers confirmation dialog and sends mutation; UI confirms success/failure
- [ ] Trades table displays paginated closed trades with expandable detail rows
- [ ] Signal view shows per-symbol contributions and staleness indicators
- [ ] Configuration form validates inputs, shows before-after diff, and persists mutations
- [ ] Audit log tracks all configuration changes with timestamp and operator

### Code Quality

- [ ] All `.vue` components have typed props, emits, and computed properties
- [ ] All API calls wrapped in `useTraderApi` composable
- [ ] All Pinia stores have typed state, getters, actions
- [ ] ESLint and Prettier pass with zero warnings
- [ ] TypeScript `tsc --noEmit` passes with strict mode enabled
- [ ] Test coverage ≥ 70% for composables and utils; ≥ 50% for components
- [ ] No hardcoded strings; all UI labels in i18n (future release)

### Performance

- [ ] Initial page load: < 3s (3G) / < 1s (4G)
- [ ] Dashboard re-render on data polling: < 200ms (Vue DevTools Profiler)
- [ ] Network requests debounced: max 1 API call per 500ms per endpoint
- [ ] Bundle size: < 500KB gzipped

### Accessibility

- [ ] WCAG 2.1 AA compliance for keyboard navigation and screen readers (future release)
- [ ] Color contrast ratios ≥ 4.5:1 for text
- [ ] All interactive elements have `aria-label` or visible labels

---

## Non-Goals (Out of Scope for Release 001)

- Internationalization (i18n) beyond English
- Real-time WebSocket support (polling sufficient for Release 001)
- Mobile-first responsive design (desktop-first for operator workstation)
- Dark mode / theming (Vuetify default light theme)
- Advanced charting libraries (use lightweight alternatives or SVG)
- Multi-language signal names or regime labels

---

## Dependencies and Integrations

### Internal

- **Backend API**: NestJS trader app at `apps/trader/` (API contracts defined in OpenAPI or Swagger)
- **Shared libs** (future): Common types, formatters, and UI components in `libs/` if reused across apps

### External

- **Vuetify 3**: Material Design component library
- **Chart.js or ApexCharts**: For equity curves and signal visualizations
- **Pinia**: State management
- **@vueuse/core**: Utility composables (useLocalStorage, usePolling, etc.)
- **class-validator + class-transformer**: Backend-equivalent validation on the frontend

---

## Validation and Testing Strategy

### Unit Tests

- **Composables** (useTraderApi, usePolling, usePermissions): Mock fetch responses; test error handling, polling logic, cache invalidation
- **Utils** (formatters, validators): Test with edge cases (large numbers, dates, null values)
- **Stores** (Pinia): Test state mutations, actions, and cache lifecycle

### Component Tests

- **Stateless UI components** (StatusCards, DataTable, LoadingSpinner): Test prop rendering and user interactions
- **Smart components** (Dashboard, PositionsTable, ConfigForm): Mock API and Pinia store; test data binding and mutation flows

### Integration Tests

- **Release 001 workflows**: Mock backend API, verify dashboard → backtest launch → results display flow, plus positions/trades supervision, kill-switch, and configuration update flows
- **Error scenarios**: Mock 5xx errors, 401 auth failures, network timeouts; verify error alerts and graceful fallbacks

### Manual Testing Checklist

- [ ] Open app in dev server; dashboard loads without errors
- [ ] Verify real-time polling updates positions every 5 seconds
- [ ] Click kill-switch; confirm confirmation dialog and success feedback
- [ ] Launch backtest with test parameters; wait for results
- [ ] Review backtest results chart and trade log
- [ ] Adjust a configuration weight; verify validation and audit log entry

---

## Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Backend API contracts unstable (fields removed/renamed) | Frontend breaks on data binding | Medium | Maintain strict API versioning; use SDK codegen if available; API contract tests in backend repo |
| Real-time polling overloads backend | High CPU/DB usage if poll interval too aggressive | High | Start with 30s interval; add adaptive backoff if server responds with 429 (too many requests) |
| Operator accidentally deletes config due to missing confirmation | Data loss | Low | Require confirmation dialog + audit log all mutations; consider an undo-within-30s feature in a future release |
| Browser tab becomes stale (background for hours) | User sees outdated data on tab focus | Medium | Implement `useVisibilityChange` to refresh store on visibility change |
| Auth token expires during user session | API calls fail silently | Medium | Implement silent token refresh in API client; if refresh fails, redirect to login with return-to-page URL |

---

## Success Metrics

- [ ] Dashboard loads without errors in < 2s (3G) and displays all data types
- [ ] Backtest history and results views render correctly for ≥ 20 historical runs
- [ ] Positions table updates every 5s with zero visual lag or console errors
- [ ] Kill-switch command executes and confirms state change within 2s
- [ ] All acceptance criteria met and integration tests passing

