import { computed } from 'vue';
import { useSession } from '~/composables/useSession';
import { useUiStore } from '~/stores/ui';
import type {
  AutocompleteSuggestionViewModel,
  BatchSubmissionFailureViewModel,
  BatchSubmissionViewModel,
  IngestionJobViewModel,
  JobsListResponseViewModel,
  JobsSummaryCounts,
  MusicAutocompleteInput,
  MusicBatchSubmissionInput,
  MusicDiscoveryMode,
  MusicJobsQuery,
  MusicOrganizationInput,
  MusicSubmissionResultViewModel,
  MusicSimilarSearchInput,
  MusicUploadIngestionInput,
  MusicUrlIngestionInput,
  OrganizationApplyViewModel,
  OrganizationDryRunViewModel,
  OrganizationItemErrorViewModel,
  OrganizationMoveViewModel,
  OrganizationSkippedItemViewModel,
  OrganizationSummaryViewModel,
  SimilarResultViewModel,
  SimilarSearchResponseViewModel,
  SuggestionReference,
} from '~/types/music';
import { createApiClient } from '~/utils/api-client';
import {
  DEFAULT_JOBS_SUMMARY_COUNTS,
  MUSIC_API_ENDPOINTS,
} from '~/utils/constants';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function coerceArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
}

function pickArray(record: UnknownRecord | null, keys: string[]): unknown[] {
  if (!record) {
    return [];
  }

  for (const key of keys) {
    if (key in record) {
      const value = coerceArray(record[key]);
      if (value.length > 0) {
        return value;
      }
    }
  }

  return [];
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toNumberValue(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeStatus(value: unknown): IngestionJobViewModel['status'] {
  const normalized = toStringValue(value)?.toLowerCase();
  if (!normalized) {
    return 'queued';
  }

  if (['processing', 'running', 'in-progress', 'in_progress'].includes(normalized)) {
    return 'processing';
  }

  if (['success', 'succeeded', 'completed', 'done'].includes(normalized)) {
    return 'success';
  }

  if (['failed', 'error', 'errored'].includes(normalized)) {
    return 'failed';
  }

  return 'queued';
}

function normalizeSuggestionReference(value: unknown): SuggestionReference {
  const record = asRecord(value) ?? {};
  const title =
    toStringValue(record.title) ??
    toStringValue(record.trackTitle) ??
    toStringValue(record.name) ??
    'Unknown title';
  const artist =
    toStringValue(record.artist) ??
    toStringValue(record.artistName) ??
    toStringValue(record.band);
  const provider =
    toStringValue(record.provider) ??
    toStringValue(record.providerUsed) ??
    toStringValue(record.source) ??
    'catalog';
  const label =
    toStringValue(record.label) ??
    toStringValue(record.displayLabel) ??
    [title, artist].filter(Boolean).join(' - ');

  return {
    provider,
    externalId:
      toStringValue(record.externalId) ??
      toStringValue(record.id) ??
      toStringValue(record.trackId),
    title,
    artist,
    label,
    resolvedUrl:
      toStringValue(record.resolvedUrl) ?? toStringValue(record.url),
  };
}

function normalizeJob(value: unknown): IngestionJobViewModel {
  const record = asRecord(value) ?? {};
  const id =
    toStringValue(record.id) ??
    toStringValue(record.jobId) ??
    toStringValue(record.ingestionId) ??
    'unknown-job';
  const updatedAt =
    toStringValue(record.updatedAt) ??
    toStringValue(record.lastUpdatedAt) ??
    toStringValue(record.createdAt) ??
    new Date().toISOString();

  return {
    id,
    sourceLabel:
      toStringValue(record.sourceLabel) ??
      toStringValue(record.source) ??
      toStringValue(record.url) ??
      toStringValue(record.fileName) ??
      'Unknown source',
    status: normalizeStatus(record.status),
    updatedAt,
    createdAt: toStringValue(record.createdAt),
    errorMessage:
      toStringValue(record.errorMessage) ??
      toStringValue(record.error) ??
      toStringValue(record.failureReason),
    sourceType:
      toStringValue(record.sourceType) ??
      toStringValue(record.type),
  };
}

function deriveSummaryCountsFromItems(
  items: IngestionJobViewModel[],
): JobsSummaryCounts {
  const counts = { ...DEFAULT_JOBS_SUMMARY_COUNTS };

  for (const item of items) {
    counts[item.status] += 1;
  }

  counts.active = counts.queued + counts.processing;
  counts.recentFailures = counts.failed;
  return counts;
}

function normalizeSummaryCounts(
  value: unknown,
  items: IngestionJobViewModel[],
): JobsSummaryCounts {
  const fallback = deriveSummaryCountsFromItems(items);
  const record = asRecord(value);
  if (!record) {
    return fallback;
  }

  return {
    queued: toNumberValue(record.queued) ?? fallback.queued,
    processing: toNumberValue(record.processing) ?? fallback.processing,
    success: toNumberValue(record.success) ?? fallback.success,
    failed: toNumberValue(record.failed) ?? fallback.failed,
    active: toNumberValue(record.active) ?? fallback.active,
    recentFailures:
      toNumberValue(record.recentFailures) ?? fallback.recentFailures,
  };
}

function normalizeJobsListResponse(value: unknown): JobsListResponseViewModel {
  const record = asRecord(value);
  const items = pickArray(record, ['items', 'jobs', 'data']).map(normalizeJob);

  return {
    items,
    summaryCounts: normalizeSummaryCounts(
      record?.summaryCounts ?? record?.summary ?? record?.counts,
      items,
    ),
    nextCursor:
      toStringValue(record?.nextCursor) ?? toStringValue(record?.cursor),
  };
}

function normalizeSubmissionResponse(value: unknown): MusicSubmissionResultViewModel {
  const record = asRecord(value);
  const createdJobs = pickArray(record, ['createdJobs', 'jobs', 'items']).map(
    normalizeJob,
  );
  const createdJobIds = pickArray(record, ['createdJobIds', 'jobIds', 'ids'])
    .map((entry) => toStringValue(entry))
    .filter((entry): entry is string => Boolean(entry));
  const fallbackId =
    toStringValue(record?.jobId) ??
    toStringValue(record?.id) ??
    createdJobs[0]?.id;

  return {
    createdJobs,
    createdJobIds:
      createdJobIds.length > 0
        ? createdJobIds
        : fallbackId
          ? [fallbackId]
          : createdJobs.map((job) => job.id),
    acceptedCount:
      toNumberValue(record?.acceptedCount) ??
      (createdJobs.length || createdJobIds.length || (fallbackId ? 1 : 0)),
    message: toStringValue(record?.message),
  };
}

function normalizeAutocompleteSuggestion(
  value: unknown,
): AutocompleteSuggestionViewModel {
  const record = asRecord(value) ?? {};
  const title =
    toStringValue(record.title) ??
    toStringValue(record.label) ??
    toStringValue(record.name) ??
    'Unknown title';
  const artist = toStringValue(record.artist) ?? toStringValue(record.artistName);
  const suggestionRef =
    toStringValue(record.suggestionRef) ??
    toStringValue(record.externalId) ??
    toStringValue(record.id);
  const provider =
    toStringValue(record.provider) ??
    toStringValue(record.providerUsed) ??
    parseProviderFromReference(suggestionRef) ??
    'catalog';
  const label =
    toStringValue(record.label) ?? [title, artist].filter(Boolean).join(' - ');
  const reference: SuggestionReference = {
    provider,
    externalId: suggestionRef,
    title,
    artist,
    label,
    resolvedUrl:
      toStringValue(record.resolvedUrl) ??
      toStringValue(record.ingestibleUrl) ??
      toStringValue(record.url),
  };

  return {
    reference,
    title,
    artist,
    sourceLabel:
      toStringValue(record.sourceLabel) ??
      toStringValue(record.source) ??
      reference.label,
    provider,
    resolvedUrl:
      toStringValue(record.resolvedUrl) ?? reference.resolvedUrl,
  };
}

function normalizeSimilarResult(
  value: unknown,
  fallbackProvider: string,
): SimilarResultViewModel {
  const record = asRecord(value) ?? {};
  const title =
    toStringValue(record.title) ??
    toStringValue(record.trackTitle) ??
    toStringValue(record.name) ??
    'Unknown title';
  const artist =
    toStringValue(record.artist) ??
    toStringValue(record.artistName) ??
    toStringValue(record.band);
  const providerUsed =
    toStringValue(record.providerUsed) ??
    toStringValue(record.provider) ??
    fallbackProvider;
  const reference =
    record.reference && asRecord(record.reference)
      ? normalizeSuggestionReference(record.reference)
      : {
          provider: providerUsed,
          externalId:
            toStringValue(record.id) ??
            toStringValue(record.providerResultId) ??
            toStringValue(record.trackId),
          title,
          artist,
          label: [title, artist].filter(Boolean).join(' - '),
          resolvedUrl:
            toStringValue(record.resolvedUrl) ??
            toStringValue(record.ingestibleUrl) ??
            toStringValue(record.url),
        };

  return {
    reference,
    title,
    artist,
    providerUsed,
    confidence: toNumberValue(record.confidence) ?? toNumberValue(record.score),
    resolvedUrl:
      toStringValue(record.resolvedUrl) ?? reference.resolvedUrl,
    sourceLabel:
      toStringValue(record.sourceLabel) ?? reference.label,
  };
}

function normalizeSimilarResponse(value: unknown): SimilarSearchResponseViewModel {
  const record = asRecord(value);
  const providerUsed =
    toStringValue(record?.providerUsed) ??
    toStringValue(record?.provider) ??
    'catalog';

  return {
    searchId:
      toStringValue(record?.searchId) ??
      toStringValue(record?.searchQueryId) ??
      toStringValue(record?.queryId),
    providerUsed,
    items: pickArray(record, ['items', 'results', 'candidates']).map((entry) =>
      normalizeSimilarResult(entry, providerUsed),
    ),
  };
}

function normalizeFailureReference(
  entry: unknown,
  fallback: SuggestionReference,
): BatchSubmissionFailureViewModel {
  const record = asRecord(entry);
  return {
    reference:
      record && record.reference
        ? normalizeSuggestionReference(record.reference)
        : fallback,
    reason:
      toStringValue(record?.reason) ??
      toStringValue(record?.message) ??
      'Batch ingestion failed for this selection.',
  };
}

function normalizeBatchResponse(
  value: unknown,
  references: SuggestionReference[],
): BatchSubmissionViewModel {
  const record = asRecord(value);
  const jobs = pickArray(record, ['jobs', 'createdJobs', 'items']).map(normalizeJob);
  const createdJobIds = pickArray(record, ['createdJobIds', 'jobIds', 'ids'])
    .map((entry) => toStringValue(entry))
    .filter((entry): entry is string => Boolean(entry));
  const failedEntries = pickArray(record, ['failedReferences', 'failures', 'errors']);
  const failedReferences = failedEntries.map((entry, index) =>
    normalizeFailureReference(entry, references[index] ?? references[0]),
  );

  return {
    searchId:
      toStringValue(record?.searchId) ??
      toStringValue(record?.searchQueryId) ??
      toStringValue(record?.batchId),
    selectedReferences: references,
    createdJobIds:
      createdJobIds.length > 0 ? createdJobIds : jobs.map((job) => job.id),
    failedReferences,
  };
}

function parseProviderFromReference(value: string | undefined): string | undefined {
  const normalized = toStringValue(value);
  if (!normalized) {
    return undefined;
  }

  const [provider] = normalized.split(':', 1);
  return provider ? provider.toLowerCase() : undefined;
}

function normalizeMoveList(value: unknown): OrganizationMoveViewModel[] {
  return coerceArray(value).map((entry) => {
    const record = asRecord(entry) ?? {};
    return {
      fromPath:
        toStringValue(record.fromPath) ??
        toStringValue(record.from) ??
        'Unknown source',
      toPath:
        toStringValue(record.toPath) ?? toStringValue(record.to) ?? 'Unknown target',
    };
  });
}

function normalizeSkippedList(value: unknown): OrganizationSkippedItemViewModel[] {
  return coerceArray(value).map((entry) => {
    const record = asRecord(entry) ?? {};
    return {
      path:
        toStringValue(record.path) ??
        toStringValue(record.fromPath) ??
        'Unknown path',
      reason:
        toStringValue(record.reason) ??
        toStringValue(record.message) ??
        'No reason provided',
    };
  });
}

function normalizeItemErrors(value: unknown): OrganizationItemErrorViewModel[] {
  return coerceArray(value).map((entry) => {
    const record = asRecord(entry) ?? {};
    return {
      path:
        toStringValue(record.path) ??
        toStringValue(record.fromPath) ??
        'Unknown path',
      reason:
        toStringValue(record.reason) ??
        toStringValue(record.message) ??
        'Unknown organization error',
    };
  });
}

function normalizeOrganizationSummary(
  value: unknown,
  plannedMoves: OrganizationMoveViewModel[],
  skippedConflicts: OrganizationSkippedItemViewModel[],
  ignoredItems: OrganizationSkippedItemViewModel[],
  itemErrors: OrganizationItemErrorViewModel[],
  appliedMoves: OrganizationMoveViewModel[],
): OrganizationSummaryViewModel {
  const record = asRecord(value);
  return {
    plannedMoveCount:
      toNumberValue(record?.plannedMoveCount) ?? plannedMoves.length,
    appliedMoveCount:
      toNumberValue(record?.appliedMoveCount) ?? appliedMoves.length,
    conflictCount: toNumberValue(record?.conflictCount) ?? skippedConflicts.length,
    ignoredCount: toNumberValue(record?.ignoredCount) ?? ignoredItems.length,
    errorCount: toNumberValue(record?.errorCount) ?? itemErrors.length,
  };
}

function normalizeOrganizationDryRun(value: unknown): OrganizationDryRunViewModel {
  const record = asRecord(value);
  const plannedMoves = normalizeMoveList(record?.plannedMoves);
  const skippedConflicts = normalizeSkippedList(record?.skippedConflicts);
  const ignoredItems = normalizeSkippedList(record?.ignoredItems);

  return {
    summary: normalizeOrganizationSummary(
      record?.summary,
      plannedMoves,
      skippedConflicts,
      ignoredItems,
      [],
      [],
    ),
    plannedMoves,
    skippedConflicts,
    ignoredItems,
  };
}

function normalizeOrganizationApply(value: unknown): OrganizationApplyViewModel {
  const record = asRecord(value);
  const plannedMoves = normalizeMoveList(record?.plannedMoves);
  const skippedConflicts = normalizeSkippedList(record?.skippedConflicts);
  const ignoredItems = normalizeSkippedList(record?.ignoredItems);
  const appliedMoves = normalizeMoveList(record?.appliedMoves);
  const itemErrors = normalizeItemErrors(
    record?.itemErrors ?? record?.errors ?? record?.failedItems,
  );

  return {
    organizationRunId:
      toStringValue(record?.organizationRunId) ?? 'organization-run',
    summary: normalizeOrganizationSummary(
      record?.summary,
      plannedMoves,
      skippedConflicts,
      ignoredItems,
      itemErrors,
      appliedMoves,
    ),
    plannedMoves,
    skippedConflicts,
    ignoredItems,
    appliedMoves,
    itemErrors,
  };
}

function normalizeMode(mode: MusicDiscoveryMode): string {
  return mode.toLowerCase();
}

export function useMusicApi() {
  const runtimeConfig = useRuntimeConfig();
  const session = useSession();
  const ui = useUiStore();

  const baseUrl = computed(() => {
    const configured = runtimeConfig.public.musicApiBaseUrl;
    return typeof configured === 'string' ? configured.trim() : '';
  });

  const client = computed(() =>
    createApiClient({
      baseUrl: baseUrl.value,
      serviceLabel: 'Music API',
      getToken: () => session.token.value,
      onUnauthorized: () => {
        session.markUnauthorized();
        ui.addAlert({
          type: 'warning',
          message:
            'Shared operator token rejected. Re-enter the session token to continue music API actions.',
          duration: 0,
        });
      },
    }),
  );

  async function submitUrlIngestion(
    input: MusicUrlIngestionInput,
  ): Promise<MusicSubmissionResultViewModel> {
    const payload = await client.value.request<unknown>(
      MUSIC_API_ENDPOINTS.ingestions,
      {
        method: 'POST',
        body: {
          sourceUrl: input.url,
          sourceLabel: input.label,
        },
      },
    );

    return normalizeSubmissionResponse(payload);
  }

  async function uploadIngestion(
    input: MusicUploadIngestionInput,
  ): Promise<MusicSubmissionResultViewModel> {
    const formData = new FormData();
    for (const file of input.files) {
      formData.append('files', file);
    }
    if (input.sourceLabel) {
      formData.append('sourceLabel', input.sourceLabel);
    }

    const payload = await client.value.request<unknown>(
      MUSIC_API_ENDPOINTS.uploadIngestion,
      {
        method: 'POST',
        body: formData,
      },
    );

    return normalizeSubmissionResponse(payload);
  }

  async function fetchIngestions(
    query: MusicJobsQuery = {},
  ): Promise<JobsListResponseViewModel> {
    const payload = await client.value.request<unknown>(
      MUSIC_API_ENDPOINTS.ingestions,
      {
        query: {
          status: query.status === 'all' ? undefined : query.status,
          limit: query.limit,
          cursor: query.cursor,
        },
      },
    );

    return normalizeJobsListResponse(payload);
  }

  async function fetchIngestion(id: string): Promise<IngestionJobViewModel> {
    const payload = await client.value.request<unknown>(
      MUSIC_API_ENDPOINTS.ingestionDetail(id),
    );

    return normalizeJob(payload);
  }

  async function fetchTitleAutocomplete(
    input: MusicAutocompleteInput,
  ): Promise<AutocompleteSuggestionViewModel[]> {
    const payload = await client.value.request<unknown>(
      MUSIC_API_ENDPOINTS.titleAutocomplete,
      {
        query: {
          q: input.query,
          limit: input.limit,
        },
      },
    );

    const record = asRecord(payload);
    const items = pickArray(record, ['items', 'suggestions', 'results']);
    return items.map(normalizeAutocompleteSuggestion);
  }

  async function searchSimilar(
    input: MusicSimilarSearchInput,
  ): Promise<SimilarSearchResponseViewModel> {
    const referenceLabel =
      input.reference.title?.trim() || input.reference.label.trim();
    const payload = await client.value.request<unknown>(
      MUSIC_API_ENDPOINTS.similarSearch,
      {
        method: 'POST',
        body: {
          reference: referenceLabel,
          suggestionRef: input.reference.externalId,
          mode: normalizeMode(input.mode),
          limit: input.limit,
        },
      },
    );

    return normalizeSimilarResponse(payload);
  }

  async function submitBatchFromSearch(
    input: MusicBatchSubmissionInput,
  ): Promise<BatchSubmissionViewModel> {
    const searchQueryId = input.searchId?.trim();
    if (!searchQueryId) {
      throw new Error('Missing search identifier for batch ingestion.');
    }

    const resultIds = input.references
      .map((reference) => reference.externalId?.trim())
      .filter((reference): reference is string => Boolean(reference));

    if (resultIds.length !== input.references.length) {
      throw new Error('Each selected result must include a backend result identifier.');
    }

    const payload = await client.value.request<unknown>(
      MUSIC_API_ENDPOINTS.batchFromSearch,
      {
        method: 'POST',
        body: {
          searchQueryId,
          resultIds,
        },
      },
    );

    return normalizeBatchResponse(payload, input.references);
  }

  async function organize(
    input: MusicOrganizationInput,
  ): Promise<OrganizationDryRunViewModel | OrganizationApplyViewModel> {
    const payload = await client.value.request<unknown>(
      MUSIC_API_ENDPOINTS.organize,
      {
        method: 'POST',
        body: {
          dryRun: input.dryRun,
          rules: input.rules,
          targetPath: input.targetPath,
        },
      },
    );

    return input.dryRun
      ? normalizeOrganizationDryRun(payload)
      : normalizeOrganizationApply(payload);
  }

  return {
    baseUrl,
    isConfigured: computed(() => baseUrl.value.length > 0),
    submitUrlIngestion,
    uploadIngestion,
    fetchIngestions,
    fetchIngestion,
    fetchTitleAutocomplete,
    searchSimilar,
    submitBatchFromSearch,
    organize,
  };
}
