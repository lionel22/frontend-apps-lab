<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { BacktestLaunchPayload } from '~/types/trader';
import { useLiveFeedPollingPause } from '~/composables/useLiveFeedPollingPause';
import { useTraderStore } from '~/stores/trader';
import { usePolling } from '~/composables/usePolling';

const trader = useTraderStore();
const launchOpen = ref(false);
const launching = ref(false);
const symbolOptions = computed(() => trader.watchlist.map((asset) => asset.symbol));
const shouldPausePolling = useLiveFeedPollingPause();

async function refresh(force = false) {
  await trader.fetchBacktestList(
    trader.backtests.offset,
    trader.backtests.limit,
    force,
  );
}

onMounted(async () => {
  await refresh(true);
});

usePolling(async () => {
  await refresh(true);
}, {
  interval: trader.pollingIntervals.backtests,
  immediate: false,
  paused: shouldPausePolling,
});

async function onLaunch(payload: BacktestLaunchPayload) {
  launching.value = true;
  try {
    const result = await trader.launchBacktest(payload);
    if (result?.runId) {
      launchOpen.value = false;
      await refresh(true);
      await navigateTo(`/backtest/results-${result.runId}`);
    }
  } finally {
    launching.value = false;
  }
}

async function onPageChange(offset: number, limit: number) {
  await trader.fetchBacktestList(offset, limit, true);
}

async function openLaunchModal() {
  await trader.fetchWatchlist();
  launchOpen.value = true;
}

function openDetail(runId: string) {
  void navigateTo(`/backtest/results-${runId}`);
}
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert :error="trader.errors.backtests" title="Backtest History Error" />

    <BacktestList
      :paged-backtests="trader.backtests"
      :loading="trader.loading.backtests"
      @launch="openLaunchModal"
      @open="openDetail"
      @page-change="onPageChange"
    />

    <BacktestLaunchModal
      v-model="launchOpen"
      :loading="launching"
      :symbol-options="symbolOptions"
      @launch="onLaunch"
    />
  </div>
</template>
