import { ref, watch, type Ref, type WatchSource } from 'vue';
import type { ApiError, ApiRequestOptions } from '~/types/api';
import type {
  AuditLogEntry,
  AuditLogResponse,
  BacktestLaunchPayload,
  BacktestRunDetail,
  BacktestRunSummary,
  ControlActionPayload,
  PagedResponse,
  Position,
  SignalCorrelationResponse,
  SignalCorrelationSummaryItem,
  SignalCorrelationWindow,
  SignalView,
  StatusSnapshot,
  Trade,
  WatchlistAsset,
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
    marketScope: 'spot',
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
  const liquidityTierCandidate =
    parseString(row.liquidityTier) ||
    parseString(filterResults.liquidityTier) ||
    parseString(scoringMetadata.liquidityTier) ||
    'unknown';

  return {
    id: parseString(row.id, parseString(row.symbol, '')),
    symbol: parseString(row.symbol),
    marketScope: parseString(row.marketScope, 'spot'),
    rankScore: parseNumber(row.rankScore),
    sectorBucket: parseString(row.sectorBucket) || null,
    liquidityTier: liquidityTierCandidate,
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
    timeframe: parseString(row.timeframe, '1h'),
    compositeScore: parseNumber(row.compositeScore),
    confidence: parseNumber(row.confidence),
    contributions,
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
    side: parseString(row.side),
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

function mapTrade(value: unknown): Trade {
  const row = asRecord(value);
  return {
    id: parseString(row.id),
    orderExecutionId: parseString(row.orderExecutionId),
    positionId:
      row.positionId === null ? null : parseString(row.positionId) || null,
    symbol: parseString(row.symbol),
    marketScope: parseString(row.marketScope, 'spot'),
    side: parseString(row.side),
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
    status: (parseString(row.status, 'PENDING') as BacktestRunSummary['status']) ??
      'PENDING',
    marketScope: parseString(row.marketScope, 'spot'),
    params: {
      symbols: asStringArray(params.symbols),
      days: parseNumber(params.days) || undefined,
      timeframe: parseString(params.timeframe) || undefined,
      profileName: parseString(params.profileName) || undefined,
      startDate: parseString(params.startDate) || null,
      endDate: parseString(params.endDate) || null,
      marketScope: parseString(params.marketScope) || 'spot',
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
    side: parseString(row.side),
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
    marketScope: parseString(row.marketScope, 'spot'),
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
    severity: parseString(row.severity, 'INFO'),
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

      if (!options.silent) {
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
  const { request } = useTraderApiClient();

  return {
    fetchStatus: () =>
      request(API_ENDPOINTS.status, { method: 'GET' }, mapStatusSnapshot),

    fetchWatchlist: () =>
      request(API_ENDPOINTS.watchlist, { method: 'GET' }, (payload) => {
        const rows = Array.isArray(payload) ? payload : [];
        return rows.map(mapWatchlistAsset);
      }),

    fetchSignals: () =>
      request(API_ENDPOINTS.signals, { method: 'GET' }, (payload) => {
        const rows = Array.isArray(payload) ? payload : [];
        return rows.map(mapSignalView);
      }),

    fetchSignalDetail: (symbol: string) =>
      request(API_ENDPOINTS.signalDetail(symbol), { method: 'GET' }, mapSignalView),

    fetchPositions: () =>
      request(API_ENDPOINTS.positions, { method: 'GET' }, (payload) => {
        const rows = Array.isArray(payload) ? payload : [];
        return rows.map(mapPosition);
      }),

    fetchTrades: (offset: number, limit: number) =>
      request(
        API_ENDPOINTS.trades,
        {
          method: 'GET',
          query: { offset, limit },
        },
        (payload) => mapPagedResponse(payload, mapTrade, DEFAULT_PAGE_LIMITS.trades),
      ),

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

    fetchAuditLog: (offset: number, limit: number, actor?: string, type?: string) =>
      request(
        API_ENDPOINTS.auditLog,
        {
          method: 'GET',
          query: {
            offset,
            limit,
            actor: actor || undefined,
            type: type || undefined,
          },
        },
        (payload) =>
          mapPagedResponse(payload, mapAuditLogEntry, DEFAULT_PAGE_LIMITS.auditLog),
      ),
  } satisfies {
    fetchStatus: () => Promise<StatusSnapshot>;
    fetchWatchlist: () => Promise<WatchlistAsset[]>;
    fetchSignals: () => Promise<SignalView[]>;
    fetchSignalDetail: (symbol: string) => Promise<SignalView>;
    fetchPositions: () => Promise<Position[]>;
    fetchTrades: (offset: number, limit: number) => Promise<PagedResponse<Trade>>;
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
    fetchAuditLog: (
      offset: number,
      limit: number,
      actor?: string,
      type?: string,
    ) => Promise<AuditLogResponse>;
  };
}
