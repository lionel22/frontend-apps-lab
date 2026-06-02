import { fetchEventSource, type EventSourceMessage } from '@microsoft/fetch-event-source';
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { useNotifications } from '~/composables/useNotifications';
import { useSession } from '~/composables/useSession';
import { useSseStore } from '~/stores/sse';
import { useHoldingsStore } from '~/stores/useHoldingsStore';
import { usePositionsStore } from '~/stores/usePositionsStore';
import { useTraderStore } from '~/stores/trader';
import { useUiStore } from '~/stores/ui';
import { API_ENDPOINTS } from '~/utils/constants';

interface TraderSseEnvelope {
  type?: string;
  seq?: number | string;
  timestamp?: string;
  data?: unknown;
}

interface RefreshPlan {
  status: boolean;
  watchlist: boolean;
  signals: boolean;
  traderPositions: boolean;
  positionsSnapshot: boolean;
  positionHealthOnly: boolean;
  trades: boolean;
  holdingsSnapshot: boolean;
  backtests: boolean;
}

const POLLING_FALLBACK_DELAY_MS = 3000;
const SSE_REFRESH_DEBOUNCE_MS = 250;
const LIVE_FEED_AUTH_MESSAGE = 'Authentication is required to restore the live feed.';
const FALLBACK_ALERT_MESSAGE =
  'Live feed disconnected. Falling back to page polling until the stream reconnects.';

let activeController: AbortController | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
let activeConsumers = 0;

function resolveStreamUrl(baseUrl: string, path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!baseUrl) {
    return cleanPath;
  }

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBase}${cleanPath}`;
}

function parseEnvelope(message: EventSourceMessage): TraderSseEnvelope | null {
  if (!message.data) {
    return null;
  }

  try {
    return JSON.parse(message.data) as TraderSseEnvelope;
  } catch {
    return {
      type: message.event,
      data: message.data,
    };
  }
}

function createRefreshPlan(): RefreshPlan {
  return {
    status: false,
    watchlist: false,
    signals: false,
    traderPositions: false,
    positionsSnapshot: false,
    positionHealthOnly: false,
    trades: false,
    holdingsSnapshot: false,
    backtests: false,
  };
}

function buildRefreshPlan(eventTypes: Iterable<string>): RefreshPlan {
  const plan = createRefreshPlan();

  for (const eventType of eventTypes) {
    const normalizedType = eventType.toLowerCase();

    if (normalizedType.startsWith('signal:')) {
      plan.signals = true;
      plan.positionHealthOnly = true;
      continue;
    }

    if (normalizedType.startsWith('watchlist:')) {
      plan.watchlist = true;
      plan.status = true;
      continue;
    }

    if (
      normalizedType.startsWith('position:') ||
      normalizedType.startsWith('trade:') ||
      normalizedType.startsWith('holdings:') ||
      normalizedType.startsWith('portfolio:')
    ) {
      plan.status = true;
      plan.traderPositions = true;
      plan.positionsSnapshot = true;
      plan.trades = true;
      plan.holdingsSnapshot = true;
      continue;
    }

    if (
      normalizedType.startsWith('control:') ||
      normalizedType.startsWith('status:') ||
      normalizedType.includes('killswitch')
    ) {
      plan.status = true;
      plan.traderPositions = true;
      continue;
    }

    if (normalizedType.startsWith('backtest:')) {
      plan.backtests = true;
      continue;
    }

    plan.status = true;
  }

  return plan;
}

export function useSSE() {
  const runtimeConfig = useRuntimeConfig();
  const route = useRoute();
  const session = useSession();
  const sse = useSseStore();
  const holdings = useHoldingsStore();
  const positions = usePositionsStore();
  const trader = useTraderStore();
  const ui = useUiStore();
  const notifications = useNotifications();

  const streamUrl = computed(() =>
    resolveStreamUrl(
      String(runtimeConfig.public.traderApiBaseUrl ?? ''),
      API_ENDPOINTS.eventsStream,
    ),
  );
  const pendingRefreshEventTypes = new Set<string>();
  let pendingFullSnapshot = false;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  let refreshInFlight = false;

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function clearFallbackTimer() {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  }

  function clearRefreshTimer() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  }

  function resetRefreshQueue() {
    clearRefreshTimer();
    pendingFullSnapshot = false;
    pendingRefreshEventTypes.clear();
  }

  function scheduleRefreshFlush(delayMs = SSE_REFRESH_DEBOUNCE_MS) {
    if (refreshTimer) {
      if (delayMs > 0) {
        return;
      }

      clearRefreshTimer();
    }

    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      void flushPendingRefreshes();
    }, delayMs);
  }

  function queueEventRefresh(eventType: string) {
    pendingRefreshEventTypes.add(eventType);
    scheduleRefreshFlush();
  }

  function queueFullSnapshotRefresh() {
    pendingFullSnapshot = true;
    scheduleRefreshFlush(0);
  }

  function stopConnection(reason: string | null = null) {
    clearReconnectTimer();
    clearFallbackTimer();
    resetRefreshQueue();

    if (activeController) {
      activeController.abort();
      activeController = null;
    }

    if (reason) {
      sse.markDisconnected(reason);
    }
  }

  async function refreshBacktests() {
    const refreshes: Array<Promise<unknown>> = [
      trader.fetchBacktestList(trader.backtests.offset, trader.backtests.limit, true),
    ];

    if (trader.backtestDetail?.id) {
      refreshes.push(trader.fetchBacktestDetail(trader.backtestDetail.id, true));
    }

    await Promise.allSettled(refreshes);
  }

  async function refreshFullSnapshot() {
    await Promise.allSettled([
      trader.fetchStatus(true),
      trader.fetchWatchlist(true),
      trader.fetchSignals(true),
      trader.fetchPositions(true),
      positions.refreshSnapshot(true),
      trader.fetchTrades(trader.trades.offset, trader.trades.limit, true),
      holdings.refreshSnapshot(true),
      refreshBacktests(),
    ]);
  }

  async function refreshForEventTypes(eventTypes: Iterable<string>) {
    const plan = buildRefreshPlan(eventTypes);
    const refreshes: Array<Promise<unknown>> = [];

    if (plan.status) {
      refreshes.push(trader.fetchStatus(true));
    }

    if (plan.watchlist) {
      refreshes.push(trader.fetchWatchlist(true));
    }

    if (plan.signals) {
      refreshes.push(trader.fetchSignals(true));
    }

    if (plan.traderPositions) {
      refreshes.push(trader.fetchPositions(true));
    }

    if (plan.positionsSnapshot) {
      refreshes.push(positions.refreshSnapshot(true));
    } else if (plan.positionHealthOnly) {
      refreshes.push(positions.fetchPositionHealth(true));
    }

    if (plan.trades) {
      refreshes.push(
        trader.fetchTrades(trader.trades.offset, trader.trades.limit, true),
      );
    }

    if (plan.holdingsSnapshot) {
      refreshes.push(holdings.refreshSnapshot(true));
    }

    if (plan.backtests) {
      refreshes.push(refreshBacktests());
    }

    if (refreshes.length === 0) {
      return;
    }

    await Promise.allSettled(refreshes);
  }

  async function flushPendingRefreshes() {
    if (refreshInFlight) {
      return;
    }

    if (!pendingFullSnapshot && pendingRefreshEventTypes.size === 0) {
      return;
    }

    const shouldRefreshFullSnapshot = pendingFullSnapshot;
    const eventTypes = shouldRefreshFullSnapshot
      ? []
      : Array.from(pendingRefreshEventTypes);

    pendingFullSnapshot = false;
    pendingRefreshEventTypes.clear();
    refreshInFlight = true;

    try {
      if (shouldRefreshFullSnapshot) {
        await refreshFullSnapshot();
        return;
      }

      await refreshForEventTypes(eventTypes);
    } finally {
      refreshInFlight = false;

      if (pendingFullSnapshot || pendingRefreshEventTypes.size > 0) {
        scheduleRefreshFlush(0);
      }
    }
  }

  function schedulePollingFallback() {
    if (fallbackTimer) {
      return;
    }

    fallbackTimer = setTimeout(() => {
      fallbackTimer = null;
      sse.activatePollingFallback();
      ui.addAlert({
        type: 'warning',
        message: FALLBACK_ALERT_MESSAGE,
        duration: 5000,
      });
      notifications.pushNotification({
        source: 'sse:fallback',
        title: 'Polling fallback enabled',
        message: FALLBACK_ALERT_MESSAGE,
        severity: 'warning',
      });
      queueFullSnapshotRefresh();
    }, POLLING_FALLBACK_DELAY_MS);
  }

  function scheduleReconnect(reason: string) {
    if (reconnectTimer) {
      return;
    }

    if (session.requireAuth.value && !session.token.value) {
      sse.markDisconnected(LIVE_FEED_AUTH_MESSAGE);
      return;
    }

    sse.markReconnecting(reason);
    const delay = sse.nextReconnectDelay();
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, delay);
  }

  function handleMessage(message: EventSourceMessage) {
    const envelope = parseEnvelope(message);
    const eventType =
      typeof envelope?.type === 'string' && envelope.type.length > 0
        ? envelope.type
        : message.event || 'message';
    const nextSequence =
      typeof envelope?.seq === 'number'
        ? envelope.seq
        : Number.parseInt(String(envelope?.seq ?? ''), 10);

    if (Number.isFinite(nextSequence)) {
      const registration = sse.registerEvent(eventType, nextSequence);

      if (registration === 'stale') {
        return;
      }

      if (registration === 'gap') {
        ui.addAlert({
          type: 'warning',
          message: `Live feed gap detected for ${eventType}. Refreshing operator data.`,
          duration: 5000,
        });
        notifications.pushNotification({
          source: eventType,
          title: 'Live feed gap detected',
          message: `Sequence gap on ${eventType}. Data refresh started automatically.`,
          severity: 'warning',
        });
        queueFullSnapshotRefresh();
        return;
      }
    }

    notifications.recordEvent(eventType, envelope?.data);
    queueEventRefresh(eventType);
  }

  async function connect() {
    if (!import.meta.client) {
      return;
    }

    if (session.requireAuth.value && !session.token.value) {
      stopConnection(LIVE_FEED_AUTH_MESSAGE);
      return;
    }

    clearReconnectTimer();
    clearFallbackTimer();
    sse.markReconnecting('Connecting live feed.');

    if (activeController) {
      activeController.abort();
    }

    const controller = new AbortController();
    activeController = controller;

    try {
      await fetchEventSource(streamUrl.value, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          ...(session.token.value
            ? { Authorization: `Bearer ${session.token.value}` }
            : {}),
        },
        credentials: 'include',
        openWhenHidden: true,
        signal: controller.signal,
        async onopen(response) {
          const contentType = response.headers.get('content-type') ?? '';

          if (!response.ok) {
            if (response.status === 401) {
              session.markUnauthorized();
              if (import.meta.client && route.path !== '/login') {
                void navigateTo({
                  path: '/login',
                  query: { redirect: route.fullPath },
                });
              }
            }

            throw new Error(
              `Live feed request failed with status ${response.status}.`,
            );
          }

          if (!contentType.includes('text/event-stream')) {
            throw new Error('Live feed endpoint did not return an event stream.');
          }

          sse.markConnected();
        },
        onmessage(message) {
          handleMessage(message);
        },
        onclose() {
          throw new Error('Live feed connection closed.');
        },
        onerror(error) {
          throw error;
        },
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      const reason =
        error instanceof Error ? error.message : 'Live feed connection failed.';
      sse.markDisconnected(reason);
      schedulePollingFallback();
      scheduleReconnect(reason);
    } finally {
      if (activeController === controller) {
        activeController = null;
      }
    }
  }

  onMounted(() => {
    activeConsumers += 1;
    if (activeConsumers === 1) {
      void connect();
    }
  });

  onBeforeUnmount(() => {
    activeConsumers = Math.max(0, activeConsumers - 1);
    if (activeConsumers === 0) {
      stopConnection();
      sse.reset();
    }
  });

  watch(
    () => session.token.value,
    (nextToken, previousToken) => {
      if (!import.meta.client || nextToken === previousToken || activeConsumers === 0) {
        return;
      }

      if (session.requireAuth.value && !nextToken) {
        stopConnection(LIVE_FEED_AUTH_MESSAGE);
        return;
      }

      void connect();
    },
  );

  return {
    connectionState: computed(() => sse.connectionState),
    pollingFallbackActive: computed(() => sse.pollingFallbackActive),
    lastError: computed(() => sse.lastError),
    lastConnectedAt: computed(() => sse.lastConnectedAt),
  };
}
