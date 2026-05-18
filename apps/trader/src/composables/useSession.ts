import { computed, type Ref } from 'vue';

interface TraderSessionState {
  initialized: boolean;
  hydratedOnClient: boolean;
  actor: string;
  role: 'operator' | 'viewer' | 'admin';
  token: string | null;
  requireAuth: boolean;
  expired: boolean;
}

const STORAGE_KEYS = {
  actor: 'trader.operator.actor',
  role: 'trader.operator.role',
  token: 'trader.operator.token',
} as const;

const COOKIE_KEYS = {
  actor: 'trader_operator_actor',
  role: 'trader_operator_role',
  token: 'trader_operator_token',
} as const;

type TraderRole = TraderSessionState['role'];

function parseRole(value: string | null | undefined): TraderRole | null {
  if (value === 'operator' || value === 'viewer' || value === 'admin') {
    return value;
  }

  return null;
}

function readStorageString(key: string): string | null {
  if (!process.client) {
    return null;
  }

  const value = localStorage.getItem(key);
  if (!value || value.trim().length === 0) {
    return null;
  }

  return value;
}

function writeStorageString(key: string, value: string | null) {
  if (!process.client) {
    return;
  }

  if (value === null || value.trim().length === 0) {
    localStorage.removeItem(key);
    return;
  }

  localStorage.setItem(key, value);
}

function writeCookieString(
  cookie: Ref<string | null | undefined>,
  value: string | null,
) {
  cookie.value = value && value.trim().length > 0 ? value : null;
}

export function useSession() {
  const runtimeConfig = useRuntimeConfig();
  const actorCookie = useCookie<string | null>(COOKIE_KEYS.actor, {
    default: () => null,
    sameSite: 'lax',
    path: '/',
  });
  const roleCookie = useCookie<string | null>(COOKIE_KEYS.role, {
    default: () => null,
    sameSite: 'lax',
    path: '/',
  });
  const tokenCookie = useCookie<string | null>(COOKIE_KEYS.token, {
    default: () => null,
    sameSite: 'lax',
    path: '/',
  });
  const state = useState<TraderSessionState>('trader-session-state', () => ({
    initialized: false,
    hydratedOnClient: false,
    actor: 'operator-ui',
    role: 'operator',
    token: null,
    requireAuth: Boolean(runtimeConfig.public.traderRequireAuth),
    expired: false,
  }));

  function bootstrap() {
    if (process.server && state.value.initialized) {
      return;
    }

    if (process.client && state.value.initialized && state.value.hydratedOnClient) {
      return;
    }

    const runtimeToken =
      typeof runtimeConfig.public.traderAuthToken === 'string'
        ? runtimeConfig.public.traderAuthToken
        : '';

    const storedActor = readStorageString(STORAGE_KEYS.actor);
    const storedRole = parseRole(readStorageString(STORAGE_KEYS.role));
    const storedToken = readStorageString(STORAGE_KEYS.token);

    const cookieActor = actorCookie.value;
    const cookieRole = parseRole(roleCookie.value);
    const cookieToken = tokenCookie.value;

    const nextActor = storedActor ?? cookieActor ?? state.value.actor;
    const nextRole = storedRole ?? cookieRole ?? state.value.role;
    const nextToken = storedToken ?? cookieToken ?? (runtimeToken || null);

    state.value.actor = nextActor;
    state.value.role = nextRole;
    state.value.token = nextToken;

    writeCookieString(actorCookie, nextActor);
    writeCookieString(roleCookie, nextRole);
    writeCookieString(tokenCookie, nextToken);

    if (process.client) {
      writeStorageString(STORAGE_KEYS.actor, nextActor);
      writeStorageString(STORAGE_KEYS.role, nextRole);
      writeStorageString(STORAGE_KEYS.token, nextToken);
      state.value.hydratedOnClient = true;
    }

    state.value.initialized = true;
  }

  function setActor(actor: string) {
    state.value.actor = actor;
    writeStorageString(STORAGE_KEYS.actor, actor);
    writeCookieString(actorCookie, actor);
  }

  function setRole(role: 'operator' | 'viewer' | 'admin') {
    state.value.role = role;
    writeStorageString(STORAGE_KEYS.role, role);
    writeCookieString(roleCookie, role);
  }

  function setToken(token: string | null) {
    state.value.token = token;
    writeStorageString(STORAGE_KEYS.token, token);
    writeCookieString(tokenCookie, token);
    state.value.expired = false;
  }

  function markUnauthorized() {
    state.value.expired = true;
    if (state.value.requireAuth) {
      state.value.token = null;
      writeStorageString(STORAGE_KEYS.token, null);
      writeCookieString(tokenCookie, null);
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
    role: computed(() => state.value.role),
    token: computed(() => state.value.token),
    requireAuth: computed(() => state.value.requireAuth),
    expired: computed(() => state.value.expired),
    hydratedOnClient: computed(() => state.value.hydratedOnClient),
    isAuthenticated,
    setActor,
    setRole,
    setToken,
    markUnauthorized,
    markAuthorized,
  };
}
