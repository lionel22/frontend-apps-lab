import { computed, type Ref } from 'vue';

interface TraderSessionState {
  initialized: boolean;
  hydratedOnClient: boolean;
  actor: string;
  role: 'operator' | 'viewer' | 'admin';
  token: string | null;
  requireAuth: boolean;
  expired: boolean;
  lastLoginAt: string | null;
  expiresAt: string | null;
  expiryWarningShown: boolean;
}

const STORAGE_KEYS = {
  actor: 'trader.operator.actor',
  role: 'trader.operator.role',
  token: 'trader.operator.token',
  lastLoginAt: 'trader.operator.last-login-at',
  expiresAt: 'trader.operator.expires-at',
} as const;

const COOKIE_KEYS = {
  actor: 'trader_operator_actor',
  role: 'trader_operator_role',
  token: 'trader_operator_token',
  lastLoginAt: 'trader_operator_last_login_at',
  expiresAt: 'trader_operator_expires_at',
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

function parseExpiryDurationMs(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized.length) {
    return null;
  }

  if (/^\d+$/.test(normalized)) {
    return Number.parseInt(normalized, 10) * 1000;
  }

  const match = normalized.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    return null;
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
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
  const lastLoginAtCookie = useCookie<string | null>(COOKIE_KEYS.lastLoginAt, {
    default: () => null,
    sameSite: 'lax',
    path: '/',
  });
  const expiresAtCookie = useCookie<string | null>(COOKIE_KEYS.expiresAt, {
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
    lastLoginAt: null,
    expiresAt: null,
    expiryWarningShown: false,
  }));

  function bootstrap() {
    if (process.server && state.value.initialized) {
      return;
    }

    if (process.client && state.value.initialized && state.value.hydratedOnClient) {
      return;
    }

    const storedActor = readStorageString(STORAGE_KEYS.actor);
    const storedRole = parseRole(readStorageString(STORAGE_KEYS.role));
    const storedToken = readStorageString(STORAGE_KEYS.token);
    const storedLastLoginAt = readStorageString(STORAGE_KEYS.lastLoginAt);
    const storedExpiresAt = readStorageString(STORAGE_KEYS.expiresAt);

    const cookieActor = actorCookie.value;
    const cookieRole = parseRole(roleCookie.value);
    const cookieToken = tokenCookie.value;
    const cookieLastLoginAt = lastLoginAtCookie.value;
    const cookieExpiresAt = expiresAtCookie.value;

    const nextActor = storedActor ?? cookieActor ?? state.value.actor;
    const nextRole = storedRole ?? cookieRole ?? state.value.role;
    const nextToken = storedToken ?? cookieToken ?? null;
    const nextLastLoginAt =
      storedLastLoginAt ??
      cookieLastLoginAt ??
      state.value.lastLoginAt ??
      (nextToken ? new Date().toISOString() : null);
    const nextExpiresAt =
      storedExpiresAt ?? cookieExpiresAt ?? state.value.expiresAt ?? null;

    state.value.actor = nextActor;
    state.value.role = nextRole;
    state.value.token = nextToken;
    state.value.lastLoginAt = nextLastLoginAt;
    state.value.expiresAt = nextExpiresAt;

    writeCookieString(actorCookie, nextActor);
    writeCookieString(roleCookie, nextRole);
    writeCookieString(tokenCookie, nextToken);
    writeCookieString(lastLoginAtCookie, nextLastLoginAt);
    writeCookieString(expiresAtCookie, nextExpiresAt);

    if (process.client) {
      writeStorageString(STORAGE_KEYS.actor, nextActor);
      writeStorageString(STORAGE_KEYS.role, nextRole);
      writeStorageString(STORAGE_KEYS.token, nextToken);
      writeStorageString(STORAGE_KEYS.lastLoginAt, nextLastLoginAt);
      writeStorageString(STORAGE_KEYS.expiresAt, nextExpiresAt);
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

  function setToken(
    token: string | null,
    lastLoginAt?: string | null,
    expiresIn?: string | null,
  ) {
    state.value.token = token;
    if (token) {
      state.value.lastLoginAt = lastLoginAt ?? new Date().toISOString();
      const expiryDurationMs = parseExpiryDurationMs(expiresIn);
      state.value.expiresAt = expiryDurationMs
        ? new Date(Date.now() + expiryDurationMs).toISOString()
        : state.value.expiresAt;
      state.value.expiryWarningShown = false;
    }
    writeStorageString(STORAGE_KEYS.token, token);
    writeCookieString(tokenCookie, token);
    writeStorageString(STORAGE_KEYS.lastLoginAt, state.value.lastLoginAt);
    writeCookieString(lastLoginAtCookie, state.value.lastLoginAt);
    writeStorageString(STORAGE_KEYS.expiresAt, state.value.expiresAt);
    writeCookieString(expiresAtCookie, state.value.expiresAt);
    state.value.expired = false;
  }

  function markUnauthorized() {
    state.value.expired = true;
  }

  function markAuthorized() {
    state.value.expired = false;
  }

  function markExpiryWarningShown() {
    state.value.expiryWarningShown = true;
  }

  bootstrap();

  const isAuthenticated = computed(
    () =>
      !state.value.requireAuth ||
      (Boolean(state.value.token) && !state.value.expired),
  );
  const msUntilExpiry = computed(() => {
    if (!state.value.expiresAt) {
      return null;
    }

    return new Date(state.value.expiresAt).getTime() - Date.now();
  });
  const isExpiringSoon = computed(() => {
    if (msUntilExpiry.value === null) {
      return false;
    }

    return msUntilExpiry.value > 0 && msUntilExpiry.value <= 5 * 60 * 1000;
  });

  return {
    actor: computed(() => state.value.actor),
    role: computed(() => state.value.role),
    token: computed(() => state.value.token),
    requireAuth: computed(() => state.value.requireAuth),
    expired: computed(() => state.value.expired),
    lastLoginAt: computed(() => state.value.lastLoginAt),
    expiresAt: computed(() => state.value.expiresAt),
    expiryWarningShown: computed(() => state.value.expiryWarningShown),
    isExpiringSoon,
    msUntilExpiry,
    hydratedOnClient: computed(() => state.value.hydratedOnClient),
    isAuthenticated,
    setActor,
    setRole,
    setToken,
    markUnauthorized,
    markAuthorized,
    markExpiryWarningShown,
  };
}
