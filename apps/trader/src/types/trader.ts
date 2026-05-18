export type TradingMode = 'backtest' | 'paper' | 'live';
export type MarketScope = 'spot' | 'isolated_margin' | 'legacy_futures';
export type SpotMarketScope = 'spot';
export type SignalTimeframe = '1h' | '4h' | '1d';
export type BacktestTimeframe = '4h' | '1d';
export type BacktestRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type PositionSide = 'LONG' | 'SHORT';
export type TradeSide = 'LONG' | 'SHORT';

export interface PagedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface StatusSnapshot {
  marketScope: MarketScope;
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
  marketScope: MarketScope;
  rankScore: number;
  sectorBucket: string | null;
  liquidityTier: string;
  selectionSource: 'auto' | 'manual';
  filterResults: Record<string, unknown>;
  scoringMetadata: Record<string, unknown>;
  updatedAt: string;
  createdAt: string;
}

export interface WatchlistRebuildResponse {
  ok: true;
  selectedCount: number;
}

export interface SignalView {
  symbol: string;
  timeframe: SignalTimeframe;
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
  side: PositionSide;
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
  marketScope: MarketScope;
  side: TradeSide;
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
  status: BacktestRunStatus;
  marketScope: MarketScope;
  params: {
    symbols: string[];
    days?: number;
    timeframe?: BacktestTimeframe;
    profileName?: string;
    startDate?: string | null;
    endDate?: string | null;
    marketScope?: MarketScope;
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
  side: TradeSide;
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
  timeframe?: BacktestTimeframe;
  startDate?: string;
  endDate?: string;
  marketScope?: SpotMarketScope;
  profileName?: string;
}

export interface WeightProfile {
  id: string;
  marketScope: MarketScope;
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
  severity: AuditSeverity;
  message: string;
  actor: string | null;
  reason: string | null;
  timestamp: string;
}

export type AuditLogResponse = PagedResponse<AuditLogEntry>;

export interface AuditLogFilters {
  actor?: string;
  type?: string;
  severity?: AuditSeverity;
  from?: string;
  to?: string;
}

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
