# System Design: Trader Frontend

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Tasks**: [tasks.md](tasks.md)

---

## Overview

The Trader Frontend is a Nuxt 3 + Vue 3 SPA that provides real-time operator dashboards, trading controls, backtest management, and signal analytics for the Breexio trader platform backend.

### Design Principles

1. **API-first**: All backend integration wrapped behind a typed `useTraderApi` composable. UI is independent of backend changes.
2. **Real-time polling**: Configurable polling intervals (5s for positions, 10s for trades, 30s for dashboard) to keep operator state fresh.
3. **Graceful degradation**: Partial API failures don't crash the UI; components show warnings instead.
4. **Audit-first**: All mutations (kill-switch, config changes) logged to a backend audit trail.
5. **Responsive but not mobile**: Desktop-first operator workstation (laptop/monitor), no mobile support in P1.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Pages (Nuxt Routes)                     │
│  /index  /watchlist  /backtest  /positions  /trades  /signals│
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
│  /dashboard  /watchlist  /backtest  /positions  /trades  /signals│
│  /config  /auth  /audit-log                                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy & Data Flow

### Dashboard Flow

```
Dashboard Page (pages/index.vue)
├── StatusCards (display: trading mode, kill-switch, watchlist count)
│   └── useTraderApi → GET /dashboard/status
├── SignalHeatmap (display: signal grid, real-time)
│   └── usePolling → GET /signals (every 30s)
└── WatchlistSummary (display: asset count by sector)
    └── useTraderApi → GET /watchlist
```

### Positions Flow

```
Positions Page (pages/positions.vue)
├── PositionsTable (display: real-time P&L, updated every 5s)
│   ├── usePolling → GET /positions (every 5s)
│   └── emit: kill-switch button
├── KillSwitchButton
│   ├── confirm dialog
│   └── useTraderApi → POST /trading/kill-switch (kill-switch mutation)
└── RiskIndicator (display: total portfolio risk %)
    └── computed from PositionsTable data
```

### Backtest Flow

```
Backtest Index Page (pages/backtest/index.vue)
├── BacktestList (display: history)
│   └── usePolling → GET /backtest/list (every 30s)
├── BacktestLaunchModal (input: parameters)
│   └── useTraderApi → POST /backtest/launch (launch mutation)
└── Router: click row → /backtest/results-[id]

Backtest Results Page (pages/backtest/results-[id].vue)
├── ResultsChart (display: equity curve)
│   └── useTraderApi → GET /backtest/[id]
├── TradesTable (display: paginated closed trades)
│   └── computed from backtest results
└── MetricsPanel (display: Sharpe, MaxDD, ProfitFactor, Calmar)
    └── computed from backtest results
```

---

## State Management (Pinia)

### `trader.ts` store

```typescript
state() {
  watchlist: WatchlistAsset[]      // from GET /watchlist
  positions: Position[]            // from GET /positions (real-time, 5s)
  trades: Trade[]                  // from GET /trades (paginated)
  signals: SignalData[]            // from GET /signals (real-time, 30s)
  config: Config                   // from GET /config (static until mutation)
  status: StatusSnapshot           // from GET /dashboard/status
  backtest: Backtest[]             // from GET /backtest/list (30s)
  backtestResult: BacktestResult   // from GET /backtest/[id]
}

getters:
  openPositionCount()              // length of positions
  totalPortfolioRisk()             // sum of position risk %
  signalStrength(symbol)           // composite signal score for symbol

actions:
  async fetchWatchlist()           // GET /watchlist, update state
  async fetchPositions()           // GET /positions, update state
  async fetchTrades()              // GET /trades, update state
  async fetchSignals()             // GET /signals, update state
  async fetchConfig()              // GET /config, update state
  async fetchStatus()              // GET /dashboard/status, update state
  async fetchBacktestList()        // GET /backtest/list, update state
  async fetchBacktestResult(id)    // GET /backtest/[id], update state
  async launchBacktest(params)     // POST /backtest/launch, trigger refetch
  async executeKillSwitch()        // POST /trading/kill-switch, invalidate cache
  async updateConfig(newConfig)    // POST /config, update state + audit log
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
  '/positions',
  { method: 'GET' }
)

// On 401:
// 1. Attempt silent token refresh
// 2. If successful, retry request
// 3. If refresh fails, redirect to /login with return-to URL

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
await useTraderApi('/trading/kill-switch', { method: 'POST' })
invalidate('status')        // force refetch on next GET /dashboard/status
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
| Dashboard Status | GET | `/dashboard/status` | `{ tradingMode, killSwitchState, watchlistCount }` |
| Watchlist | GET | `/watchlist` | `{ assets: Asset[] }` |
| Positions | GET | `/positions` | `{ positions: Position[] }` |
| Trades | GET | `/trades?skip=0&limit=50` | `{ trades: Trade[], total: number }` |
| Signals | GET | `/signals` | `{ signals: SignalData[] }` |
| Config | GET | `/config` | `{ weights: {}, thresholds: {} }` |
| Backtest List | GET | `/backtest/list` | `{ backtests: Backtest[] }` |
| Backtest Results | GET | `/backtest/[id]` | `{ result: BacktestResult }` |
| Launch Backtest | POST | `/backtest/launch` | `{ backtestId, status, startTime }` |
| Kill-Switch | POST | `/trading/kill-switch` | `{ state, timestamp }` |
| Update Config | POST | `/config` | `{ config: Config, auditId }` |
| Audit Log | GET | `/audit-log?skip=0&limit=100` | `{ entries: AuditEntry[], total }` |
| Auth (JWT) | POST | `/auth/login` | `{ token, expiresIn }` |
| Token Refresh | POST | `/auth/refresh` | `{ token, expiresIn }` |

### Error Handling Strategy

```
API Error
├── 401 Unauthorized
│   ├── Attempt POST /auth/refresh
│   ├── If success → retry original request
│   └── If fail → redirect to /login?returnTo=[current-path]
│
├── 403 Forbidden
│   └── Dispatch alert: "Permission denied"; hide action button
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
| Dashboard | `/dashboard/status` | 30s | Status changes less frequently |
| Dashboard | `/signals` | 30s | Signals are batch-computed |
| Watchlist | `/watchlist` | 30s | Watchlist composition changes rarely |
| Watchlist | Asset prices | 10s | Price updates relevant for monitoring |
| Positions | `/positions` | 5s | Real-time P&L crucial for operators |
| Trades | `/trades` | 10s | Trade fills happen less frequently than P&L swings |
| Backtest List | `/backtest/list` | 30s | Backtest completion not time-critical in P1 |
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
POST /backtest/launch            → /backtest/list
POST /trading/kill-switch        → /dashboard/status
POST /config                     → /config, /signals (correlation depends on config)
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

- JWT token stored in `localStorage`
- Token includes `expiresIn` (e.g., 24 hours)
- On 401, attempt silent refresh via POST `/auth/refresh`
- If refresh fails, clear token and redirect to login

### Authorization

- No RBAC in P1 (all operators have same permissions)
- P2+: Add `usePermissions` composable to check operator role before rendering sensitive actions (e.g., kill-switch)
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

- **Dashboard → Backtest → Results**: Mock backend; verify full workflow
- **Kill-Switch workflow**: Mock auth and mutation endpoints; verify state transitions
- **Error recovery**: Mock 401/5xx errors; verify alert display and recovery

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
│   ├── status.vue
│   ├── backtest/
│   │   ├── index.vue
│   │   └── results-[id].vue
│   ├── positions.vue
│   ├── trades.vue
│   ├── signals.vue
│   ├── correlation.vue (P3)
│   ├── config.vue (P3)
│   └── 404.vue
├── components/
│   ├── shared/
│   │   ├── ApiErrorAlert.vue
│   │   ├── LoadingSpinner.vue
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
│   │   └── SignalStalenessIndicator.vue
│   └── config/
│       ├── ConfigForm.vue
│       └── AuditLog.vue
├── composables/
│   ├── useTraderApi.ts
│   ├── usePolling.ts
│   ├── useCacheInvalidation.ts
│   ├── usePermissions.ts
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
NUXT_PUBLIC_AUTH_TOKEN_EXPIRY=86400                 # Token lifetime in seconds
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

## Future Extensions (P3+)

1. **WebSocket Real-Time**: Replace polling with `/trader/ws` for live position and trade feeds
2. **Multi-Operator RBAC**: Fine-grained permission system per operator role
3. **i18n**: Support multiple languages (backend provides signal names, regime labels in multiple languages)
4. **Dark Mode**: Vuetify theming with operator preference persistence
5. **Mobile Responsive**: Tablet and mobile operator support
6. **Export Data**: Download backtest results, audit logs, trade history as CSV/PDF
7. **Undo/Redo**: Config mutations reversible within 30-minute window
8. **WebGL Charting**: 3D visualization for large backtest datasets
