import { computed } from 'vue';

interface MusicSessionState {
  initialized: boolean;
  hydratedOnClient: boolean;
  actor: string;
  token: string | null;
  requireAuth: boolean;
  expired: boolean;
  lastAuthenticatedAt: string | null;
  storageKey: string;
}

const COOKIE_KEYS = {
  actor: 'music_operator_actor',
  token: 'music_operator_token',
  lastAuthenticatedAt: 'music_operator_last_authenticated_at',
} as const;

function isClientEnvironment(): boolean {
  return typeof window !== 'undefined';
}

function readStorageSnapshot(storageKey: string): Partial<MusicSessionState> {
  if (!isClientEnvironment()) {
    return {};
  }

  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Partial<MusicSessionState>;
  } catch {
    return {};
  }
}

function writeStorageSnapshot(
  storageKey: string,
  value: Pick<MusicSessionState, 'actor' | 'token' | 'lastAuthenticatedAt'>,
) {
  if (!isClientEnvironment()) {
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(value));
}

export function useSession() {
  const runtimeConfig = useRuntimeConfig();
  const storageKey =
    typeof runtimeConfig.public.musicAuthStorageKey === 'string' &&
    runtimeConfig.public.musicAuthStorageKey.trim().length > 0
      ? runtimeConfig.public.musicAuthStorageKey.trim()
      : 'music.operator.session';

  const actorCookie = useCookie<string | null>(COOKIE_KEYS.actor, {
    default: () => null,
    sameSite: 'lax',
    path: '/',
  });
  const tokenCookie = useCookie<string | null>(COOKIE_KEYS.token, {
    default: () => null,
    sameSite: 'lax',
    path: '/',
  });
  const lastAuthenticatedAtCookie = useCookie<string | null>(
    COOKIE_KEYS.lastAuthenticatedAt,
    {
      default: () => null,
      sameSite: 'lax',
      path: '/',
    },
  );

  const state = useState<MusicSessionState>('music-session-state', () => ({
    initialized: false,
    hydratedOnClient: false,
    actor: 'music-operator',
    token: null,
    requireAuth: Boolean(runtimeConfig.public.musicRequireAuth),
    expired: false,
    lastAuthenticatedAt: null,
    storageKey,
  }));

  function persist() {
    actorCookie.value = state.value.actor;
    tokenCookie.value = state.value.token;
    lastAuthenticatedAtCookie.value = state.value.lastAuthenticatedAt;
    writeStorageSnapshot(state.value.storageKey, {
      actor: state.value.actor,
      token: state.value.token,
      lastAuthenticatedAt: state.value.lastAuthenticatedAt,
    });
  }

  function bootstrap() {
    if (state.value.initialized && (!isClientEnvironment() || state.value.hydratedOnClient)) {
      return;
    }

    const stored = readStorageSnapshot(storageKey);
    state.value.actor =
      typeof stored.actor === 'string' && stored.actor.trim().length > 0
        ? stored.actor.trim()
        : actorCookie.value ?? state.value.actor;

    const cookieToken = tokenCookie.value;
    const storedToken = typeof stored.token === 'string' ? stored.token.trim() : '';
    state.value.token = storedToken || cookieToken || null;

    state.value.lastAuthenticatedAt =
      typeof stored.lastAuthenticatedAt === 'string'
        ? stored.lastAuthenticatedAt
        : lastAuthenticatedAtCookie.value;

    state.value.requireAuth = Boolean(runtimeConfig.public.musicRequireAuth);
    state.value.storageKey = storageKey;

    persist();

    if (isClientEnvironment()) {
      state.value.hydratedOnClient = true;
    }

    state.value.initialized = true;
  }

  function setSession(input: { token: string; actor?: string | null }) {
    state.value.actor = input.actor?.trim() || state.value.actor;
    state.value.token = input.token.trim();
    state.value.lastAuthenticatedAt = new Date().toISOString();
    state.value.expired = false;
    persist();
  }

  function clearSession() {
    state.value.token = null;
    state.value.lastAuthenticatedAt = null;
    state.value.expired = false;
    persist();
  }

  function markUnauthorized() {
    state.value.expired = true;
    if (state.value.requireAuth) {
      state.value.token = null;
      persist();
    }
  }

  function markAuthorized() {
    state.value.expired = false;
  }

  bootstrap();

  const isAuthenticated = computed(
    () => !state.value.requireAuth || Boolean(state.value.token),
  );

  return {
    actor: computed(() => state.value.actor),
    token: computed(() => state.value.token),
    requireAuth: computed(() => state.value.requireAuth),
    expired: computed(() => state.value.expired),
    lastAuthenticatedAt: computed(() => state.value.lastAuthenticatedAt),
    hydratedOnClient: computed(() => state.value.hydratedOnClient),
    isAuthenticated,
    setSession,
    clearSession,
    markUnauthorized,
    markAuthorized,
  };
}
