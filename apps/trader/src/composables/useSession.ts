import { computed } from 'vue';

interface TraderSessionState {
  initialized: boolean;
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

export function useSession() {
  const runtimeConfig = useRuntimeConfig();
  const state = useState<TraderSessionState>('trader-session-state', () => ({
    initialized: false,
    actor: 'operator-ui',
    role: 'operator',
    token: null,
    requireAuth: Boolean(runtimeConfig.public.traderRequireAuth),
    expired: false,
  }));

  function bootstrap() {
    if (state.value.initialized) {
      return;
    }

    const runtimeToken =
      typeof runtimeConfig.public.traderAuthToken === 'string'
        ? runtimeConfig.public.traderAuthToken
        : '';

    const storedActor = readStorageString(STORAGE_KEYS.actor);
    const storedRole = readStorageString(STORAGE_KEYS.role);
    const storedToken = readStorageString(STORAGE_KEYS.token);

    state.value.actor = storedActor ?? state.value.actor;
    if (
      storedRole === 'operator' ||
      storedRole === 'viewer' ||
      storedRole === 'admin'
    ) {
      state.value.role = storedRole;
    }
    state.value.token = storedToken ?? (runtimeToken || null);
    state.value.initialized = true;
  }

  function setActor(actor: string) {
    state.value.actor = actor;
    writeStorageString(STORAGE_KEYS.actor, actor);
  }

  function setRole(role: 'operator' | 'viewer' | 'admin') {
    state.value.role = role;
    writeStorageString(STORAGE_KEYS.role, role);
  }

  function setToken(token: string | null) {
    state.value.token = token;
    writeStorageString(STORAGE_KEYS.token, token);
    state.value.expired = false;
  }

  function markUnauthorized() {
    state.value.expired = true;
    if (state.value.requireAuth) {
      state.value.token = null;
      writeStorageString(STORAGE_KEYS.token, null);
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
    isAuthenticated,
    setActor,
    setRole,
    setToken,
    markUnauthorized,
    markAuthorized,
  };
}
