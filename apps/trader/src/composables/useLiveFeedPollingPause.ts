import { computed } from 'vue';
import { useSseStore } from '~/stores/sse';

export function useLiveFeedPollingPause() {
  const sse = useSseStore();

  return computed(
    () => sse.connectionState === 'connected' && !sse.pollingFallbackActive,
  );
}
