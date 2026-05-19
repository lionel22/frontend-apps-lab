import { ref } from 'vue';
import { defineStore } from 'pinia';

export type SseConnectionState = 'connected' | 'reconnecting' | 'disconnected';
export type SseSequenceRegistration = 'ok' | 'gap' | 'stale';

const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

export const useSseStore = defineStore('sse', () => {
  const connectionState = ref<SseConnectionState>('disconnected');
  const reconnectAttempt = ref(0);
  const pollingFallbackActive = ref(false);
  const lastError = ref<string | null>(null);
  const lastConnectedAt = ref<number | null>(null);
  const lastDisconnectedAt = ref<number | null>(null);
  const lastSeqByType = ref<Record<string, number>>({});

  function markConnected() {
    connectionState.value = 'connected';
    reconnectAttempt.value = 0;
    pollingFallbackActive.value = false;
    lastError.value = null;
    lastConnectedAt.value = Date.now();
  }

  function markReconnecting(reason: string | null = null) {
    connectionState.value = 'reconnecting';
    if (reason) {
      lastError.value = reason;
    }
  }

  function markDisconnected(reason: string | null = null) {
    connectionState.value = 'disconnected';
    lastDisconnectedAt.value = Date.now();
    if (reason) {
      lastError.value = reason;
    }
  }

  function activatePollingFallback() {
    pollingFallbackActive.value = true;
  }

  function nextReconnectDelay() {
    reconnectAttempt.value += 1;
    return Math.min(
      MAX_RECONNECT_DELAY_MS,
      BASE_RECONNECT_DELAY_MS * 2 ** (reconnectAttempt.value - 1),
    );
  }

  function registerEvent(
    eventType: string,
    sequence: number,
  ): SseSequenceRegistration {
    const previous = lastSeqByType.value[eventType];

    if (typeof previous === 'number' && sequence <= previous) {
      return 'stale';
    }

    const registration =
      typeof previous === 'number' && sequence > previous + 1 ? 'gap' : 'ok';

    lastSeqByType.value = {
      ...lastSeqByType.value,
      [eventType]: sequence,
    };

    return registration;
  }

  function reset() {
    connectionState.value = 'disconnected';
    reconnectAttempt.value = 0;
    pollingFallbackActive.value = false;
    lastError.value = null;
    lastConnectedAt.value = null;
    lastDisconnectedAt.value = null;
    lastSeqByType.value = {};
  }

  return {
    connectionState,
    reconnectAttempt,
    pollingFallbackActive,
    lastError,
    lastConnectedAt,
    lastDisconnectedAt,
    lastSeqByType,
    markConnected,
    markReconnecting,
    markDisconnected,
    activatePollingFallback,
    nextReconnectDelay,
    registerEvent,
    reset,
  };
});
