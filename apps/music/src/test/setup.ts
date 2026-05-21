import { config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, vi } from 'vitest';

config.global.plugins = [];

const stateStore = new Map<string, { value: unknown }>();
const cookieStore = new Map<string, { value: unknown }>();

globalThis.useState = ((key: string, initializer: () => unknown) => {
  if (!stateStore.has(key)) {
    stateStore.set(key, { value: initializer() });
  }

  return stateStore.get(key);
}) as typeof globalThis.useState;

globalThis.useRuntimeConfig = (() => ({
  public: {
    musicApiBaseUrl: 'http://localhost:4000',
    musicPollingIntervalDefault: 15000,
    musicRequireAuth: false,
    musicAuthStorageKey: 'music.operator.session',
  },
})) as typeof globalThis.useRuntimeConfig;

globalThis.useCookie = ((key: string, options?: { default?: () => unknown }) => {
  if (!cookieStore.has(key)) {
    cookieStore.set(key, {
      value: options?.default ? options.default() : null,
    });
  }

  return cookieStore.get(key);
}) as typeof globalThis.useCookie;

globalThis.navigateTo = vi.fn(async (to: unknown) => to) as typeof globalThis.navigateTo;
globalThis.defineNuxtRouteMiddleware = ((handler: unknown) =>
  handler) as typeof globalThis.defineNuxtRouteMiddleware;
globalThis.definePageMeta = (() => undefined) as typeof globalThis.definePageMeta;

beforeEach(() => {
  stateStore.clear();
  cookieStore.clear();
  vi.clearAllMocks();
  setActivePinia(createPinia());
});
