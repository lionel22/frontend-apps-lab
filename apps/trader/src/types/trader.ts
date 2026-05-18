export type TradingMode = 'backtest' | 'paper' | 'live';

export interface PagedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface StatusSnapshot {
  marketScope: 'spot';
  tradingMode: TradingMode;
  capabilities: {
    hasValidBacktests: boolean;
    hasPaperTradingEvidence: boolean;
    goLiveEligible: boolean;
  };
  watchlistSize: number;
  holdingsCount: number;
  killSwitchActive: boolean;
  timestamp: string;
}

export interface WatchlistAsset {
  id: string;
  symbol: string;
  marketScope: string;
  rankScore: number;
  sectorBucket: string | null;
  liquidityTier: string;
  filterResults: Record<string, unknown>;
  scoringMetadata: Record<string, unknown>;
  updatedAt: string;
  createdAt: string;
}

export interface SignalView {
  symbol: string;
  timeframe: string;
  compositeScore: number;
  confidence: number;
  contributions: Record<string, number>;
  missingRequiredSignals: string[];
  staleSignals: string[];
  timestamp: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  isOpen: boolean;
  openedAt: string;
  updatedAt: string;
  leverage: number;
  riskPct: number;
}

export interface Trade {
  id: string;
  orderExecutionId: string;
  positionId: string | null;
  symbol: string;
  marketScope: string;
  side: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  fees: number;
  funding: number;
  realizedPnl: number;
  openedAt: string;
  closedAt: string;
  createdAt: string;
  signalSnapshot?: Record<string, unknown>;
  regimeContext?: string;
}

export interface BacktestRunSummary {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  marketScope: string;
  params: {
    symbols: string[];
    days?: number;
    timeframe?: '4h' | '1d' | string;
    profileName?: string;
    startDate?: string | null;
    endDate?: string | null;
    marketScope?: 'spot' | string;
  };
  metrics: Record<string, number>;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface BacktestEquityPoint {
  ts: string;
  value: number;
}

export interface BacktestTradeLog {
  symbol: string;
  side: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  fees: number;
  funding: number;
  openedAt?: string;
  closedAt?: string;
}

export interface BacktestRunDetail extends BacktestRunSummary {
  equityCurve: BacktestEquityPoint[];
  trades: BacktestTradeLog[];
}

export interface BacktestLaunchPayload {
  symbols: string[];
  days?: number;
  timeframe?: '4h' | '1d';
  startDate?: string;
  endDate?: string;
  marketScope?: 'spot';
  profileName?: string;
}

export interface WeightProfile {
  id: string;
  marketScope: string;
  version: number;
  isActive: boolean;
  weights: Record<string, number>;
  thresholds: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface WeightProfileUpdatePayload {
  actor: string;
  reason?: string;
  weights: Record<string, number>;
  thresholds: Record<string, number>;
}

export interface ControlActionPayload {
  actor: string;
  reason: string;
}

export interface AuditLogEntry {
  id: string;
  type: string;
  severity: string;
  message: string;
  actor: string | null;
  reason: string | null;
  timestamp: string;
}

export type AuditLogResponse = PagedResponse<AuditLogEntry>;

export interface SignalCorrelationSummaryItem {
  signal: string;
  correlation: number;
  variance: number;
  trend: 'up' | 'down' | 'flat';
  sampleSize: number;
  degraded: boolean;
}

export interface SignalCorrelationWindow {
  periodStart: string;
  periodEnd: string;
  sampleSize: number;
  rows: SignalCorrelationSummaryItem[];
}

export interface SignalCorrelationResponse {
  state: 'ready' | 'empty' | 'low-sample';
  sampleSize: number;
  minSamples: number;
  generatedAt: string | null;
  summary: SignalCorrelationSummaryItem[];
  windows: SignalCorrelationWindow[];
  message?: string;
}

export interface TraderFilters {
  watchlistSector: string | null;
  watchlistLiquidityTier: string | null;
  tradesOffset: number;
  tradesLimit: number;
  auditOffset: number;
  auditLimit: number;
}

export type TraderResourceKey =
  | 'status'
  | 'watchlist'
  | 'signals'
  | 'positions'
  | 'trades'
  | 'backtests'
  | 'backtestDetail'
  | 'config'
  | 'correlation'
  | 'auditLog';
