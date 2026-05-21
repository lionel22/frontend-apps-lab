import type { Ref } from 'vue';

declare global {
  var useState: <T>(key: string, initializer: () => T) => Ref<T>;
  var useRuntimeConfig: () => {
    public: {
      apiUrl: string;
      traderApiBaseUrl: string;
      traderPollingIntervalDefault: number;
      traderPollingIntervalPositions: number;
      traderPollingIntervalTrades: number;
      traderAuthToken: string;
      traderRequireAuth: boolean;
    };
  };
  var navigateTo: (path: string) => Promise<string>;
  var defineNuxtRouteMiddleware: <T>(handler: T) => T;
  var definePageMeta: (meta: Record<string, unknown>) => void;
}

export {};
