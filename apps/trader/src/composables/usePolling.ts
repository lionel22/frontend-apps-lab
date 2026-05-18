import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { ApiError } from '~/types/api';
import { useVisibilityChange } from '~/composables/useVisibilityChange';

export interface UsePollingOptions {
  interval: number;
  immediate?: boolean;
  paused?: { value: boolean };
  onError?: (error: unknown) => void;
}

export function usePolling(
  action: () => Promise<void>,
  options: UsePollingOptions,
) {
  const baseInterval = Math.max(options.interval, 500);
  const currentInterval = ref(baseInterval);
  const isRunning = ref(false);
  const isPaused = ref(options.paused?.value ?? false);
  const hasStarted = ref(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const { isVisible } = useVisibilityChange();

  function clearTimer() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function adjustIntervalAfterError(error: unknown) {
    const apiError = error as ApiError | undefined;
    if (apiError?.status === 429) {
      currentInterval.value = Math.ceil(currentInterval.value * 1.5);
      return;
    }
    currentInterval.value = baseInterval;
  }

  function adjustIntervalAfterSuccess() {
    if (currentInterval.value <= baseInterval) {
      currentInterval.value = baseInterval;
      return;
    }
    currentInterval.value = Math.max(
      baseInterval,
      Math.floor(currentInterval.value * 0.9),
    );
  }

  async function tick() {
    if (!isRunning.value || isPaused.value || !isVisible.value) {
      return;
    }

    try {
      await action();
      adjustIntervalAfterSuccess();
    } catch (error) {
      adjustIntervalAfterError(error);
      options.onError?.(error);
    } finally {
      if (isRunning.value) {
        timeoutId = setTimeout(tick, currentInterval.value);
      }
    }
  }

  async function start() {
    if (isRunning.value) {
      return;
    }

    isRunning.value = true;
    hasStarted.value = true;

    if (options.immediate !== false) {
      await tick();
      return;
    }

    timeoutId = setTimeout(tick, currentInterval.value);
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
    if (isRunning.value) {
      clearTimer();
      timeoutId = setTimeout(tick, currentInterval.value);
    }
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

  watch(isVisible, (visible) => {
    if (!hasStarted.value) {
      return;
    }

    if (!visible) {
      pause();
    } else {
      resume();
    }
  });

  onMounted(async () => {
    await start();
  });

  onUnmounted(() => {
    stop();
  });

  return {
    isRunning: computed(() => isRunning.value),
    isPaused: computed(() => isPaused.value),
    interval: computed(() => currentInterval.value),
    start,
    stop,
    pause,
    resume,
  };
}
