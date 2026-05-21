import { defineNuxtConfig } from 'nuxt/config';

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
      musicApiBaseUrl: process.env.NUXT_PUBLIC_MUSIC_API_URL ?? '',
      musicPollingIntervalDefault: Number(
        process.env.NUXT_PUBLIC_MUSIC_POLLING_INTERVAL_DEFAULT ?? 15000,
      ),
      musicRequireAuth:
        process.env.NUXT_PUBLIC_MUSIC_REQUIRE_AUTH === 'true',
      musicAuthStorageKey:
        process.env.NUXT_PUBLIC_MUSIC_AUTH_STORAGE_KEY ??
        'music.operator.session',
    },
  },
});
