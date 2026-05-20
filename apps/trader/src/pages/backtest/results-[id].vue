<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useLiveFeedPollingPause } from '~/composables/useLiveFeedPollingPause';
import { useTraderStore } from '~/stores/trader';
import { usePolling } from '~/composables/usePolling';

const route = useRoute();
const trader = useTraderStore();
const shouldPauseLivePolling = useLiveFeedPollingPause();

const runId = computed(() => String(route.params.id || ''));
const run = computed(() => trader.backtestDetail);
const shouldPausePolling = computed(
  () =>
    shouldPauseLivePolling.value ||
    !run.value ||
    run.value.status === 'COMPLETED' ||
    run.value.status === 'FAILED',
);

async function refresh(force = false) {
  if (!runId.value) {
    return;
  }
  await trader.fetchBacktestDetail(runId.value, force);
}

onMounted(async () => {
  await refresh(true);
});

usePolling(async () => {
  await refresh(true);
}, { interval: 10000, immediate: false, paused: shouldPausePolling });
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <v-btn variant="text" to="/backtest">
      Back to Backtests
    </v-btn>

    <SharedApiErrorAlert
      :error="trader.errors.backtestDetail"
      title="Backtest Detail Error"
    />

    <SharedLoadingSpinner
      v-if="trader.loading.backtestDetail && !run"
      label="Loading backtest detail..."
    />

    <BacktestResultsChart v-else-if="run" :run="run" />
  </div>
</template>
