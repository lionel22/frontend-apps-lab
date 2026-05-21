import type { MusicDiscoveryMode, MusicIngestionStatus } from '~/types/music';

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeTime(value?: string | null): string {
  if (!value) {
    return 'Pending';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSeconds) < 60) {
    return formatter.format(diffSeconds, 'second');
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
}

export function formatStatusLabel(status: MusicIngestionStatus): string {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'processing':
      return 'Processing';
    case 'success':
      return 'Success';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

export function formatProviderLabel(provider?: string | null): string {
  if (!provider) {
    return 'Unknown provider';
  }

  return provider
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function formatDiscoveryMode(mode: MusicDiscoveryMode): string {
  return mode === 'llm' ? 'LLM' : 'Catalog';
}

export function formatConfidence(value?: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'No score';
  }

  return `${Math.round(value * 100)}% match`;
}

export function formatUploadLimit(limitMb: number): string {
  return `${limitMb} MB`;
}
