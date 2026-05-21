import type { Ref } from 'vue';

declare global {
  var useState: <T>(key: string, initializer: () => T) => Ref<T>;
  var useRuntimeConfig: () => {
    public: {
      musicApiBaseUrl: string;
      musicPollingIntervalDefault: number;
      musicRequireAuth: boolean;
      musicAuthStorageKey: string;
    };
  };
  var useCookie: <T>(
    key: string,
    options?: { default?: () => T; sameSite?: string; path?: string },
  ) => Ref<T>;
  var navigateTo: (
    to: string | { path: string; query?: Record<string, unknown> },
  ) => Promise<unknown>;
  var defineNuxtRouteMiddleware: <T>(handler: T) => T;
  var definePageMeta: (meta: Record<string, unknown>) => void;
}

export {};
