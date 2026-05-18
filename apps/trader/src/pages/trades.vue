<script setup lang="ts">
import { onMounted } from 'vue';
import { useTraderStore } from '~/stores/trader';
import { usePolling } from '~/composables/usePolling';

const trader = useTraderStore();

async function refresh(force = false) {
  await trader.fetchTrades(
    trader.trades.offset,
    trader.trades.limit,
    force,
  );
}

onMounted(async () => {
  await refresh(true);
});

usePolling(async () => {
  await refresh(true);
}, { interval: trader.pollingIntervals.trades, immediate: false });

async function handlePageChange(offset: number, limit: number) {
  await trader.fetchTrades(offset, limit, true);
}
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert :error="trader.errors.trades" title="Trades Endpoint Error" />

    <TradesTradeMetricsCard :trades="trader.trades.items" />

    <TradesTable
      :paged-trades="trader.trades"
      :loading="trader.loading.trades"
      @page-change="handlePageChange"
    />
  </div>
</template>