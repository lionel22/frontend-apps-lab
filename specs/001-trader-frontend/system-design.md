# System Design: Trader Frontend

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Tasks**: [tasks.md](tasks.md)

---

## Overview

The Trader Frontend is a Nuxt 3 + Vue 3 SPA that provides real-time operator dashboards, trading controls, backtest management, and signal analytics for the Breexio trader platform backend.

Release 001 includes `P1 + P2 + P3` in one release. The frontend is therefore designed around the current trader backend contracts plus three additive contracts that must be closed before release exit: backtest history, signal correlation, and audit-log read access.

### Design Principles

1. **API-first**: All backend integration is wrapped behind a typed adapter layer and `useTraderApi` composable so route, DTO, and numeric-normalization changes stay out of components.
2. **Real-time polling**: Configurable polling intervals (5s for positions, 10s for trades, 30s for dashboard) to keep operator state fresh.
3. **Graceful degradation**: Partial API failures don't crash the UI; components show warnings instead.
4. **Guard-aware UX**: All protected flows treat `401`, `403`, `422`, and `429` as first-class outcomes because backend trader routes are guarded by `CombinedAuth` and rate limiting.
5. **Audit-first**: All mutations (kill-switch, config changes) flow toward an explicit backend audit trail projection.
6. **Responsive but not mobile**: Desktop-first operator workstation (laptop/monitor), no mobile support in Release 001.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Pages (Nuxt Routes)                     │
│  /index  /watchlist  /backtest  /positions  /trades          │
│  /signals  /correlation  /config  /audit-log                 │
└────────────────────────────────────────────────────────────▲─┘
                                                              │
┌─────────────────────────────────────────────────────────────┴─┐
│                      Components (Vue 3)                        │
│  StatusCards  WatchlistTable  BacktestList  PositionsTable    │
│  SignalHeatmap  ApiErrorAlert  KillSwitchButton              │
└────────────────────────────────────────────────────────────▲──┘
                                                              │
┌─────────────────────────────────────────────────────────────┴──┐
│                   Composables & Hooks (Logic)                  │
│  useTraderApi  usePolling  useCacheInvalidation  usePermissions│
│  useLocalStorage  usePagination                                │
└────────────────────────────────────────────────────────────▲───┘
                                                              │
┌─────────────────────────────────────────────────────────────┴───┐
│                    Pinia Stores (State)                        │
│  trader (watchlist, positions, trades, signals, config)        │
│  ui (modals, alerts, filters, selected rows)                   │
│  cache (lastFetchTime per resource, invalidation)              │
└────────────────────────────────────────────────────────────▲────┘
                                                              │
┌─────────────────────────────────────────────────────────────┴────┐
│              Utils & Services (Domain Logic)                     │
│  api-client.ts (HTTP wrapper)  formatters.ts  validators.ts     │
│  constants.ts (endpoints, intervals)  types.ts (DTOs)           │
└────────────────────────────────────────────────────────────▲─────┘
                                                              │
┌─────────────────────────────────────────────────────────────┴─────┐
│                  Backend NestJS APIs                             │
│  /api/v1/status  /api/v1/watchlist  /api/v1/signals              │
│  /api/v1/positions  /api/v1/trades  /api/v1/backtest             │
│  /api/v1/config  /api/v1/control  /api/v1/audit-log (planned)    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy & Data Flow

### Dashboard Flow

```
Dashboard Page (pages/index.vue)
├── StatusCards (display: trading mode, kill-switch, watchlist count)
│   └── useTraderApi → GET /api/v1/status
├── SignalHeatmap (display: signal grid, real-time)
│   └── usePolling → GET /api/v1/signals (every 30s)
└── WatchlistSummary (display: asset count by sector)
  └── useTraderApi → GET /api/v1/watchlist
```

### Positions Flow

```
Positions Page (pages/positions.vue)
├── PositionsTable (display: real-time P&L, updated every 5s)
│   ├── usePolling → GET /api/v1/positions (every 5s)
│   └── emit: kill-switch button
├── KillSwitchButton
│   ├── confirm dialog
│   └── useTraderApi → POST /api/v1/control/kill-switch (kill-switch mutation)
└── RiskIndicator (display: total portfolio risk %)
    └── computed from PositionsTable data
```

### Backtest Flow

```
Backtest Index Page (pages/backtest/index.vue)
├── BacktestList (display: history)
│   └── usePolling → GET /api/v1/backtest (planned Release 001 contract)
├── BacktestLaunchModal (input: parameters)
│   └── useTraderApi → POST /api/v1/backtest/launch (launch mutation)
└── Router: click row → /backtest/results-[id]

Backtest Results Page (pages/backtest/results-[id].vue)
├── ResultsChart (display: equity curve)
│   └── useTraderApi → GET /api/v1/backtest/:runId
├── TradesTable (display: paginated closed trades)
│   └── computed from backtest results
└── MetricsPanel (display: Sharpe, MaxDD, ProfitFactor, Calmar)
    └── computed from backtest results

### Configuration And Audit Flow

```
Config Page (pages/config.vue)
├── ConfigForm (display: weights, thresholds, actor, reason)
│   ├── useTraderApi → GET /api/v1/config
│   └── useTraderApi → PUT /api/v1/config/weights
├── DiffViewer (display: before/after changes)
└── AuditLog link
  └── Route to /audit-log

Audit Log Page (pages/audit-log.vue)
└── AuditLogTable
  └── useTraderApi → GET /api/v1/audit-log (planned Release 001 contract)
```

### Correlation Flow

```
Correlation Page (pages/correlation.vue)
├── CorrelationMatrix
├── SignalTrendChart
└── SignalDetail
  └── useTraderApi → GET /api/v1/signals/correlation (planned Release 001 contract)
```
```

---

## State Management (Pinia)

### `trader.ts` store

```typescript
state() {
  watchlist: WatchlistAsset[]      // from GET /api/v1/watchlist
  positions: Position[]            // from GET /api/v1/positions (real-time, 5s)
  trades: Trade[]                  // from GET /api/v1/trades (offset/limit, target envelope)
  signals: SignalData[]            // from GET /api/v1/signals (real-time, 30s)
  config: WeightProfile | null     // from GET /api/v1/config
  status: StatusSnapshot           // from GET /api/v1/status
  backtestList: BacktestRunSummary[]  // from GET /api/v1/backtest (planned)
  backtestResult: BacktestRunDetail | null   // from GET /api/v1/backtest/:runId
  correlation: SignalCorrelationReport | null // from GET /api/v1/signals/correlation (planned)
  auditLog: AuditEntry[]           // from GET /api/v1/audit-log (planned)
}

getters:
  openPositionCount()              // length of positions
  totalPortfolioRisk()             // sum of position risk %
  signalStrength(symbol)           // composite signal score for symbol

actions:
  async fetchWatchlist()           // GET /api/v1/watchlist, update state
  async fetchPositions()           // GET /api/v1/positions, update state
  async fetchTrades()              // GET /api/v1/trades, update state
  async fetchSignals()             // GET /api/v1/signals, update state
  async fetchConfig()              // GET /api/v1/config, update state
  async fetchStatus()              // GET /api/v1/status, update state
  async fetchBacktestList()        // GET /api/v1/backtest (planned), update state
  async fetchBacktestResult(id)    // GET /api/v1/backtest/:runId, update state
  async fetchCorrelation()         // GET /api/v1/signals/correlation (planned)
  async fetchAuditLog()            // GET /api/v1/audit-log (planned)
  async launchBacktest(params)     // POST /api/v1/backtest/launch, trigger refetch
  async executeKillSwitch()        // POST /api/v1/control/kill-switch, invalidate cache
  async resumeTrading()            // POST /api/v1/control/resume, invalidate cache
  async updateConfig(newConfig)    // PUT /api/v1/config/weights, update state + audit log
```

### `ui.ts` store

```typescript
state() {
  modals: {
    backtestLaunch: boolean
    confirmKillSwitch: boolean
  }
  alerts: Alert[]                  // queue of alerts (errors, successes)
  filters: {
    watchlist: { sector?: string, liquidityTier?: string }
    trades: { dateRange?: [start, end] }
  }
  selectedRows: {
    trades: Trade | null
    backtest: Backtest | null
  }
}

actions:
  openModal(name)
  closeModal(name)
  addAlert(alert)                  // { type: 'error'|'success', message, duration }
  removeAlert(id)
  updateFilter(filterName, value)
  selectRow(table, row)
```

### `cache.ts` store

```typescript
state() {
  resources: {
    [resourceName]: { lastFetchTime: number }  // e.g., 'watchlist', 'positions'
  }
}

actions:
  touch(resourceName)              // update lastFetchTime to now
  invalidate(resourceName)         // clear lastFetchTime
  isStale(resourceName, maxAge)    // return true if lastFetchTime > maxAge
  invalidatePattern(pattern)       // invalidate all matching resources (e.g., 'backtest/*')
```

---

## Composables & Hooks

### `useTraderApi.ts`

```typescript
interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
  refetch: () => Promise<void>
}

// Example usage:
const { data: positions, error, loading, refetch } = useTraderApi(
  '/api/v1/positions',
  { method: 'GET' }
)

// On 401:
// 1. Mark the protected session as expired or missing
// 2. Hand off to the environment-specific auth bootstrap flow
// 3. Do not assume dedicated /auth/login or /auth/refresh routes exist in the trader backend

// On 422:
// 1. Return structured validation details to forms
// 2. Preserve field-level errors for config and control actions

// On 429:
// 1. Surface a rate-limited state
// 2. Let polling/backoff logic slow down protected refreshes

// On 5xx or network error:
// 1. Dispatch error alert to ui store
// 2. Return error in response
```

### `usePolling.ts`

```typescript
interface UsePollingOptions {
  interval: number          // ms between polls (default: 30000)
  immediate?: boolean       // fetch on mount (default: true)
  paused?: Ref<boolean>     // reactive pause state
  onError?: (err) => void   // error callback
}

// Example usage:
const { data, error, loading, pause, resume } = usePolling(
  () => useTraderApi('/positions', { method: 'GET' }).data,
  { interval: 5000 }
)

// Auto-pauses when tab visibility changes (composable: useVisibilityChange)
// Auto-cleans up on component unmount
```

### `useCacheInvalidation.ts`

```typescript
// Example usage:
const { invalidate, isStale } = useCacheInvalidation()

// After kill-switch mutation:
await useTraderApi('/api/v1/control/kill-switch', { method: 'POST' })
invalidate('status')        // force refetch on next GET /api/v1/status
invalidate('positions')     // force refetch positions
```

### `usePermissions.ts`

```typescript
// Example usage:
const { can } = usePermissions()

// Returns true if operator has permission
if (can('execute_kill_switch')) {
  // show kill-switch button
}

// Future (P4): RBAC with role-based access control
```

### `usePagination.ts`

```typescript
interface UsePaginationOptions {
  itemsPerPage: number      // default: 50
}

// Example usage:
const { currentPage, pageItems, totalPages, next, prev } = usePagination(
  trades,
  { itemsPerPage: 50 }
)
```

---

## API Contract & Error Handling

### Endpoint Mapping

| Feature | Method | Endpoint | Response |
|---------|--------|----------|----------|
| Dashboard Status | GET | `/api/v1/status` | `SpotStatusDto` |
| Watchlist | GET | `/api/v1/watchlist` | `WatchlistAsset[]` |
| Signals | GET | `/api/v1/signals` | `SignalView[]` |
| Signal Detail | GET | `/api/v1/signals/:symbol` | `SignalView` |
| Positions | GET | `/api/v1/positions` | `Position[]` |
| Trades | GET | `/api/v1/trades?offset=0&limit=50` | `Trade[]` currently, target Release 001 contract is `{ items, total, offset, limit }` |
| Config | GET | `/api/v1/config` | `WeightProfile | null` |
| Update Config | PUT | `/api/v1/config/weights` | `WeightProfile` |
| Backtest List | GET | `/api/v1/backtest` | planned `BacktestRunListResponse` |
| Backtest Results | GET | `/api/v1/backtest/:runId` | `BacktestRun | null` |
| Launch Backtest | POST | `/api/v1/backtest/launch` | `{ runId: string }` |
| Kill-Switch | POST | `/api/v1/control/kill-switch` | `{ ok: true }` |
| Resume | POST | `/api/v1/control/resume` | `{ ok: true }` |
| Correlation | GET | `/api/v1/signals/correlation` | planned `SignalCorrelationResponse` |
| Audit Log | GET | `/api/v1/audit-log?offset=0&limit=100` | planned `AuditLogResponse` |

Auth note:

- The current trader backend does not expose dedicated `/api/v1/auth/login` or `/api/v1/auth/refresh` routes.
- Release 001 therefore treats auth/session bootstrap as an environment-specific concern behind a frontend session abstraction.

### Error Handling Strategy

```
API Error
├── 401 Unauthorized
│   ├── Mark session invalid or expired
│   ├── Redirect to the configured auth entrypoint or protected-session handoff
│   └── Preserve current route for return navigation when the environment supports it
│
├── 403 Forbidden
│   └── Dispatch alert: "Permission denied"; hide action button
│
├── 422 Unprocessable Entity
│   └── Map validation errors to inline form fields; keep the current form state intact
│
├── 429 Too Many Requests
│   └── Dispatch rate-limit warning; apply adaptive polling backoff; avoid repeated action retries
│
├── 4xx (other)
│   └── Dispatch alert: "Invalid request: [error message]"; log to console
│
├── 5xx Server Error
│   └── Dispatch alert: "Server error; please try again"; add retry button
│
└── Network Error (timeout, CORS, etc.)
    └── Dispatch alert: "Network error; check connection"; add retry button
```

---

## Real-time Updates & Polling Strategy

### Polling Intervals

| View | Resource | Interval | Rationale |
|------|----------|----------|-----------|
| Dashboard | `/api/v1/status` | 30s | Capability and kill-switch state changes less frequently |
| Dashboard | `/api/v1/signals` | 30s | Signals are aggregated server-side |
| Watchlist | `/api/v1/watchlist` | 30s | Watchlist eligibility and ranking change less frequently than positions |
| Positions | `/api/v1/positions` | 5s | Real-time P&L and open risk are operator-critical |
| Trades | `/api/v1/trades` | 10s | Closed-trade history changes less frequently than positions |
| Backtest List | `/api/v1/backtest` | 30s | Planned history endpoint; status changes while runs complete |
| Backtest Results | `/backtest/[id]` | static | Results don't change after backtest completes |

### Polling Adaptive Backoff

If backend returns `429 Too Many Requests`:
1. Add 50% to current polling interval
2. Log warning: "Polling interval increased to X ms"
3. On successful request, slowly decrease back to normal (reduce by 10% each successful poll)

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|------------|
| Initial Page Load | < 2s (3G) | Chrome DevTools throttling |
| Bundle Size | < 500 KB gzipped | `pnpm build` output |
| Polling Render Time | < 200ms | Vue DevTools Profiler |
| API Request Latency | < 1s p95 | Backend API response time |
| Kill-Switch Execution | < 2s | Time from click to success toast |
| Position Table Re-render | < 100ms | Only changed rows updated |

---

## Caching Strategy

### Cache Invalidation Rules

```
After Mutation                    Invalidate Resources
────────────────────────────────────────────────────
POST /api/v1/backtest/launch     → /api/v1/backtest, /api/v1/backtest/:runId
POST /api/v1/control/kill-switch → /api/v1/status, /api/v1/positions
POST /api/v1/control/resume      → /api/v1/status, /api/v1/positions
PUT /api/v1/config/weights       → /api/v1/config, /api/v1/signals/correlation, /api/v1/audit-log
```

### Cache Lifetime

- Dashboard status: 30s
- Positions: 5s (short due to real-time requirement)
- Trades: 10s
- Watchlist: 30s
- Config: static (only changes on explicit mutation)
- Signals: 30s

---

## Security Considerations

### Authentication

- Release 001 does not assume dedicated auth routes in the trader backend
- Protected trader APIs are guarded by `CombinedAuth` + rate limiting
- Frontend auth bootstrap must live behind `useSession` or equivalent abstraction so the app can work with reverse-proxy auth, pre-seeded bearer tokens, or a future dedicated auth API
- No frontend secret or long-lived credential should be shipped via public environment variables

### Authorization

- No fine-grained RBAC contract is exposed yet for Release 001
- `usePermissions` may exist as a UI capability helper, but backend remains the source of truth for protected actions
- Backend enforces authorization on every mutation endpoint

### Input Validation

- All form inputs validated on frontend before submission (fail-fast)
- Backend re-validates on mutation (defense-in-depth)
- No sensitive data (API keys, secrets) ever stored or transmitted by frontend

### XSS Prevention

- Vue 3 escapes all text interpolation by default (no `v-html` without sanitization)
- ESLint plugin flagged any unsafe template usage
- No `dangerouslySetInnerHTML` equivalent

---

## Testing Strategy

### Unit Tests (Composables & Utils)

- **useTraderApi**: Mock fetch; test 401 handling, retry logic, error dispatch
- **usePolling**: Mock setTimeout; test start/pause/resume, cleanup on unmount
- **Formatters**: Test with edge cases (null, large numbers, dates)
- **Validators**: Test threshold ranges, weight sum constraints

### Component Tests

- **Stateless UI** (StatusCards, DataTable, LoadingSpinner): Mock data; test prop rendering
- **Smart components** (Dashboard, PositionsTable): Mock useTraderApi and Pinia stores; test data binding and mutations

### Integration Tests

- **Dashboard → Backtest launch → Run detail**: Verify current backend-supported workflow against live or mocked API
- **Control workflows**: Verify kill-switch and resume payloads include required actor and reason values
- **Config workflow**: Verify `PUT /api/v1/config/weights` success path, `422` inline validation mapping, and audit-log refresh
- **Gap-closure workflows**: Switch correlation, audit-log, and backtest-history screens from mocks to real endpoints once backend contracts land
- **Error recovery**: Mock 401/403/422/429/5xx responses and verify alert, retry, and stale-state behavior

---

## File Structure

```
frontend-apps-lab/apps/trader/src/
├── app.vue
├── nuxt.config.ts
├── tsconfig.json
├── layouts/
│   ├── default.vue
│   └── blank.vue
├── pages/
│   ├── index.vue (dashboard)
│   ├── watchlist.vue
│   ├── backtest/
│   │   ├── index.vue
│   │   └── results-[id].vue
│   ├── positions.vue
│   ├── trades.vue
│   ├── signals.vue
│   ├── correlation.vue
│   ├── config.vue
│   ├── audit-log.vue
│   └── 404.vue
├── components/
│   ├── shared/
│   │   ├── ApiErrorAlert.vue
│   │   ├── ConfirmDialog.vue
│   │   ├── LoadingSpinner.vue
│   │   ├── Toast.vue
│   │   └── DataTable.vue
│   ├── dashboard/
│   │   ├── StatusCards.vue
│   │   ├── WatchlistSummary.vue
│   │   └── SignalHeatmap.vue
│   ├── watchlist/
│   │   ├── WatchlistTable.vue
│   │   ├── SectorFilter.vue
│   │   └── LiquidityTierFilter.vue
│   ├── backtest/
│   │   ├── BacktestList.vue
│   │   ├── BacktestLaunchModal.vue
│   │   └── ResultsChart.vue
│   ├── positions/
│   │   ├── PositionsTable.vue
│   │   ├── KillSwitchButton.vue
│   │   └── RiskIndicator.vue
│   ├── trades/
│   │   ├── TradesTable.vue
│   │   ├── TradeExpander.vue
│   │   └── TradeMetricsCard.vue
│   ├── signals/
│   │   ├── SignalContributionChart.vue
│   │   ├── SignalStalenessIndicator.vue
│   │   ├── CorrelationMatrix.vue
│   │   ├── SignalTrendChart.vue
│   │   └── SignalDetail.vue
│   └── config/
│       ├── ConfigForm.vue
│       ├── DiffViewer.vue
│       └── AuditLog.vue
├── composables/
│   ├── useTraderApi.ts
│   ├── usePolling.ts
│   ├── useCacheInvalidation.ts
│   ├── usePermissions.ts
│   ├── useSession.ts
│   ├── usePagination.ts
│   ├── useLocalStorage.ts
│   └── useVisibilityChange.ts
├── stores/
│   ├── trader.ts
│   ├── ui.ts
│   └── cache.ts
├── utils/
│   ├── api-client.ts
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
├── types/
│   ├── trader.ts
│   ├── components.ts
│   ├── stores.ts
│   └── api.ts
└── test/
    ├── composables/
    │   ├── useTraderApi.spec.ts
    │   ├── usePolling.spec.ts
    │   └── ...
    ├── components/
    │   ├── StatusCards.spec.ts
    │   ├── PositionsTable.spec.ts
    │   └── ...
    └── utils/
        ├── formatters.spec.ts
        └── validators.spec.ts
```

---

## Deployment & Environment

### Environment Variables

```env
NUXT_PUBLIC_API_URL=https://api.trader.example.com  # Backend API base URL
NUXT_PUBLIC_POLLING_INTERVAL_POSITIONS=5000         # ms
NUXT_PUBLIC_POLLING_INTERVAL_TRADES=10000           # ms
NUXT_PUBLIC_POLLING_INTERVAL_DEFAULT=30000          # ms
```

### Build & Serve

```bash
# Development
pnpm --filter @trader-frontend/trader dev

# Production build
pnpm --filter @trader-frontend/trader build

# Preview built artifact
pnpm --filter @trader-frontend/trader preview
```

---

## Future Extensions (Post-Release)

1. **WebSocket Real-Time**: Replace polling with `/trader/ws` for live position and trade feeds
2. **Multi-Operator RBAC**: Fine-grained permission system per operator role
3. **i18n**: Support multiple languages (backend provides signal names, regime labels in multiple languages)
4. **Dark Mode**: Vuetify theming with operator preference persistence
5. **Mobile Responsive**: Tablet and mobile operator support
6. **Export Data**: Download backtest results, audit logs, trade history as CSV/PDF
7. **Undo/Redo**: Config mutations reversible within 30-minute window
8. **WebGL Charting**: 3D visualization for large backtest datasets
