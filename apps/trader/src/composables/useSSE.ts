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

const POLLING_FALLBACK_DELAY_MS = 3000;
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

export function useSSE() {
  const runtimeConfig = useRuntimeConfig();
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

  function stopConnection(reason: string | null = null) {
    clearReconnectTimer();
    clearFallbackTimer();

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

  async function refreshForEventType(eventType: string) {
    const normalizedType = eventType.toLowerCase();

    if (normalizedType.startsWith('signal:')) {
      await Promise.allSettled([
        trader.fetchSignals(true),
        positions.fetchPositionHealth(true),
      ]);
      return;
    }

    if (normalizedType.startsWith('watchlist:')) {
      await Promise.allSettled([trader.fetchWatchlist(true), trader.fetchStatus(true)]);
      return;
    }

    if (
      normalizedType.startsWith('position:') ||
      normalizedType.startsWith('trade:') ||
      normalizedType.startsWith('holdings:') ||
      normalizedType.startsWith('portfolio:')
    ) {
      await Promise.allSettled([
        trader.fetchStatus(true),
        trader.fetchPositions(true),
        positions.refreshSnapshot(true),
        trader.fetchTrades(trader.trades.offset, trader.trades.limit, true),
        holdings.refreshSnapshot(true),
      ]);
      return;
    }

    if (
      normalizedType.startsWith('control:') ||
      normalizedType.startsWith('status:') ||
      normalizedType.includes('killswitch')
    ) {
      await Promise.allSettled([trader.fetchStatus(true), trader.fetchPositions(true)]);
      return;
    }

    if (normalizedType.startsWith('backtest:')) {
      await refreshBacktests();
      return;
    }

    await trader.fetchStatus(true);
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
      void refreshFullSnapshot();
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
        void refreshFullSnapshot();
        return;
      }
    }

    notifications.recordEvent(eventType, envelope?.data);
    void refreshForEventType(eventType);
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
