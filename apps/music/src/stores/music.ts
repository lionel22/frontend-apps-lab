import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
  buildSuggestionReferenceKey,
  type JobsListResponseViewModel,
  type MusicSubmissionResultViewModel,
  type MusicSubmissionSource,
  type SimilarSearchResponseViewModel,
  type SuggestionReference,
  type MusicIngestionStatus,
} from '~/types/music';
import {
  DEFAULT_JOBS_SUMMARY_COUNTS,
  DEFAULT_MUSIC_POLLING_INTERVAL_MS,
} from '~/utils/constants';

interface JobsState {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastLoadedAt: string | null;
}

interface IngestionWorkflowState {
  pendingSource: MusicSubmissionSource | null;
  lastSource: MusicSubmissionSource | null;
  lastResult: MusicSubmissionResultViewModel | null;
  error: string | null;
  lastSubmittedAt: string | null;
}

function createEmptyJobsSnapshot(): JobsListResponseViewModel {
  return {
    items: [],
    summaryCounts: { ...DEFAULT_JOBS_SUMMARY_COUNTS },
  };
}

function createEmptyIngestionWorkflow(): IngestionWorkflowState {
  return {
    pendingSource: null,
    lastSource: null,
    lastResult: null,
    error: null,
    lastSubmittedAt: null,
  };
}

export const useMusicStore = defineStore('music', () => {
  const jobs = ref<JobsListResponseViewModel>(createEmptyJobsSnapshot());
  const jobsState = ref<JobsState>({
    loading: false,
    refreshing: false,
    error: null,
    lastLoadedAt: null,
  });
  const ingestionWorkflow = ref<IngestionWorkflowState>(
    createEmptyIngestionWorkflow(),
  );
  const statusFilter = ref<MusicIngestionStatus | 'all'>('all');
  const polling = ref({
    enabled: true,
    intervalMs: DEFAULT_MUSIC_POLLING_INTERVAL_MS,
  });
  const cacheVersions = ref<Record<string, number>>({});
  const selectedReferenceKeys = ref<string[]>([]);
  const selectedReferenceMap = ref<Record<string, SuggestionReference>>({});
  const lastSearchResponse = ref<SimilarSearchResponseViewModel | null>(null);

  function setJobsLoading(loading: boolean) {
    jobsState.value.loading = loading;
    if (loading) {
      jobsState.value.error = null;
    }
    if (!loading) {
      jobsState.value.refreshing = false;
    }
  }

  function setJobsRefreshing(refreshing: boolean) {
    jobsState.value.refreshing = refreshing;
    if (refreshing) {
      jobsState.value.error = null;
    }
  }

  function beginJobsRequest(refreshing = false) {
    if (refreshing && jobsState.value.lastLoadedAt) {
      jobsState.value.refreshing = true;
      jobsState.value.loading = false;
    } else {
      jobsState.value.loading = true;
      jobsState.value.refreshing = false;
    }

    jobsState.value.error = null;
  }

  function setJobsSnapshot(snapshot: JobsListResponseViewModel) {
    jobs.value = snapshot;
    jobsState.value.loading = false;
    jobsState.value.refreshing = false;
    jobsState.value.error = null;
    jobsState.value.lastLoadedAt = new Date().toISOString();
  }

  function setJobsError(message: string) {
    jobsState.value.loading = false;
    jobsState.value.refreshing = false;
    jobsState.value.error = message;
  }

  function beginIngestionSubmission(source: MusicSubmissionSource) {
    ingestionWorkflow.value.pendingSource = source;
    ingestionWorkflow.value.lastSource = source;
    ingestionWorkflow.value.lastResult = null;
    ingestionWorkflow.value.error = null;
  }

  function completeIngestionSubmission(
    source: MusicSubmissionSource,
    result: MusicSubmissionResultViewModel,
  ) {
    ingestionWorkflow.value.pendingSource = null;
    ingestionWorkflow.value.lastSource = source;
    ingestionWorkflow.value.lastResult = result;
    ingestionWorkflow.value.error = null;
    ingestionWorkflow.value.lastSubmittedAt = new Date().toISOString();
  }

  function failIngestionSubmission(
    source: MusicSubmissionSource,
    message: string,
  ) {
    ingestionWorkflow.value.pendingSource = null;
    ingestionWorkflow.value.lastSource = source;
    ingestionWorkflow.value.lastResult = null;
    ingestionWorkflow.value.error = message;
    ingestionWorkflow.value.lastSubmittedAt = new Date().toISOString();
  }

  function clearIngestionFeedback() {
    ingestionWorkflow.value = createEmptyIngestionWorkflow();
  }

  function setStatusFilter(filter: MusicIngestionStatus | 'all') {
    statusFilter.value = filter;
  }

  function setPollingEnabled(enabled: boolean) {
    polling.value.enabled = enabled;
  }

  function setPollingIntervalMs(intervalMs: number) {
    polling.value.intervalMs = Math.max(intervalMs, 500);
  }

  function invalidateResource(resource: string) {
    cacheVersions.value = {
      ...cacheVersions.value,
      [resource]: Date.now(),
    };
  }

  function clearSelection() {
    selectedReferenceKeys.value = [];
    selectedReferenceMap.value = {};
  }

  function replaceSelection(references: SuggestionReference[]) {
    const nextMap: Record<string, SuggestionReference> = {};
    const nextKeys: string[] = [];

    for (const reference of references) {
      const key = buildSuggestionReferenceKey(reference);
      nextMap[key] = reference;
      nextKeys.push(key);
    }

    selectedReferenceMap.value = nextMap;
    selectedReferenceKeys.value = nextKeys;
  }

  function toggleSelectedReference(reference: SuggestionReference) {
    const key = buildSuggestionReferenceKey(reference);
    const currentKeys = new Set(selectedReferenceKeys.value);

    if (currentKeys.has(key)) {
      currentKeys.delete(key);
      const nextMap = { ...selectedReferenceMap.value };
      delete nextMap[key];
      selectedReferenceMap.value = nextMap;
    } else {
      currentKeys.add(key);
      selectedReferenceMap.value = {
        ...selectedReferenceMap.value,
        [key]: reference,
      };
    }

    selectedReferenceKeys.value = Array.from(currentKeys);
  }

  function setLastSearchResponse(response: SimilarSearchResponseViewModel | null) {
    lastSearchResponse.value = response;
  }

  const selectedReferences = computed(() =>
    selectedReferenceKeys.value
      .map((key) => selectedReferenceMap.value[key])
      .filter((reference): reference is SuggestionReference => Boolean(reference)),
  );

  const hasSelection = computed(() => selectedReferenceKeys.value.length > 0);
  const isSubmitting = computed(() => ingestionWorkflow.value.pendingSource !== null);
  const isSubmittingUrl = computed(
    () => ingestionWorkflow.value.pendingSource === 'url',
  );
  const isSubmittingUpload = computed(
    () => ingestionWorkflow.value.pendingSource === 'upload',
  );

  return {
    jobs,
    jobsState,
    ingestionWorkflow,
    statusFilter,
    polling,
    cacheVersions,
    selectedReferenceKeys,
    selectedReferences,
    hasSelection,
    lastSearchResponse,
    setJobsLoading,
    setJobsRefreshing,
    beginJobsRequest,
    setJobsSnapshot,
    setJobsError,
    beginIngestionSubmission,
    completeIngestionSubmission,
    failIngestionSubmission,
    clearIngestionFeedback,
    setStatusFilter,
    setPollingEnabled,
    setPollingIntervalMs,
    invalidateResource,
    clearSelection,
    replaceSelection,
    toggleSelectedReference,
    setLastSearchResponse,
    isSubmitting,
    isSubmittingUrl,
    isSubmittingUpload,
  };
});
