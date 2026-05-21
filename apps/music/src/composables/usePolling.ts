import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { ApiError } from '~/types/api';
import { DEFAULT_MUSIC_POLLING_INTERVAL_MS } from '~/utils/constants';

export interface UsePollingOptions {
  interval?: number;
  immediate?: boolean;
  paused?: { value: boolean };
  onError?: (error: unknown) => void;
}

export function usePolling(
  action: () => Promise<void>,
  options: UsePollingOptions = {},
) {
  const runtimeConfig = useRuntimeConfig();
  const configuredInterval = Number(runtimeConfig.public.musicPollingIntervalDefault);
  const baseInterval = Math.max(
    options.interval ?? configuredInterval ?? DEFAULT_MUSIC_POLLING_INTERVAL_MS,
    500,
  );

  const currentInterval = ref(baseInterval);
  const isRunning = ref(false);
  const isPaused = ref(options.paused?.value ?? false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function clearTimer() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function schedule() {
    clearTimer();
    if (!isRunning.value || isPaused.value) {
      return;
    }

    timeoutId = setTimeout(() => {
      void tick();
    }, currentInterval.value);
  }

  function adjustIntervalAfterError(error: unknown) {
    const apiError = error as Partial<ApiError>;
    if (apiError.status === 429) {
      currentInterval.value = Math.ceil(currentInterval.value * 1.5);
      return;
    }

    currentInterval.value = baseInterval;
  }

  async function tick() {
    if (!isRunning.value || isPaused.value) {
      return;
    }

    try {
      await action();
      currentInterval.value = baseInterval;
    } catch (error) {
      adjustIntervalAfterError(error);
      options.onError?.(error);
    } finally {
      schedule();
    }
  }

  async function start() {
    if (isRunning.value) {
      return;
    }

    isRunning.value = true;
    if (options.immediate !== false) {
      await tick();
      return;
    }

    schedule();
  }

  function stop() {
    isRunning.value = false;
    clearTimer();
  }

  function pause() {
    isPaused.value = true;
    clearTimer();
  }

  function resume() {
    isPaused.value = false;
    schedule();
  }

  watch(
    () => options.paused?.value,
    (paused) => {
      if (paused === undefined) {
        return;
      }

      if (paused) {
        pause();
      } else {
        resume();
      }
    },
  );

  onMounted(() => {
    void start();
  });

  onUnmounted(() => {
    stop();
  });

  return {
    interval: computed(() => currentInterval.value),
    isRunning: computed(() => isRunning.value),
    isPaused: computed(() => isPaused.value),
    start,
    stop,
    pause,
    resume,
  };
}
