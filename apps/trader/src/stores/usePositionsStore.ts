import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { ApiError } from '~/types/api';
import type {
  Position,
  PositionHealth,
  TraderResourceKey,
} from '~/types/trader';
import { useTraderContracts } from '~/composables/useTraderApi';
import { useCacheStore } from '~/stores/cache';
import {
  CACHE_MAX_AGE_MS,
  DEFAULT_POLLING_INTERVALS,
} from '~/utils/constants';

type PositionsResourceKey = Extract<TraderResourceKey, 'positions' | 'positionHealth'>;
type PositionsLoadingState = Record<PositionsResourceKey, boolean>;
type PositionsErrorState = Record<PositionsResourceKey, string | null>;

function createLoadingState(): PositionsLoadingState {
  return {
    positions: false,
    positionHealth: false,
  };
}

function createErrorState(): PositionsErrorState {
  return {
    positions: null,
    positionHealth: null,
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
  return 'Unknown positions API error.';
}

export const usePositionsStore = defineStore('positions-snapshot', () => {
  const api = useTraderContracts();
  const cache = useCacheStore();

  const positions = ref<Position[]>([]);
  const positionHealth = ref<PositionHealth[]>([]);
  const loading = ref<PositionsLoadingState>(createLoadingState());
  const errors = ref<PositionsErrorState>(createErrorState());
  const pollingInterval = DEFAULT_POLLING_INTERVALS.positions;

  function setLoading(resource: PositionsResourceKey, value: boolean) {
    loading.value[resource] = value;
  }

  function setError(resource: PositionsResourceKey, message: string | null) {
    errors.value[resource] = message;
  }

  function shouldFetch(resource: PositionsResourceKey, force: boolean) {
    if (force) {
      return true;
    }

    return cache.isStale(resource, CACHE_MAX_AGE_MS[resource]);
  }

  async function runResourceAction<T>(
    resource: PositionsResourceKey,
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

  async function fetchPositionHealth(force = false) {
    if (!shouldFetch('positionHealth', force)) {
      return positionHealth.value;
    }

    const result = await runResourceAction('positionHealth', () =>
      api.fetchPositionHealth(),
    );
    if (result) {
      positionHealth.value = result;
    }
    return result;
  }

  async function refreshSnapshot(force = false) {
    await Promise.all([fetchPositions(force), fetchPositionHealth(force)]);
  }

  const healthByPositionId = computed(() => {
    return Object.fromEntries(
      positionHealth.value.map((health) => [health.positionId, health]),
    ) as Record<string, PositionHealth>;
  });

  const positionsWithHealth = computed(() => {
    return positions.value.map((position) => ({
      position,
      health: healthByPositionId.value[position.id] ?? null,
    }));
  });

  return {
    positions,
    positionHealth,
    loading,
    errors,
    pollingInterval,
    healthByPositionId,
    positionsWithHealth,
    fetchPositions,
    fetchPositionHealth,
    refreshSnapshot,
  };
});