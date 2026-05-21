export type MusicIngestionStatus =
  | 'queued'
  | 'processing'
  | 'success'
  | 'failed';

export type MusicSubmissionSource = 'url' | 'upload';

export type MusicDiscoveryMode = 'llm' | 'catalog';

export interface SuggestionReference {
  provider: string;
  externalId?: string;
  title: string;
  artist?: string;
  label: string;
  resolvedUrl?: string;
}

export interface IngestionJobViewModel {
  id: string;
  sourceLabel: string;
  status: MusicIngestionStatus;
  updatedAt: string;
  createdAt?: string;
  errorMessage?: string;
  sourceType?: string;
}

export interface JobsSummaryCounts {
  queued: number;
  processing: number;
  success: number;
  failed: number;
  active: number;
  recentFailures: number;
}

export interface JobsListResponseViewModel {
  items: IngestionJobViewModel[];
  summaryCounts: JobsSummaryCounts;
  nextCursor?: string;
}

export interface MusicSubmissionResultViewModel {
  createdJobs: IngestionJobViewModel[];
  createdJobIds: string[];
  acceptedCount: number;
  message?: string;
}

export interface AutocompleteSuggestionViewModel {
  reference: SuggestionReference;
  title: string;
  artist?: string;
  sourceLabel: string;
  provider: string;
  resolvedUrl?: string;
}

export interface SimilarResultViewModel {
  reference: SuggestionReference;
  title: string;
  artist?: string;
  providerUsed: string;
  confidence?: number;
  resolvedUrl?: string;
  sourceLabel?: string;
}

export interface SimilarSearchResponseViewModel {
  searchId?: string;
  providerUsed: string;
  items: SimilarResultViewModel[];
}

export interface BatchSubmissionFailureViewModel {
  reference: SuggestionReference;
  reason: string;
}

export interface BatchSubmissionViewModel {
  searchId?: string;
  selectedReferences: SuggestionReference[];
  createdJobIds: string[];
  failedReferences: BatchSubmissionFailureViewModel[];
}

export interface OrganizationSummaryViewModel {
  plannedMoveCount: number;
  appliedMoveCount: number;
  conflictCount: number;
  ignoredCount: number;
  errorCount: number;
}

export interface OrganizationMoveViewModel {
  fromPath: string;
  toPath: string;
}

export interface OrganizationSkippedItemViewModel {
  path: string;
  reason: string;
}

export interface OrganizationItemErrorViewModel {
  path: string;
  reason: string;
}

export interface OrganizationDryRunViewModel {
  summary: OrganizationSummaryViewModel;
  plannedMoves: OrganizationMoveViewModel[];
  skippedConflicts: OrganizationSkippedItemViewModel[];
  ignoredItems: OrganizationSkippedItemViewModel[];
}

export interface OrganizationApplyViewModel extends OrganizationDryRunViewModel {
  organizationRunId: string;
  appliedMoves: OrganizationMoveViewModel[];
  itemErrors: OrganizationItemErrorViewModel[];
}

export interface MusicUrlIngestionInput {
  url: string;
  label?: string;
}

export interface MusicUploadIngestionInput {
  files: File[];
  sourceLabel?: string;
}

export interface MusicJobsQuery {
  status?: MusicIngestionStatus | 'all';
  limit?: number;
  cursor?: string;
}

export interface MusicAutocompleteInput {
  query: string;
  limit?: number;
}

export interface MusicSimilarSearchInput {
  reference: SuggestionReference;
  mode: MusicDiscoveryMode;
  limit?: number;
}

export interface MusicBatchSubmissionInput {
  searchId?: string;
  references: SuggestionReference[];
}

export interface MusicOrganizationInput {
  dryRun: boolean;
  rules: Record<string, unknown>;
  targetPath?: string;
}

export function buildSuggestionReferenceKey(
  reference: SuggestionReference,
): string {
  return [
    reference.provider.trim().toLowerCase(),
    reference.externalId?.trim().toLowerCase() ?? '',
    reference.title.trim().toLowerCase(),
    reference.artist?.trim().toLowerCase() ?? '',
  ].join('::');
}
