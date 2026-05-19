import { ref, watch, type Ref, type WatchSource } from 'vue';
import type { ApiError, ApiRequestOptions } from '~/types/api';
import type {
  AuditLogEntry,
  AuditLogFilters,
  AuditSeverity,
  AuditLogResponse,
  BacktestLaunchPayload,
  BacktestRunDetail,
  BacktestRunStatus,
  BacktestRunSummary,
  BacktestTimeframe,
  ControlActionPayload,
  FileDownload,
  MarketScope,
  PagedResponse,
  PortfolioAllocation,
  PortfolioEquityPoint,
  PortfolioMetrics,
  Position,
  PositionHealth,
  PositionHealthDimension,
  PositionSide,
  SearchResponse,
  SearchResultGroup,
  SearchResultItem,
  SignalTimeframe,
  SignalCorrelationResponse,
  SignalCorrelationSummaryItem,
  SignalCorrelationWindow,
  SignalReadiness,
  SignalReadinessAction,
  SignalReadinessDimension,
  SignalView,
  SpotHolding,
  StatusSnapshot,
  Trade,
  TradeFilters,
  TradeListQuery,
  TradeSide,
  WatchlistAsset,
  WatchlistRebuildResponse,
  WeightProfile,
  WeightProfileUpdatePayload,
} from '~/types/trader';
import { createApiClient } from '~/utils/api-client';
import { API_ENDPOINTS, DEFAULT_PAGE_LIMITS } from '~/utils/constants';
import {
  asRecord,
  asStringArray,
  parseBoolean,
  parseIsoDate,
  parseNumber,
} from '~/utils/formatters';
import { useSession } from '~/composables/useSession';
import { useUiStore } from '~/stores/ui';

interface TraderClientRequestOptions extends ApiRequestOptions {
  silent?: boolean;
}

function buildTradeQueryParams(query: Partial<TradeListQuery>) {
  return {
    offset: query.offset,
    limit: query.limit,
    symbol: query.symbol || undefined,
    side: query.side || undefined,
    search: query.search || undefined,
    closedAfter: query.closedAfter || undefined,
    closedBefore: query.closedBefore || undefined,
    sortBy: query.sortBy || undefined,
    sortDirection: query.sortDirection || undefined,
  };
}

function parseContentDispositionFileName(
  headers: Headers,
  fallback: string,
): string {
  const disposition = headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

export interface UseTraderApiOptions<T> extends TraderClientRequestOptions {
  immediate?: boolean;
  parse?: (payload: unknown) => T;
  watchSources?: WatchSource<unknown>[];
}

export interface TraderRequestState<T> {
  data: Ref<T | null>;
  error: Ref<ApiError | null>;
  loading: Ref<boolean>;
  refetch: () => Promise<T | null>;
  abort: () => void;
}

function isApiError(error: unknown): error is ApiError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const record = error as Record<string, unknown>;
  return (
    typeof record.status === 'number' &&
    typeof record.code === 'string' &&
    typeof record.message === 'string'
  );
}

function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  return {
    status: 0,
    code: 'HTTP',
    message:
      error instanceof Error
        ? error.message
        : 'Unknown API error while calling trader backend.',
  };
}

function parseString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function parseMarketScope(value: unknown): MarketScope {
  const marketScope = parseString(value, 'spot');
  return marketScope === 'isolated_margin' ||
    marketScope === 'legacy_futures'
    ? marketScope
    : 'spot';
}

function parseSignalTimeframe(value: unknown): SignalTimeframe {
  const timeframe = parseString(value, '1h');
  if (timeframe === '4h' || timeframe === '1d') {
    return timeframe;
  }
  return '1h';
}

function parseBacktestTimeframe(value: unknown): BacktestTimeframe | undefined {
  const timeframe = parseString(value);
  if (timeframe === '4h' || timeframe === '1d') {
    return timeframe;
  }
  return undefined;
}

function parseBacktestRunStatus(value: unknown): BacktestRunStatus {
  const status = parseString(value, 'PENDING');
  if (
    status === 'RUNNING' ||
    status === 'COMPLETED' ||
    status === 'FAILED'
  ) {
    return status;
  }
  return 'PENDING';
}

function parseAuditSeverity(value: unknown): AuditSeverity {
  const severity = parseString(value, 'INFO');
  if (severity === 'WARNING' || severity === 'CRITICAL') {
    return severity;
  }
  return 'INFO';
}

function parsePositionSide(value: unknown): PositionSide {
  return parseString(value, 'LONG') === 'SHORT' ? 'SHORT' : 'LONG';
}

function parseTradeSide(value: unknown): TradeSide {
  return parseString(value, 'LONG') === 'SHORT' ? 'SHORT' : 'LONG';
}

function normalizeNumericRecord(value: unknown): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, entry] of Object.entries(asRecord(value))) {
    result[key] = parseNumber(entry);
  }
  return result;
}

function mapStatusSnapshot(value: unknown): StatusSnapshot {
  const row = asRecord(value);
  const capabilities = asRecord(row.capabilities);

  return {
    marketScope: parseMarketScope(row.marketScope),
    tradingMode:
      parseString(row.tradingMode, 'backtest') === 'live'
        ? 'live'
        : parseString(row.tradingMode, 'backtest') === 'paper'
          ? 'paper'
          : 'backtest',
    capabilities: {
      hasValidBacktests: parseBoolean(capabilities.hasValidBacktests),
      hasPaperTradingEvidence: parseBoolean(
        capabilities.hasPaperTradingEvidence,
      ),
      goLiveEligible: parseBoolean(capabilities.goLiveEligible),
    },
    watchlistSize: parseNumber(row.watchlistSize),
    holdingsCount: parseNumber(row.holdingsCount),
    killSwitchActive: parseBoolean(row.killSwitchActive),
    timestamp: parseIsoDate(row.timestamp),
  };
}

function mapWatchlistAsset(value: unknown): WatchlistAsset {
  const row = asRecord(value);
  const filterResults = asRecord(row.filterResults);
  const scoringMetadata = asRecord(row.scoringMetadata);
  const manualSelectionMode = parseString(filterResults.manualSelectionMode);
  const liquidityTierCandidate =
    parseString(row.liquidityTier) ||
    parseString(filterResults.liquidityTier) ||
    parseString(scoringMetadata.liquidityTier) ||
    'unknown';

  return {
    id: parseString(row.id, parseString(row.symbol, '')),
    symbol: parseString(row.symbol),
    marketScope: parseMarketScope(row.marketScope),
    rankScore: parseNumber(row.rankScore),
    sectorBucket: parseString(row.sectorBucket) || null,
    liquidityTier: liquidityTierCandidate,
    selectionSource:
      manualSelectionMode === 'manual_include' ? 'manual' : 'auto',
    filterResults,
    scoringMetadata,
    updatedAt: parseIsoDate(row.updatedAt),
    createdAt: parseIsoDate(row.createdAt),
  };
}

function mapSignalView(value: unknown): SignalView {
  const row = asRecord(value);
  const contributions: Record<string, number> = {};
  for (const [key, contribution] of Object.entries(asRecord(row.contributions))) {
    contributions[key] = parseNumber(contribution);
  }

  return {
    symbol: parseString(row.symbol),
    timeframe: parseSignalTimeframe(row.timeframe),
    compositeScore: parseNumber(row.compositeScore),
    confidence: parseNumber(row.confidence),
    contributions,
    missingRequiredSignals: asStringArray(row.missingRequiredSignals),
    staleSignals: asStringArray(row.staleSignals),
    timestamp: parseNumber(row.timestamp),
  };
}

function parseSignalReadinessAction(value: unknown): SignalReadinessAction {
  const action = parseString(value, 'NEUTRAL');
  if (action === 'BUY' || action === 'SELL') {
    return action;
  }
  return 'NEUTRAL';
}

function mapSignalReadinessDimension(value: unknown): SignalReadinessDimension {
  const row = asRecord(value);

  return {
    label: parseString(row.label),
    score: parseNumber(row.score),
    sources: asStringArray(row.sources),
  };
}

function mapSignalReadiness(value: unknown): SignalReadiness {
  const row = asRecord(value);
  const dimensions = asRecord(row.dimensions);
  const thresholds = asRecord(row.thresholds);
  const positionSizePreview = asRecord(row.positionSizePreview);

  return {
    symbol: parseString(row.symbol),
    timeframe: parseSignalTimeframe(row.timeframe),
    readiness: parseNumber(row.readiness),
    compositeScore: parseNumber(row.compositeScore),
    confidence: parseNumber(row.confidence),
    dimensions: {
      technical: mapSignalReadinessDimension(dimensions.technical),
      regime: mapSignalReadinessDimension(dimensions.regime),
      liquidity: mapSignalReadinessDimension(dimensions.liquidity),
      participation: mapSignalReadinessDimension(dimensions.participation),
      sentiment: mapSignalReadinessDimension(dimensions.sentiment),
    },
    thresholds: {
      buy: parseNumber(thresholds.buy),
      sell: parseNumber(thresholds.sell),
      distanceToBuy: parseNumber(thresholds.distanceToBuy),
      distanceToSell: parseNumber(thresholds.distanceToSell),
      nearestAction: parseSignalReadinessAction(thresholds.nearestAction),
      nearestDistance: parseNumber(thresholds.nearestDistance),
    },
    positionSizePreview:
      row.positionSizePreview === null
        ? null
        : {
            entryPrice: parseNumber(positionSizePreview.entryPrice),
            stopLoss: parseNumber(positionSizePreview.stopLoss),
            quantity: parseNumber(positionSizePreview.quantity),
            cashAtRisk: parseNumber(positionSizePreview.cashAtRisk),
            stopDistance: parseNumber(positionSizePreview.stopDistance),
            riskFraction: parseNumber(positionSizePreview.riskFraction),
          },
    missingRequiredSignals: asStringArray(row.missingRequiredSignals),
    staleSignals: asStringArray(row.staleSignals),
    timestamp: parseNumber(row.timestamp),
  };
}

function mapPosition(value: unknown): Position {
  const row = asRecord(value);
  return {
    id: parseString(row.id),
    symbol: parseString(row.symbol),
    side: parsePositionSide(row.side),
    quantity: parseNumber(row.quantity),
    entryPrice: parseNumber(row.entryPrice),
    markPrice: parseNumber(row.markPrice),
    unrealizedPnl: parseNumber(row.unrealizedPnl),
    realizedPnl: parseNumber(row.realizedPnl),
    isOpen: parseBoolean(row.isOpen, true),
    openedAt: parseIsoDate(row.openedAt),
    updatedAt: parseIsoDate(row.updatedAt),
    leverage: parseNumber(row.leverage, 1),
    riskPct: parseNumber(row.riskPct),
  };
}

function mapPositionHealthDimension(value: unknown): PositionHealthDimension {
  const row = asRecord(value);
  return {
    label: parseString(row.label),
    score: parseNumber(row.score),
    weight: parseNumber(row.weight),
    contribution: parseNumber(row.contribution),
    detail: parseString(row.detail),
  };
}

function mapPositionHealth(value: unknown): PositionHealth {
  const row = asRecord(value);
  const dimensions = asRecord(row.dimensions);
  const statusCandidate = parseString(row.status, 'WATCH');

  return {
    positionId: parseString(row.positionId),
    symbol: parseString(row.symbol),
    side: parsePositionSide(row.side),
    healthScore: parseNumber(row.healthScore),
    status:
      statusCandidate === 'HOLD' || statusCandidate === 'EXIT_PRESSURE'
        ? statusCandidate
        : 'WATCH',
    exitPressureScore: parseNumber(row.exitPressureScore),
    currentCompositeScore: parseNumber(row.currentCompositeScore),
    entryCompositeScore: parseNumber(row.entryCompositeScore),
    currentRegimeScore: parseNumber(row.currentRegimeScore),
    entryRegimeScore: parseNumber(row.entryRegimeScore),
    positionAgeHours: parseNumber(row.positionAgeHours),
    averageTradeDurationHours: parseNumber(row.averageTradeDurationHours),
    syntheticStopPrice:
      row.syntheticStopPrice === null ? null : parseNumber(row.syntheticStopPrice),
    dimensions: {
      pnlTrend: mapPositionHealthDimension(dimensions.pnlTrend),
      signalEvolution: mapPositionHealthDimension(dimensions.signalEvolution),
      duration: mapPositionHealthDimension(dimensions.duration),
      stopProximity: mapPositionHealthDimension(dimensions.stopProximity),
      regimeCompatibility: mapPositionHealthDimension(dimensions.regimeCompatibility),
    },
    updatedAt: parseIsoDate(row.updatedAt),
  };
}

function mapSpotHolding(value: unknown): SpotHolding {
  const row = asRecord(value);
  const freeBalance = parseNumber(row.freeBalance);
  const lockedBalance = parseNumber(row.lockedBalance);
  const totalBalance = freeBalance + lockedBalance;
  const costBasis = parseNumber(row.costBasis);

  return {
    symbol: parseString(row.symbol),
    freeBalance,
    lockedBalance,
    totalBalance,
    costBasis,
    marketValue: totalBalance * costBasis,
    lastUpdated: parseIsoDate(row.lastUpdated),
  };
}

function mapPortfolioAllocation(value: unknown): PortfolioAllocation {
  const row = asRecord(value);
  return {
    symbol: parseString(row.symbol),
    quantity: parseNumber(row.quantity),
    value: parseNumber(row.value),
    allocationPct: parseNumber(row.allocationPct),
  };
}

function mapPortfolioMetrics(value: unknown): PortfolioMetrics {
  const row = asRecord(value);
  const portfolioAllocation = Array.isArray(row.portfolioAllocation)
    ? row.portfolioAllocation.map(mapPortfolioAllocation)
    : [];

  return {
    asOf: parseIsoDate(row.asOf),
    totalValue: parseNumber(row.totalValue),
    realizedPnl: parseNumber(row.realizedPnl),
    unrealizedPnl: parseNumber(row.unrealizedPnl),
    dailyChange: parseNumber(row.dailyChange),
    dailyChangePct: parseNumber(row.dailyChangePct),
    totalExposure: parseNumber(row.totalExposure),
    exposurePct: parseNumber(row.exposurePct),
    maxConcentrationPct: parseNumber(row.maxConcentrationPct),
    winRate: parseNumber(row.winRate),
    profitFactor:
      row.profitFactor === null ? null : parseNumber(row.profitFactor),
    sharpeRatio: parseNumber(row.sharpeRatio),
    maxDrawdown: parseNumber(row.maxDrawdown),
    calmarRatio: parseNumber(row.calmarRatio),
    averageTradeDurationHours: parseNumber(row.averageTradeDurationHours),
    totalTrades: parseNumber(row.totalTrades),
    portfolioAllocation,
  };
}

function mapPortfolioEquityPoint(value: unknown): PortfolioEquityPoint {
  const row = asRecord(value);
  return {
    date: parseIsoDate(row.date),
    dailyPnl: parseNumber(row.dailyPnl),
    cumulativePnl: parseNumber(row.cumulativePnl),
    equity: parseNumber(row.equity),
  };
}

function mapTrade(value: unknown): Trade {
  const row = asRecord(value);
  return {
    id: parseString(row.id),
    orderExecutionId: parseString(row.orderExecutionId),
    positionId:
      row.positionId === null ? null : parseString(row.positionId) || null,
    symbol: parseString(row.symbol),
    marketScope: parseMarketScope(row.marketScope),
    side: parseTradeSide(row.side),
    entryPrice: parseNumber(row.entryPrice),
    exitPrice: parseNumber(row.exitPrice),
    quantity: parseNumber(row.quantity),
    fees: parseNumber(row.fees),
    funding: parseNumber(row.funding),
    realizedPnl: parseNumber(row.realizedPnl),
    openedAt: parseIsoDate(row.openedAt),
    closedAt: parseIsoDate(row.closedAt),
    createdAt: parseIsoDate(row.createdAt),
    signalSnapshot: asRecord(row.signalSnapshot),
    regimeContext: parseString(row.regimeContext) || undefined,
  };
}

function mapPagedResponse<T>(
  value: unknown,
  mapItem: (row: unknown) => T,
  fallbackLimit: number,
): PagedResponse<T> {
  if (Array.isArray(value)) {
    const items = value.map(mapItem);
    return {
      items,
      total: items.length,
      offset: 0,
      limit: fallbackLimit,
    };
  }

  const row = asRecord(value);
  const rawItems = Array.isArray(row.items) ? row.items : [];
  const items = rawItems.map(mapItem);

  return {
    items,
    total: parseNumber(row.total, items.length),
    offset: parseNumber(row.offset, 0),
    limit: parseNumber(row.limit, fallbackLimit),
  };
}

function mapBacktestSummary(value: unknown): BacktestRunSummary {
  const row = asRecord(value);
  const params = asRecord(row.params);

  return {
    id: parseString(row.id),
    status: parseBacktestRunStatus(row.status),
    marketScope: parseMarketScope(row.marketScope),
    params: {
      symbols: asStringArray(params.symbols),
      days: parseNumber(params.days) || undefined,
      timeframe: parseBacktestTimeframe(params.timeframe),
      profileName: parseString(params.profileName) || undefined,
      startDate: parseString(params.startDate) || null,
      endDate: parseString(params.endDate) || null,
      marketScope: parseMarketScope(params.marketScope),
    },
    metrics: normalizeNumericRecord(row.metrics),
    startedAt: parseIsoDate(row.startedAt) || null,
    finishedAt: parseIsoDate(row.finishedAt) || null,
    createdAt: parseIsoDate(row.createdAt),
  };
}

function mapBacktestTrade(value: unknown) {
  const row = asRecord(value);
  return {
    symbol: parseString(row.symbol),
    side: parseTradeSide(row.side),
    entryPrice: parseNumber(row.entryPrice),
    exitPrice: parseNumber(row.exitPrice),
    quantity: parseNumber(row.quantity),
    pnl: parseNumber(row.pnl),
    fees: parseNumber(row.fees),
    funding: parseNumber(row.funding),
    openedAt: parseIsoDate(row.openedAt) || undefined,
    closedAt: parseIsoDate(row.closedAt) || undefined,
  };
}

function mapBacktestEquityPoint(value: unknown) {
  const row = asRecord(value);
  return {
    ts: parseIsoDate(row.ts ?? row.timestamp),
    value: parseNumber(row.value ?? row.equity ?? row.balance),
  };
}

function mapBacktestDetail(value: unknown): BacktestRunDetail {
  const row = asRecord(value);
  const summary = mapBacktestSummary(row);
  const equityCurve = Array.isArray(row.equityCurve)
    ? row.equityCurve.map(mapBacktestEquityPoint)
    : [];
  const trades = Array.isArray(row.trades)
    ? row.trades.map(mapBacktestTrade)
    : [];

  return {
    ...summary,
    equityCurve,
    trades,
  };
}

function mapWeightProfile(value: unknown): WeightProfile {
  const row = asRecord(value);
  return {
    id: parseString(row.id),
    marketScope: parseMarketScope(row.marketScope),
    version: parseNumber(row.version),
    isActive: parseBoolean(row.isActive, true),
    weights: normalizeNumericRecord(row.weights),
    thresholds: normalizeNumericRecord(row.thresholds),
    createdAt: parseIsoDate(row.createdAt),
    updatedAt: parseIsoDate(row.updatedAt),
  };
}

function mapAuditLogEntry(value: unknown): AuditLogEntry {
  const row = asRecord(value);
  const payload = asRecord(row.payload);

  const actorValue = parseString(row.actor || payload.actor);
  const reasonValue = parseString(row.reason || payload.reason);

  return {
    id: parseString(row.id),
    type: parseString(row.type),
    severity: parseAuditSeverity(row.severity),
    message: parseString(row.message),
    actor: actorValue.length ? actorValue : null,
    reason: reasonValue.length ? reasonValue : null,
    timestamp: parseIsoDate(row.timestamp || row.createdAt || row.updatedAt),
  };
}

function mapCorrelationSummaryItem(value: unknown): SignalCorrelationSummaryItem {
  const row = asRecord(value);
  const correlation = parseNumber(row.correlation ?? row.value);
  const variance = parseNumber(row.variance);
  const trendCandidate = parseString(row.trend, 'flat');
  const trend =
    trendCandidate === 'up' || trendCandidate === 'down'
      ? trendCandidate
      : 'flat';

  return {
    signal:
      parseString(row.signal) || parseString(row.feature) || parseString(row.name),
    correlation,
    variance,
    trend,
    sampleSize: parseNumber(row.sampleSize),
    degraded: parseBoolean(row.degraded, correlation < 0.3 || variance > 0.5),
  };
}

function mapCorrelationWindow(value: unknown): SignalCorrelationWindow {
  const row = asRecord(value);
  const rawRows =
    Array.isArray(row.rows) && row.rows.length
      ? row.rows
      : Array.isArray(row.summary)
        ? row.summary
        : [];

  return {
    periodStart: parseIsoDate(row.periodStart),
    periodEnd: parseIsoDate(row.periodEnd),
    sampleSize: parseNumber(row.sampleSize),
    rows: rawRows.map(mapCorrelationSummaryItem),
  };
}

function mapCorrelationResponse(value: unknown): SignalCorrelationResponse {
  const row = asRecord(value);
  const summary = Array.isArray(row.summary)
    ? row.summary.map(mapCorrelationSummaryItem)
    : [];
  const windows = Array.isArray(row.windows)
    ? row.windows.map(mapCorrelationWindow)
    : Array.isArray(row.history)
      ? row.history.map(mapCorrelationWindow)
      : [];
  const sampleSize = parseNumber(row.sampleSize, summary.length);
  const minSamples = parseNumber(row.minSamples, 30);

  const explicitState = parseString(row.state, '');
  const state: SignalCorrelationResponse['state'] =
    explicitState === 'ready' || explicitState === 'empty' || explicitState === 'low-sample'
      ? explicitState
      : sampleSize === 0
        ? 'empty'
        : sampleSize < minSamples
          ? 'low-sample'
          : 'ready';

  return {
    state,
    sampleSize,
    minSamples,
    generatedAt: parseIsoDate(row.generatedAt || row.createdAt) || null,
    summary,
    windows,
    message: parseString(row.message) || undefined,
  };
}

function parseSearchResource(value: unknown): SearchResultItem['resource'] {
  const resource = parseString(value);
  return resource === 'position' ||
    resource === 'holding' ||
    resource === 'watchlist' ||
    resource === 'trade' ||
    resource === 'backtest' ||
    resource === 'auditLog'
    ? resource
    : 'trade';
}

function mapSearchResultItem(value: unknown): SearchResultItem {
  const row = asRecord(value);
  return {
    resource: parseSearchResource(row.resource),
    id: parseString(row.id),
    title: parseString(row.title),
    subtitle: parseString(row.subtitle),
    badge: parseString(row.badge) || undefined,
  };
}

function mapSearchResultGroup(value: unknown): SearchResultGroup {
  const row = asRecord(value);
  const items = Array.isArray(row.items) ? row.items.map(mapSearchResultItem) : [];

  return {
    resource: parseSearchResource(row.resource),
    label: parseString(row.label),
    items,
  };
}

function mapSearchResponse(value: unknown): SearchResponse {
  const row = asRecord(value);
  return {
    query: parseString(row.query),
    total: parseNumber(row.total),
    groups: Array.isArray(row.groups)
      ? row.groups.map(mapSearchResultGroup)
      : [],
  };
}

function mapVoidOk(value: unknown): { ok: true } {
  const row = asRecord(value);
  return {
    ok: parseBoolean(row.ok, true) ? true : true,
  };
}

export function useTraderApiClient() {
  const runtimeConfig = useRuntimeConfig();
  const session = useSession();
  const ui = useUiStore();

  const client = createApiClient({
    baseUrl: parseString(runtimeConfig.public.traderApiBaseUrl, ''),
    getToken: () => session.token.value,
    onUnauthorized: () => {
      session.markUnauthorized();
    },
    onRateLimited: () => {
      ui.addAlert({
        type: 'warning',
        message:
          'Trader API rate limit reached. Polling will back off automatically.',
      });
    },
  });

  async function request<T>(
    path: string,
    options: TraderClientRequestOptions,
    parse: (payload: unknown) => T,
  ): Promise<T> {
    try {
      const payload = await client.request<unknown>(path, options);
      session.markAuthorized();
      return parse(payload);
    } catch (error) {
      const apiError = toApiError(error);

      if (!options.silent && apiError.status !== 0) {
        ui.addAlert({
          type:
            apiError.status === 429
              ? 'warning'
              : apiError.status >= 500
                ? 'error'
                : apiError.status === 403
                  ? 'warning'
                  : 'error',
          message: apiError.message,
        });
      }

      throw apiError;
    }
  }

  async function requestBlob(
    path: string,
    options: TraderClientRequestOptions,
  ): Promise<{ blob: Blob; headers: Headers }> {
    try {
      const result = await client.requestBlob(path, options);
      session.markAuthorized();
      return result;
    } catch (error) {
      const apiError = toApiError(error);

      if (!options.silent && apiError.status !== 0) {
        ui.addAlert({
          type:
            apiError.status === 429
              ? 'warning'
              : apiError.status >= 500
                ? 'error'
                : apiError.status === 403
                  ? 'warning'
                  : 'error',
          message: apiError.message,
        });
      }

      throw apiError;
    }
  }

  return {
    request,
    requestBlob,
  };
}

export function useTraderApi<T>(
  path: string,
  options: UseTraderApiOptions<T> = {},
): TraderRequestState<T> {
  const { request } = useTraderApiClient();

  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<ApiError | null>(null);
  const loading = ref(false);

  let controller: AbortController | null = null;

  async function execute(
    overrides: Partial<UseTraderApiOptions<T>> = {},
  ): Promise<T | null> {
    if (controller) {
      controller.abort();
    }

    controller = new AbortController();
    loading.value = true;
    error.value = null;

    try {
      const merged = {
        ...options,
        ...overrides,
        signal: controller.signal,
      } satisfies UseTraderApiOptions<T>;

      const parser = merged.parse ?? ((payload: unknown) => payload as T);
      const result = await request(path, merged, parser);
      data.value = result;
      return result;
    } catch (requestError) {
      const normalized = toApiError(requestError);
      if (normalized.status !== 0) {
        error.value = normalized;
      }
      return null;
    } finally {
      loading.value = false;
    }
  }

  function abort() {
    if (controller) {
      controller.abort();
    }
  }

  if (options.immediate !== false) {
    void execute();
  }

  if (options.watchSources?.length) {
    watch(options.watchSources, () => {
      void execute();
    });
  }

  return {
    data,
    error,
    loading,
    refetch: () => execute(),
    abort,
  };
}

export function useTraderContracts() {
  const { request, requestBlob } = useTraderApiClient();

  return {
    fetchStatus: () =>
      request(API_ENDPOINTS.status, { method: 'GET' }, mapStatusSnapshot),

    fetchWatchlist: () =>
      request(API_ENDPOINTS.watchlist, { method: 'GET' }, (payload) => {
        const rows = Array.isArray(payload) ? payload : [];
        return rows.map(mapWatchlistAsset);
      }),

    rebuildWatchlist: () =>
      request(API_ENDPOINTS.watchlistRebuild, { method: 'POST' }, (payload) => {
        const row = asRecord(payload);
        return {
          ok: true,
          selectedCount: parseNumber(row.selectedCount),
        } satisfies WatchlistRebuildResponse;
      }),

    addWatchlistAsset: (symbol: string) =>
      request(
        API_ENDPOINTS.watchlistAssets,
        {
          method: 'POST',
          body: { symbol },
        },
        mapWatchlistAsset,
      ),

    removeWatchlistAsset: (symbol: string) =>
      request(
        API_ENDPOINTS.watchlistAssetRemove,
        {
          method: 'POST',
          body: { symbol },
        },
        mapVoidOk,
      ),

    fetchSignals: () =>
      request(API_ENDPOINTS.signals, { method: 'GET' }, (payload) => {
        const rows = Array.isArray(payload) ? payload : [];
        return rows.map(mapSignalView);
      }),

    fetchSignalDetail: (symbol: string) =>
      request(API_ENDPOINTS.signalDetail(symbol), { method: 'GET' }, mapSignalView),

    fetchSignalReadiness: (symbol: string, timeframe?: SignalTimeframe) =>
      request(
        API_ENDPOINTS.signalReadiness(symbol),
        {
          method: 'GET',
          query: timeframe ? { timeframe } : undefined,
        },
        mapSignalReadiness,
      ),

    fetchPositions: () =>
      request(API_ENDPOINTS.positions, { method: 'GET' }, (payload) => {
        const rows = Array.isArray(payload) ? payload : [];
        return rows.map(mapPosition);
      }),

    fetchPositionHealth: () =>
      request(API_ENDPOINTS.positionHealth, { method: 'GET' }, (payload) => {
        const rows = Array.isArray(payload) ? payload : [];
        return rows.map(mapPositionHealth);
      }),

    fetchHoldings: () =>
      request(API_ENDPOINTS.holdings, { method: 'GET' }, (payload) => {
        const rows = Array.isArray(payload) ? payload : [];
        return rows.map(mapSpotHolding);
      }),

    fetchPortfolioMetrics: () =>
      request(
        API_ENDPOINTS.portfolioMetrics,
        { method: 'GET' },
        mapPortfolioMetrics,
      ),

    fetchPortfolioEquityCurve: () =>
      request(API_ENDPOINTS.portfolioEquityCurve, { method: 'GET' }, (payload) => {
        const rows = Array.isArray(payload) ? payload : [];
        return rows.map(mapPortfolioEquityPoint);
      }),

    fetchTrades: (query: TradeListQuery) =>
      request(
        API_ENDPOINTS.trades,
        {
          method: 'GET',
          query: buildTradeQueryParams(query),
        },
        (payload) => mapPagedResponse(payload, mapTrade, DEFAULT_PAGE_LIMITS.trades),
      ),

    downloadTradesExport: (
      filters: TradeFilters = {},
      signal?: AbortSignal,
    ) =>
      requestBlob(API_ENDPOINTS.exportTrades, {
        method: 'GET',
        signal,
        headers: {
          Accept: 'text/csv',
        },
        query: buildTradeQueryParams(filters),
      }).then(({ blob, headers }) => ({
        blob,
        fileName: parseContentDispositionFileName(
          headers,
          'trades-export.csv',
        ),
      }) satisfies FileDownload),

    fetchBacktestList: (offset: number, limit: number) =>
      request(
        API_ENDPOINTS.backtests,
        {
          method: 'GET',
          query: { offset, limit },
        },
        (payload) =>
          mapPagedResponse(payload, mapBacktestSummary, DEFAULT_PAGE_LIMITS.backtests),
      ),

    fetchBacktestDetail: (id: string) =>
      request(API_ENDPOINTS.backtestDetail(id), { method: 'GET' }, mapBacktestDetail),

    launchBacktest: (payload: BacktestLaunchPayload) =>
      request(
        API_ENDPOINTS.backtestLaunch,
        {
          method: 'POST',
          body: payload,
        },
        (result) => {
          const row = asRecord(result);
          return { runId: parseString(row.runId) };
        },
      ),

    fetchConfig: () =>
      request(API_ENDPOINTS.config, { method: 'GET' }, (payload) => {
        if (!payload) {
          return null;
        }
        return mapWeightProfile(payload);
      }),

    updateConfig: (payload: WeightProfileUpdatePayload) =>
      request(
        API_ENDPOINTS.configWeights,
        {
          method: 'PUT',
          body: payload,
        },
        mapWeightProfile,
      ),

    triggerKillSwitch: (payload: ControlActionPayload) =>
      request(
        API_ENDPOINTS.controlKillSwitch,
        {
          method: 'POST',
          body: payload,
        },
        mapVoidOk,
      ),

    resumeTrading: (payload: ControlActionPayload) =>
      request(
        API_ENDPOINTS.controlResume,
        {
          method: 'POST',
          body: payload,
        },
        mapVoidOk,
      ),

    fetchCorrelation: (history = 12) =>
      request(
        API_ENDPOINTS.signalCorrelation,
        {
          method: 'GET',
          query: { history },
        },
        mapCorrelationResponse,
      ),

    searchGlobal: (query: string, limit = 5) =>
      request(
        API_ENDPOINTS.search,
        {
          method: 'GET',
          query: { q: query, limit },
        },
        mapSearchResponse,
      ),

    fetchAuditLog: (
      offset: number,
      limit: number,
      filters: AuditLogFilters = {},
    ) =>
      request(
        API_ENDPOINTS.auditLog,
        {
          method: 'GET',
          query: {
            offset,
            limit,
            actor: filters.actor || undefined,
            type: filters.type || undefined,
            severity: filters.severity || undefined,
            from: filters.from || undefined,
            to: filters.to || undefined,
          },
        },
        (payload) =>
          mapPagedResponse(payload, mapAuditLogEntry, DEFAULT_PAGE_LIMITS.auditLog),
      ),

    fetchHealth: () =>
      request(API_ENDPOINTS.health, { method: 'GET' }, (payload) => {
        const p = payload as Record<string, unknown>;
        return {
          status: (p.status as string) ?? 'unknown',
          uptime: (p.uptime as number) ?? 0,
          timestamp: (p.timestamp as string) ?? '',
          services: (p.services as Record<string, { status: string; latencyMs?: number; detail?: string }>) ?? {},
        };
      }),
  } satisfies {
    fetchStatus: () => Promise<StatusSnapshot>;
    fetchWatchlist: () => Promise<WatchlistAsset[]>;
    rebuildWatchlist: () => Promise<WatchlistRebuildResponse>;
    addWatchlistAsset: (symbol: string) => Promise<WatchlistAsset>;
    removeWatchlistAsset: (symbol: string) => Promise<{ ok: true }>;
    fetchSignals: () => Promise<SignalView[]>;
    fetchSignalDetail: (symbol: string) => Promise<SignalView>;
    fetchSignalReadiness: (
      symbol: string,
      timeframe?: SignalTimeframe,
    ) => Promise<SignalReadiness>;
    fetchPositions: () => Promise<Position[]>;
    fetchPositionHealth: () => Promise<PositionHealth[]>;
    fetchHoldings: () => Promise<SpotHolding[]>;
    fetchPortfolioMetrics: () => Promise<PortfolioMetrics>;
    fetchPortfolioEquityCurve: () => Promise<PortfolioEquityPoint[]>;
    fetchTrades: (query: TradeListQuery) => Promise<PagedResponse<Trade>>;
    downloadTradesExport: (
      filters?: TradeFilters,
      signal?: AbortSignal,
    ) => Promise<FileDownload>;
    fetchBacktestList: (
      offset: number,
      limit: number,
    ) => Promise<PagedResponse<BacktestRunSummary>>;
    fetchBacktestDetail: (id: string) => Promise<BacktestRunDetail>;
    launchBacktest: (payload: BacktestLaunchPayload) => Promise<{ runId: string }>;
    fetchConfig: () => Promise<WeightProfile | null>;
    updateConfig: (payload: WeightProfileUpdatePayload) => Promise<WeightProfile>;
    triggerKillSwitch: (payload: ControlActionPayload) => Promise<{ ok: true }>;
    resumeTrading: (payload: ControlActionPayload) => Promise<{ ok: true }>;
    fetchCorrelation: (history?: number) => Promise<SignalCorrelationResponse>;
    searchGlobal: (query: string, limit?: number) => Promise<SearchResponse>;
    fetchAuditLog: (
      offset: number,
      limit: number,
      filters?: AuditLogFilters,
    ) => Promise<AuditLogResponse>;
    fetchHealth: () => Promise<{
      status: string;
      uptime: number;
      timestamp: string;
      services: Record<string, { status: string; latencyMs?: number; detail?: string }>;
    }>;
  };
}
