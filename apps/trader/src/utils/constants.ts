export const API_ENDPOINTS = {
  status: '/api/v1/status',
  watchlist: '/api/v1/watchlist',
  watchlistRebuild: '/api/v1/watchlist/rebuild',
  watchlistAssets: '/api/v1/watchlist/assets',
  watchlistAssetRemove: '/api/v1/watchlist/assets/remove',
  signals: '/api/v1/signals',
  signalDetail: (symbol: string): string => `/api/v1/signals/${symbol}`,
  signalCorrelation: '/api/v1/signals/correlation',
  positions: '/api/v1/positions',
  trades: '/api/v1/trades',
  backtests: '/api/v1/backtest',
  backtestDetail: (id: string): string => `/api/v1/backtest/${id}`,
  backtestLaunch: '/api/v1/backtest/launch',
  config: '/api/v1/config',
  configWeights: '/api/v1/config/weights',
  controlKillSwitch: '/api/v1/control/kill-switch',
  controlResume: '/api/v1/control/resume',
  auditLog: '/api/v1/audit-log',
} as const;

export const DEFAULT_PAGE_LIMITS = {
  trades: 50,
  backtests: 20,
  auditLog: 50,
} as const;

export const DEFAULT_POLLING_INTERVALS = {
  default: 30000,
  status: 30000,
  watchlist: 30000,
  signals: 30000,
  positions: 5000,
  trades: 10000,
  backtests: 30000,
} as const;

export const CACHE_MAX_AGE_MS = {
  status: 30000,
  watchlist: 30000,
  signals: 30000,
  positions: 5000,
  trades: 10000,
  backtests: 30000,
  backtestDetail: 10000,
  config: 60000,
  correlation: 60000,
  auditLog: 30000,
} as const;

export const NAV_ITEMS = [
  { title: 'Dashboard', to: '/' },
  { title: 'Status', to: '/status' },
  { title: 'Watchlist', to: '/watchlist' },
  { title: 'Signals', to: '/signals' },
  { title: 'Correlation', to: '/correlation' },
  { title: 'Backtests', to: '/backtest' },
  { title: 'Positions', to: '/positions' },
  { title: 'Trades', to: '/trades' },
  { title: 'Config', to: '/config' },
  { title: 'Audit Log', to: '/audit-log' },
] as const;
