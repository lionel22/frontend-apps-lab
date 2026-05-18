import { defineStore } from 'pinia';
import type { TraderResourceKey } from '~/types/trader';

interface CacheEntry {
  lastFetchTime: number | null;
}

type CacheResourceState = Record<TraderResourceKey, CacheEntry>;

function createInitialResources(): CacheResourceState {
  return {
    status: { lastFetchTime: null },
    watchlist: { lastFetchTime: null },
    signals: { lastFetchTime: null },
    positions: { lastFetchTime: null },
    trades: { lastFetchTime: null },
    backtests: { lastFetchTime: null },
    backtestDetail: { lastFetchTime: null },
    config: { lastFetchTime: null },
    correlation: { lastFetchTime: null },
    auditLog: { lastFetchTime: null },
  };
}

export const useCacheStore = defineStore('cache', {
  state: () => ({
    resources: createInitialResources(),
  }),
  actions: {
    touch(resource: TraderResourceKey) {
      this.resources[resource].lastFetchTime = Date.now();
    },

    invalidate(resource: TraderResourceKey) {
      this.resources[resource].lastFetchTime = null;
    },

    invalidatePattern(pattern: string) {
      for (const key of Object.keys(this.resources) as TraderResourceKey[]) {
        if (key.includes(pattern)) {
          this.resources[key].lastFetchTime = null;
        }
      }
    },

    isStale(resource: TraderResourceKey, maxAge: number) {
      const entry = this.resources[resource];
      if (!entry.lastFetchTime) {
        return true;
      }

      return Date.now() - entry.lastFetchTime > maxAge;
    },
  },
});
