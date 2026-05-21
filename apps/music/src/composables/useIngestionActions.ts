import { computed } from 'vue';
import { useMusicApi } from '~/composables/useMusicApi';
import { useNotifications } from '~/composables/useNotifications';
import { useMusicStore } from '~/stores/music';
import type {
  MusicSubmissionResultViewModel,
  MusicSubmissionSource,
  MusicUploadIngestionInput,
  MusicUrlIngestionInput,
} from '~/types/music';
import { MUSIC_CACHE_RESOURCE_KEYS } from '~/utils/constants';

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

function buildSuccessMessage(
  source: MusicSubmissionSource,
  result: MusicSubmissionResultViewModel,
): string {
  const createdCount = result.createdJobIds.length || result.createdJobs.length || result.acceptedCount;
  const createdLabel = createdCount === 1 ? 'job' : 'jobs';

  if (result.createdJobIds.length > 0) {
    return `${createdCount} ${createdLabel} queued. Track ${result.createdJobIds[0]} from the jobs view.`;
  }

  if (result.message) {
    return result.message;
  }

  return source === 'url'
    ? `${createdCount} ${createdLabel} queued from the submitted URL.`
    : `${createdCount} ${createdLabel} queued from the uploaded files.`;
}

export function useIngestionActions() {
  const api = useMusicApi();
  const music = useMusicStore();
  const notifications = useNotifications();

  async function runSubmission<TInput>(options: {
    source: MusicSubmissionSource;
    input: TInput;
    execute: (input: TInput) => Promise<MusicSubmissionResultViewModel>;
    successTitle: string;
    errorTitle: string;
  }) {
    music.beginIngestionSubmission(options.source);

    try {
      const result = await options.execute(options.input);
      music.completeIngestionSubmission(options.source, result);
      music.invalidateResource(MUSIC_CACHE_RESOURCE_KEYS.ingestions);

      notifications.pushNotification({
        source: 'ingestion',
        title: options.successTitle,
        message: buildSuccessMessage(options.source, result),
        severity: 'success',
      });

      return result;
    } catch (error) {
      const message = getErrorMessage(
        error,
        `Unable to submit the ${options.source} ingestion request.`,
      );

      music.failIngestionSubmission(options.source, message);
      notifications.pushNotification({
        source: 'ingestion',
        title: options.errorTitle,
        message,
        severity: 'error',
      });

      throw error;
    }
  }

  async function submitUrlIngestion(input: MusicUrlIngestionInput) {
    return runSubmission({
      source: 'url',
      input,
      execute: (payload) => api.submitUrlIngestion(payload),
      successTitle: 'URL ingestion queued',
      errorTitle: 'URL ingestion failed',
    });
  }

  async function submitUploadIngestion(input: MusicUploadIngestionInput) {
    return runSubmission({
      source: 'upload',
      input,
      execute: (payload) => api.uploadIngestion(payload),
      successTitle: 'Upload ingestion queued',
      errorTitle: 'Upload ingestion failed',
    });
  }

  return {
    ingestionWorkflow: computed(() => music.ingestionWorkflow),
    lastSubmission: computed(() => music.ingestionWorkflow.lastResult),
    lastSubmissionError: computed(() => music.ingestionWorkflow.error),
    lastSubmissionSource: computed(() => music.ingestionWorkflow.lastSource),
    isSubmitting: computed(() => music.isSubmitting),
    isSubmittingUrl: computed(() => music.isSubmittingUrl),
    isSubmittingUpload: computed(() => music.isSubmittingUpload),
    submitUrlIngestion,
    submitUploadIngestion,
    clearFeedback: music.clearIngestionFeedback,
  };
}
