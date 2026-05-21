import { computed } from 'vue';
import { useMusicApi } from '~/composables/useMusicApi';
import { useMusicStore } from '~/stores/music';
import type {
  MusicDiscoveryMode,
  MusicSimilarSearchInput,
  SimilarSearchResponseViewModel,
  SuggestionReference,
} from '~/types/music';
import type { ApiError } from '~/types/api';

type SimilarDiscoveryErrorKind = 'provider-unavailable' | 'request' | null;

interface SimilarDiscoveryState {
  loading: boolean;
  error: string | null;
  errorKind: SimilarDiscoveryErrorKind;
  lastInput: MusicSimilarSearchInput | null;
  lastCompletedAt: string | null;
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

function classifyErrorKind(error: unknown): SimilarDiscoveryErrorKind {
  if (!error || typeof error !== 'object') {
    return 'request';
  }

  const apiError = error as Partial<ApiError>;
  const normalizedMessage =
    typeof apiError.message === 'string'
      ? apiError.message.trim().toLowerCase()
      : '';

  if (
    apiError.code === 'RATE_LIMITED' ||
    apiError.status === 429 ||
    apiError.status === 502 ||
    apiError.status === 503 ||
    apiError.status === 504 ||
    normalizedMessage.includes('provider')
  ) {
    return 'provider-unavailable';
  }

  return 'request';
}

export function useSimilarDiscovery() {
  const api = useMusicApi();
  const music = useMusicStore();
  const state = useState<SimilarDiscoveryState>('music.discovery.similar-state', () => ({
    loading: false,
    error: null,
    errorKind: null,
    lastInput: null,
    lastCompletedAt: null,
  }));

  async function search(input: MusicSimilarSearchInput): Promise<SimilarSearchResponseViewModel> {
    state.value.loading = true;
    state.value.error = null;
    state.value.errorKind = null;
    state.value.lastInput = {
      mode: input.mode,
      reference: { ...input.reference },
      limit: input.limit,
    };

    try {
      const result = await api.searchSimilar(input);
      music.setLastSearchResponse(result);
      state.value.lastCompletedAt = new Date().toISOString();
      return result;
    } catch (error) {
      music.setLastSearchResponse(null);
      state.value.error = getErrorMessage(
        error,
        'Unable to load similar tracks right now.',
      );
      state.value.errorKind = classifyErrorKind(error);
      throw error;
    } finally {
      state.value.loading = false;
    }
  }

  async function retry() {
    if (!state.value.lastInput) {
      return null;
    }

    return search(state.value.lastInput);
  }

  function setMode(mode: MusicDiscoveryMode) {
    if (!state.value.lastInput) {
      return;
    }

    state.value.lastInput = {
      ...state.value.lastInput,
      mode,
    };
  }

  function setReference(reference: SuggestionReference) {
    if (!state.value.lastInput) {
      state.value.lastInput = {
        mode: 'catalog',
        reference: { ...reference },
      };
      return;
    }

    state.value.lastInput = {
      ...state.value.lastInput,
      reference: { ...reference },
    };
  }

  function clearResults() {
    music.setLastSearchResponse(null);
    state.value.error = null;
    state.value.errorKind = null;
  }

  function reset() {
    clearResults();
    state.value.lastInput = null;
    state.value.lastCompletedAt = null;
  }

  return {
    response: computed(() => music.lastSearchResponse),
    items: computed(() => music.lastSearchResponse?.items ?? []),
    providerUsed: computed(() => music.lastSearchResponse?.providerUsed ?? null),
    searchId: computed(() => music.lastSearchResponse?.searchId ?? null),
    isLoading: computed(() => state.value.loading),
    error: computed(() => state.value.error),
    errorKind: computed(() => state.value.errorKind),
    lastInput: computed(() => state.value.lastInput),
    hasAttemptedSearch: computed(() => state.value.lastInput !== null),
    lastCompletedAt: computed(() => state.value.lastCompletedAt),
    search,
    retry,
    setMode,
    setReference,
    clearResults,
    reset,
  };
}
