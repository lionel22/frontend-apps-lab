import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { ApiError } from '~/types/api';
import type {
  AuditLogResponse,
  BacktestLaunchPayload,
  BacktestRunDetail,
  BacktestRunSummary,
  ControlActionPayload,
  PagedResponse,
  Position,
  SignalCorrelationResponse,
  SignalView,
  StatusSnapshot,
  Trade,
  TraderResourceKey,
  WatchlistAsset,
  WeightProfile,
  WeightProfileUpdatePayload,
} from '~/types/trader';
import {
  CACHE_MAX_AGE_MS,
  DEFAULT_PAGE_LIMITS,
  DEFAULT_POLLING_INTERVALS,
} from '~/utils/constants';
import {
  validateBacktestLaunch,
  validateControlAction,
  validateWeightProfileUpdate,
} from '~/utils/validators';
import { useTraderContracts } from '~/composables/useTraderApi';
import { useCacheStore } from '~/stores/cache';
import { useUiStore } from '~/stores/ui';

type LoadingState = Record<TraderResourceKey, boolean>;
type ErrorState = Record<TraderResourceKey, string | null>;

function createLoadingState(): LoadingState {
  return {
    status: false,
    watchlist: false,
    signals: false,
    positions: false,
    trades: false,
    backtests: false,
    backtestDetail: false,
    config: false,
    correlation: false,
    auditLog: false,
  };
}

function createErrorState(): ErrorState {
  return {
    status: null,
    watchlist: null,
    signals: null,
    positions: null,
    trades: null,
    backtests: null,
    backtestDetail: null,
    config: null,
    correlation: null,
    auditLog: null,
  };
}

function emptyPaged<T>(limit: number): PagedResponse<T> {
  return {
    items: [],
    total: 0,
    offset: 0,
    limit,
  };
}

function extractApiMessage(error: unknown): string {
  const apiError = error as ApiError | undefined;
  if (apiError && typeof apiError.message === 'string') {
    return apiError.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown trader API error.';
}

export const useTraderStore = defineStore('trader', () => {
  const api = useTraderContracts();
  const cache = useCacheStore();
  const ui = useUiStore();

  const status = ref<StatusSnapshot | null>(null);
  const watchlist = ref<WatchlistAsset[]>([]);
  const signals = ref<SignalView[]>([]);
  const selectedSignal = ref<SignalView | null>(null);
  const positions = ref<Position[]>([]);
  const trades = ref<PagedResponse<Trade>>(emptyPaged(DEFAULT_PAGE_LIMITS.trades));
  const backtests = ref<PagedResponse<BacktestRunSummary>>(
    emptyPaged(DEFAULT_PAGE_LIMITS.backtests),
  );
  const backtestDetail = ref<BacktestRunDetail | null>(null);
  const config = ref<WeightProfile | null>(null);
  const correlation = ref<SignalCorrelationResponse | null>(null);
  const auditLog = ref<AuditLogResponse>(emptyPaged(DEFAULT_PAGE_LIMITS.auditLog));

  const loading = ref<LoadingState>(createLoadingState());
  const errors = ref<ErrorState>(createErrorState());

  const pollingIntervals = {
    status: DEFAULT_POLLING_INTERVALS.status,
    watchlist: DEFAULT_POLLING_INTERVALS.watchlist,
    signals: DEFAULT_POLLING_INTERVALS.signals,
    positions: DEFAULT_POLLING_INTERVALS.positions,
    trades: DEFAULT_POLLING_INTERVALS.trades,
    backtests: DEFAULT_POLLING_INTERVALS.backtests,
  };

  function setLoading(resource: TraderResourceKey, value: boolean) {
    loading.value[resource] = value;
  }

  function setError(resource: TraderResourceKey, message: string | null) {
    errors.value[resource] = message;
  }

  function shouldFetch(resource: TraderResourceKey, force: boolean): boolean {
    if (force) {
      return true;
    }

    return cache.isStale(resource, CACHE_MAX_AGE_MS[resource]);
  }

  async function runResourceAction<T>(
    resource: TraderResourceKey,
    action: () => Promise<T>,
  ): Promise<T | null> {
    setLoading(resource, true);
    setError(resource, null);

    try {
      const result = await action();
      cache.touch(resource);
      return result;
    } catch (error) {
      setError(resource, extractApiMessage(error));
      return null;
    } finally {
      setLoading(resource, false);
    }
  }

  async function fetchStatus(force = false) {
    if (!shouldFetch('status', force)) {
      return status.value;
    }

    const result = await runResourceAction('status', () => api.fetchStatus());
    if (result) {
      status.value = result;
    }
    return result;
  }

  async function fetchWatchlist(force = false) {
    if (!shouldFetch('watchlist', force)) {
      return watchlist.value;
    }

    const result = await runResourceAction('watchlist', () => api.fetchWatchlist());
    if (result) {
      watchlist.value = result;
    }
    return result;
  }

  async function fetchSignals(force = false) {
    if (!shouldFetch('signals', force)) {
      return signals.value;
    }

    const result = await runResourceAction('signals', () => api.fetchSignals());
    if (result) {
      signals.value = result;
    }
    return result;
  }

  async function fetchSignalDetail(symbol: string) {
    const result = await runResourceAction('signals', () =>
      api.fetchSignalDetail(symbol),
    );

    if (result) {
      selectedSignal.value = result;
    }

    return result;
  }

  async function fetchPositions(force = false) {
    if (!shouldFetch('positions', force)) {
      return positions.value;
    }

    const result = await runResourceAction('positions', () => api.fetchPositions());
    if (result) {
      positions.value = result;
    }

    return result;
  }

  async function fetchTrades(
    offset = ui.filters.tradesOffset,
    limit = ui.filters.tradesLimit,
    force = false,
  ) {
    if (!shouldFetch('trades', force) && trades.value.offset === offset) {
      return trades.value;
    }

    ui.updateFilter('tradesOffset', offset);
    ui.updateFilter('tradesLimit', limit);

    const result = await runResourceAction('trades', () =>
      api.fetchTrades(offset, limit),
    );
    if (result) {
      trades.value = result;
    }

    return result;
  }

  async function fetchBacktestList(
    offset = backtests.value.offset,
    limit = backtests.value.limit,
    force = false,
  ) {
    if (!shouldFetch('backtests', force) && backtests.value.offset === offset) {
      return backtests.value;
    }

    const result = await runResourceAction('backtests', () =>
      api.fetchBacktestList(offset, limit),
    );
    if (result) {
      backtests.value = result;
    }
    return result;
  }

  async function fetchBacktestDetail(id: string, force = false) {
    if (!shouldFetch('backtestDetail', force) && backtestDetail.value?.id === id) {
      return backtestDetail.value;
    }

    const result = await runResourceAction('backtestDetail', () =>
      api.fetchBacktestDetail(id),
    );
    if (result) {
      backtestDetail.value = result;
    }
    return result;
  }

  async function fetchConfig(force = false) {
    if (!shouldFetch('config', force)) {
      return config.value;
    }

    const result = await runResourceAction('config', () => api.fetchConfig());
    config.value = result;
    return result;
  }

  async function fetchCorrelation(force = false) {
    if (!shouldFetch('correlation', force)) {
      return correlation.value;
    }

    const result = await runResourceAction('correlation', () =>
      api.fetchCorrelation(),
    );
    if (result) {
      correlation.value = result;
    }

    return result;
  }

  async function fetchAuditLog(
    offset = ui.filters.auditOffset,
    limit = ui.filters.auditLimit,
    actor?: string,
    type?: string,
    force = false,
  ) {
    if (!shouldFetch('auditLog', force) && auditLog.value.offset === offset) {
      return auditLog.value;
    }

    ui.updateFilter('auditOffset', offset);
    ui.updateFilter('auditLimit', limit);

    const result = await runResourceAction('auditLog', () =>
      api.fetchAuditLog(offset, limit, actor, type),
    );
    if (result) {
      auditLog.value = result;
    }

    return result;
  }

  async function launchBacktest(payload: BacktestLaunchPayload) {
    const validationErrors = validateBacktestLaunch(payload);
    if (Object.keys(validationErrors).length) {
      ui.addAlert({
        type: 'warning',
        message: Object.values(validationErrors)[0],
      });
      return null;
    }

    const response = await api.launchBacktest(payload);
    cache.invalidate('backtests');
    cache.invalidate('backtestDetail');
    ui.addAlert({
      type: 'success',
      message: `Backtest ${response.runId} queued successfully.`,
    });
    return response;
  }

  async function executeKillSwitch(payload: ControlActionPayload) {
    const validationErrors = validateControlAction(payload.actor, payload.reason);
    if (Object.keys(validationErrors).length) {
      ui.addAlert({
        type: 'warning',
        message: Object.values(validationErrors)[0],
      });
      return null;
    }

    const result = await api.triggerKillSwitch(payload);
    cache.invalidate('status');
    cache.invalidate('positions');
    ui.addAlert({
      type: 'success',
      message: 'Kill-switch activated successfully.',
    });
    return result;
  }

  async function resumeTrading(payload: ControlActionPayload) {
    const validationErrors = validateControlAction(payload.actor, payload.reason);
    if (Object.keys(validationErrors).length) {
      ui.addAlert({
        type: 'warning',
        message: Object.values(validationErrors)[0],
      });
      return null;
    }

    const result = await api.resumeTrading(payload);
    cache.invalidate('status');
    cache.invalidate('positions');
    ui.addAlert({
      type: 'success',
      message: 'Trading resumed successfully.',
    });
    return result;
  }

  async function updateConfig(payload: WeightProfileUpdatePayload) {
    const validationErrors = validateWeightProfileUpdate(payload);
    if (Object.keys(validationErrors).length) {
      ui.addAlert({
        type: 'warning',
        message: Object.values(validationErrors)[0],
      });
      return null;
    }

    const result = await api.updateConfig(payload);
    config.value = result;

    cache.invalidate('config');
    cache.invalidate('correlation');
    cache.invalidate('auditLog');

    ui.addAlert({
      type: 'success',
      message: `Configuration version ${result.version} saved successfully.`,
    });
    return result;
  }

  const openPositionCount = computed(() => positions.value.length);
  const totalPortfolioRisk = computed(() =>
    positions.value.reduce((acc, position) => acc + position.riskPct, 0),
  );
  const isKillSwitchActive = computed(() => status.value?.killSwitchActive ?? false);

  return {
    status,
    watchlist,
    signals,
    selectedSignal,
    positions,
    trades,
    backtests,
    backtestDetail,
    config,
    correlation,
    auditLog,
    loading,
    errors,
    pollingIntervals,
    openPositionCount,
    totalPortfolioRisk,
    isKillSwitchActive,
    fetchStatus,
    fetchWatchlist,
    fetchSignals,
    fetchSignalDetail,
    fetchPositions,
    fetchTrades,
    fetchBacktestList,
    fetchBacktestDetail,
    fetchConfig,
    fetchCorrelation,
    fetchAuditLog,
    launchBacktest,
    executeKillSwitch,
    resumeTrading,
    updateConfig,
  };
});
