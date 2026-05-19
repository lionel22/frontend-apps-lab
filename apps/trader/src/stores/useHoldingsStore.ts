import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { ApiError } from '~/types/api';
import type {
  PortfolioEquityPoint,
  PortfolioMetrics,
  SpotHolding,
  TraderResourceKey,
} from '~/types/trader';
import { useTraderContracts } from '~/composables/useTraderApi';
import { useCacheStore } from '~/stores/cache';
import {
  CACHE_MAX_AGE_MS,
  DEFAULT_POLLING_INTERVALS,
} from '~/utils/constants';

type HoldingsResourceKey = Extract<
  TraderResourceKey,
  'holdings' | 'portfolioMetrics' | 'portfolioEquityCurve'
>;

type HoldingsLoadingState = Record<HoldingsResourceKey, boolean>;
type HoldingsErrorState = Record<HoldingsResourceKey, string | null>;

function createLoadingState(): HoldingsLoadingState {
  return {
    holdings: false,
    portfolioMetrics: false,
    portfolioEquityCurve: false,
  };
}

function createErrorState(): HoldingsErrorState {
  return {
    holdings: null,
    portfolioMetrics: null,
    portfolioEquityCurve: null,
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
  return 'Unknown holdings API error.';
}

export const useHoldingsStore = defineStore('holdings', () => {
  const api = useTraderContracts();
  const cache = useCacheStore();

  const holdings = ref<SpotHolding[]>([]);
  const portfolioMetrics = ref<PortfolioMetrics | null>(null);
  const portfolioEquityCurve = ref<PortfolioEquityPoint[]>([]);
  const loading = ref<HoldingsLoadingState>(createLoadingState());
  const errors = ref<HoldingsErrorState>(createErrorState());
  const pollingInterval = DEFAULT_POLLING_INTERVALS.holdings;

  function setLoading(resource: HoldingsResourceKey, value: boolean) {
    loading.value[resource] = value;
  }

  function setError(resource: HoldingsResourceKey, message: string | null) {
    errors.value[resource] = message;
  }

  function shouldFetch(resource: HoldingsResourceKey, force: boolean) {
    if (force) {
      return true;
    }

    return cache.isStale(resource, CACHE_MAX_AGE_MS[resource]);
  }

  async function runResourceAction<T>(
    resource: HoldingsResourceKey,
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

  async function fetchHoldings(force = false) {
    if (!shouldFetch('holdings', force)) {
      return holdings.value;
    }

    const result = await runResourceAction('holdings', () => api.fetchHoldings());
    if (result) {
      holdings.value = result;
    }
    return result;
  }

  async function fetchPortfolioMetrics(force = false) {
    if (!shouldFetch('portfolioMetrics', force)) {
      return portfolioMetrics.value;
    }

    const result = await runResourceAction('portfolioMetrics', () =>
      api.fetchPortfolioMetrics(),
    );
    if (result) {
      portfolioMetrics.value = result;
    }
    return result;
  }

  async function fetchPortfolioEquityCurve(force = false) {
    if (!shouldFetch('portfolioEquityCurve', force)) {
      return portfolioEquityCurve.value;
    }

    const result = await runResourceAction('portfolioEquityCurve', () =>
      api.fetchPortfolioEquityCurve(),
    );
    if (result) {
      portfolioEquityCurve.value = result;
    }
    return result;
  }

  async function refreshSnapshot(force = false) {
    await Promise.all([
      fetchHoldings(force),
      fetchPortfolioMetrics(force),
    ]);
  }

  const portfolioAllocation = computed(
    () => portfolioMetrics.value?.portfolioAllocation ?? [],
  );
  const totalMarketValue = computed(
    () =>
      portfolioMetrics.value?.totalValue ??
      holdings.value.reduce((sum, holding) => sum + holding.marketValue, 0),
  );

  return {
    holdings,
    portfolioMetrics,
    portfolioEquityCurve,
    loading,
    errors,
    pollingInterval,
    portfolioAllocation,
    totalMarketValue,
    fetchHoldings,
    fetchPortfolioMetrics,
    fetchPortfolioEquityCurve,
    refreshSnapshot,
  };
});
