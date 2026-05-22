import { computed, watch } from 'vue';
import { useMusicApi } from '~/composables/useMusicApi';
import { usePolling } from '~/composables/usePolling';
import { useSession } from '~/composables/useSession';
import { useMusicStore } from '~/stores/music';
import type { MusicIngestionStatus } from '~/types/music';
import {
  MUSIC_CACHE_RESOURCE_KEYS,
  MUSIC_JOBS_PREFERENCE_STORAGE_KEYS,
} from '~/utils/constants';

const JOBS_PAGE_LIMIT = 50;

function isStoredStatus(value: unknown): value is MusicIngestionStatus | 'all' {
  return value === 'all' || value === 'queued' || value === 'processing' || value === 'success' || value === 'failed';
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message?: unknown }).message
      : undefined;

  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  return fallback;
}

function readStoredPreference(key: string): unknown {
  if (!process.client) {
    return null;
  }

  const rawValue = localStorage.getItem(key);
  if (rawValue === null) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

function persistPreference(key: string, value: unknown) {
  if (!process.client) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export function useJobPolling(options: {
  initialStatus?: MusicIngestionStatus | 'all';
  limit?: number;
} = {}) {
  const api = useMusicApi();
  const music = useMusicStore();
  const session = useSession();
  const limit = options.limit ?? JOBS_PAGE_LIMIT;

  const storedStatus = readStoredPreference(
    MUSIC_JOBS_PREFERENCE_STORAGE_KEYS.statusFilter,
  );
  const storedAutoRefreshEnabled = readStoredPreference(
    MUSIC_JOBS_PREFERENCE_STORAGE_KEYS.autoRefreshEnabled,
  );

  music.setStatusFilter(
    options.initialStatus ??
      (isStoredStatus(storedStatus) ? storedStatus : music.statusFilter),
  );

  if (typeof storedAutoRefreshEnabled === 'boolean') {
    music.setPollingEnabled(storedAutoRefreshEnabled);
  }

  const canLoadJobs = computed(
    () => !session.requireAuth.value || session.isAuthenticated.value,
  );

  async function refresh(options: { manual?: boolean } = {}) {
    if (!canLoadJobs.value) {
      return music.jobs;
    }

    const shouldUseRefreshingState =
      Boolean(music.jobsState.lastLoadedAt) || music.jobs.items.length > 0;

    music.beginJobsRequest(shouldUseRefreshingState);

    try {
      const snapshot = await api.fetchIngestions({
        status: music.statusFilter,
        limit,
      });

      music.setJobsSnapshot(snapshot);
      return snapshot;
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Unable to load ingestion jobs right now.',
      );
      music.setJobsError(message);

      if (options.manual) {
        throw error;
      }

      throw error;
    }
  }

  const shouldPausePolling = computed(
    () => !music.polling.enabled || !canLoadJobs.value,
  );

  usePolling(
    async () => {
      await refresh();
    },
    {
      interval: music.polling.intervalMs,
      paused: shouldPausePolling,
    },
  );

  watch(
    () => music.statusFilter,
    () => {
      persistPreference(
        MUSIC_JOBS_PREFERENCE_STORAGE_KEYS.statusFilter,
        music.statusFilter,
      );
      void refresh({ manual: true }).catch(() => undefined);
    },
  );

  watch(
    () => music.polling.enabled,
    (enabled) => {
      persistPreference(
        MUSIC_JOBS_PREFERENCE_STORAGE_KEYS.autoRefreshEnabled,
        enabled,
      );
    },
  );

  watch(
    () => music.cacheVersions[MUSIC_CACHE_RESOURCE_KEYS.ingestions] ?? 0,
    (currentVersion, previousVersion) => {
      if (currentVersion === previousVersion || currentVersion === 0) {
        return;
      }

      void refresh().catch(() => undefined);
    },
  );

  return {
    jobs: computed(() => music.jobs),
    jobsState: computed(() => music.jobsState),
    statusFilter: computed(() => music.statusFilter),
    polling: computed(() => music.polling),
    setStatusFilter: music.setStatusFilter,
    setAutoRefreshEnabled: music.setPollingEnabled,
    refresh,
  };
}
