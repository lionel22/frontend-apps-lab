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
      observability: {
        appName:
          process.env.NUXT_PUBLIC_OBSERVABILITY_APP_NAME ?? 'music-frontend',
        appVersion:
          process.env.NUXT_PUBLIC_OBSERVABILITY_APP_VERSION ??
          process.env.npm_package_version ??
          '0.0.0',
        environment:
          process.env.NUXT_PUBLIC_OBSERVABILITY_ENVIRONMENT ??
          process.env.NODE_ENV ??
          'development',
        faro: {
          enabled: process.env.NUXT_PUBLIC_FARO_ENABLED === 'true',
          url: process.env.NUXT_PUBLIC_FARO_URL ?? '',
          apiKey: process.env.NUXT_PUBLIC_FARO_API_KEY ?? '',
          sampleRate: Number(process.env.NUXT_PUBLIC_FARO_SAMPLE_RATE ?? 1),
        },
        openReplay: {
          enabled: process.env.NUXT_PUBLIC_OPENREPLAY_ENABLED === 'true',
          projectKey:
            process.env.OPEN_REPLAY_PROJECT_KEY ??
            process.env.NUXT_PUBLIC_OPENREPLAY_PROJECT_KEY ??
            '',
          ingestPoint:
            process.env.OPEN_REPLAY_PROJECT_INGESTION_URL ??
            process.env.NUXT_PUBLIC_OPENREPLAY_INGEST_POINT ??
            '',
          sampleRate: Number(
            process.env.NUXT_PUBLIC_OPENREPLAY_SAMPLE_RATE ?? 0.1,
          ),
        },
      },
    },
  },
});
