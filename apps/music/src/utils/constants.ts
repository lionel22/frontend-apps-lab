import type { JobsSummaryCounts } from '~/types/music';

const encodePathSegment = (value: string): string => encodeURIComponent(value);

export const MUSIC_API_ENDPOINTS = {
  ingestions: '/api/v1/music/ingestions',
  ingestionDetail: (id: string): string =>
    `/api/v1/music/ingestions/${encodePathSegment(id)}`,
  uploadIngestion: '/api/v1/music/ingestions/upload',
  batchFromSearch: '/api/v1/music/ingestions/batch-from-search',
  titleAutocomplete: '/api/v1/music/search/titles/autocomplete',
  similarSearch: '/api/v1/music/search/similar',
  organize: '/api/v1/music/organize',
} as const;

export const MUSIC_NAV_ITEMS = [
  { title: 'Dashboard', to: '/' },
  { title: 'Ingestion', to: '/ingestion' },
  { title: 'Jobs', to: '/jobs' },
  { title: 'Discovery', to: '/discovery' },
  { title: 'Organize', to: '/organize' },
] as const;

export const DEFAULT_MUSIC_POLLING_INTERVAL_MS = 15000;

export const DEFAULT_JOBS_SUMMARY_COUNTS: JobsSummaryCounts = {
  queued: 0,
  processing: 0,
  success: 0,
  failed: 0,
  active: 0,
  recentFailures: 0,
};

export const DEFAULT_MUSIC_UPLOAD_LIMIT_MB = 100;

export const MUSIC_AUTOCOMPLETE_MIN_QUERY_LENGTH = 3;

export const MUSIC_AUTOCOMPLETE_DEBOUNCE_MS = 250;

export const MUSIC_AUTOCOMPLETE_LIMIT = 8;

export const MUSIC_SIMILAR_RESULT_LIMIT = 12;

export const MUSIC_CACHE_RESOURCE_KEYS = {
  ingestions: 'music.ingestions',
} as const;

export const MUSIC_JOBS_PREFERENCE_STORAGE_KEYS = {
  statusFilter: 'music.jobs.status-filter',
  autoRefreshEnabled: 'music.jobs.auto-refresh-enabled',
} as const;

export const MUSIC_ACCEPTED_UPLOAD_EXTENSIONS = [
  '.mp3',
  '.flac',
  '.wav',
  '.m4a',
  '.aac',
  '.ogg',
] as const;

export const MUSIC_NOTIFICATION_LIMIT = 50;

export const MUSIC_STATUS_OPTIONS = [
  'queued',
  'processing',
  'success',
  'failed',
] as const;
