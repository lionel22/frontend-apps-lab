import { defineNuxtConfig } from 'nuxt/config';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'src/',
  modules: ['@pinia/nuxt'],
  css: ['vuetify/styles', '~/assets/global.css'],
  build: {
    transpile: ['vuetify'],
  },
  vite: {
    ssr: {
      noExternal: ['vuetify'],
    },
  },
  runtimeConfig: {
    public: {
      traderApiBaseUrl:
        process.env.NUXT_PUBLIC_TRADER_API_BASE_URL ??
        process.env.NUXT_PUBLIC_API_URL ??
        '',
      traderPollingIntervalDefault: Number(
        process.env.NUXT_PUBLIC_POLLING_INTERVAL_DEFAULT ?? 30000,
      ),
      traderPollingIntervalPositions: Number(
        process.env.NUXT_PUBLIC_POLLING_INTERVAL_POSITIONS ?? 5000,
      ),
      traderPollingIntervalTrades: Number(
        process.env.NUXT_PUBLIC_POLLING_INTERVAL_TRADES ?? 10000,
      ),
      traderAuthToken: process.env.NUXT_PUBLIC_TRADER_AUTH_TOKEN ?? '',
      traderRequireAuth:
        process.env.NUXT_PUBLIC_TRADER_REQUIRE_AUTH === 'true',
    },
  },
});
