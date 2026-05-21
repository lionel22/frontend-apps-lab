import { computed } from 'vue';
import { useMusicApi } from '~/composables/useMusicApi';
import { useNotifications } from '~/composables/useNotifications';
import type { BatchSubmissionViewModel, MusicBatchSubmissionInput } from '~/types/music';
import { MUSIC_CACHE_RESOURCE_KEYS } from '~/utils/constants';
import { useMusicStore } from '~/stores/music';

interface BatchIngestionState {
  pending: boolean;
  error: string | null;
  lastResult: BatchSubmissionViewModel | null;
  lastSubmittedAt: string | null;
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

function buildSuccessMessage(result: BatchSubmissionViewModel): string {
  const createdCount = result.createdJobIds.length;
  const failedCount = result.failedReferences.length;

  if (!failedCount) {
    return `${createdCount} job${createdCount === 1 ? '' : 's'} queued from the current shortlist.`;
  }

  return `${createdCount} job${createdCount === 1 ? '' : 's'} queued, ${failedCount} selection${failedCount === 1 ? '' : 's'} still need attention.`;
}

export function useBatchIngestion() {
  const api = useMusicApi();
  const music = useMusicStore();
  const notifications = useNotifications();
  const state = useState<BatchIngestionState>('music.discovery.batch-state', () => ({
    pending: false,
    error: null,
    lastResult: null,
    lastSubmittedAt: null,
  }));

  async function submit(input: MusicBatchSubmissionInput) {
    state.value.pending = true;
    state.value.error = null;

    try {
      const result = await api.submitBatchFromSearch(input);
      state.value.lastResult = result;
      state.value.lastSubmittedAt = new Date().toISOString();
      music.invalidateResource(MUSIC_CACHE_RESOURCE_KEYS.ingestions);

      notifications.pushNotification({
        source: 'discovery',
        title:
          result.failedReferences.length > 0
            ? 'Batch ingestion partially queued'
            : 'Batch ingestion queued',
        message: buildSuccessMessage(result),
        severity: result.failedReferences.length > 0 ? 'warning' : 'success',
      });

      return result;
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Unable to submit the current shortlist for ingestion.',
      );

      state.value.error = message;
      notifications.pushNotification({
        source: 'discovery',
        title: 'Batch ingestion failed',
        message,
        severity: 'error',
      });
      throw error;
    } finally {
      state.value.pending = false;
    }
  }

  function clearResult() {
    state.value.error = null;
    state.value.lastResult = null;
  }

  return {
    isSubmitting: computed(() => state.value.pending),
    error: computed(() => state.value.error),
    lastResult: computed(() => state.value.lastResult),
    lastSubmittedAt: computed(() => state.value.lastSubmittedAt),
    submit,
    clearResult,
  };
}
