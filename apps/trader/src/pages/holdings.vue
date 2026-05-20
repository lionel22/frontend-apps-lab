<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useLiveFeedPollingPause } from '~/composables/useLiveFeedPollingPause';
import { usePolling } from '~/composables/usePolling';
import { useHoldingsStore } from '~/stores/useHoldingsStore';
import { useTraderStore } from '~/stores/trader';

const holdings = useHoldingsStore();
const trader = useTraderStore();
const shouldPausePolling = useLiveFeedPollingPause();

const isInitialLoading = computed(
  () =>
    (holdings.loading.holdings || holdings.loading.portfolioMetrics) &&
    holdings.holdings.length === 0,
);

const environmentNotice = computed(() => {
  if (trader.status?.tradingMode === 'backtest') {
    return {
      type: 'warning' as const,
      title: 'Backtest Environment',
      text:
        'This holdings view is running in backtest mode. Values shown here are local lab data and will not match your live Binance account.',
    };
  }

  if (trader.status?.tradingMode === 'paper') {
    return {
      type: 'warning' as const,
      title: 'Paper Environment',
      text:
        'This holdings view is running in paper mode. Values shown here do not reflect your live Binance account balances.',
    };
  }

  if (trader.status?.tradingMode === 'live' && holdings.holdings.length === 0) {
    return {
      type: 'info' as const,
      title: 'No Live Holdings Snapshot',
      text:
        'No authenticated holdings snapshot is available yet. Check Binance credentials and the reconciliation worker if you expect live account balances here.',
    };
  }

  return null;
});

async function refresh(force = false) {
  await Promise.all([
    holdings.refreshSnapshot(force),
    trader.fetchStatus(force),
  ]);
}

onMounted(async () => {
  await refresh(true);
});

usePolling(async () => {
  await refresh(true);
}, {
  interval: holdings.pollingInterval,
  immediate: false,
  paused: shouldPausePolling,
});
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <v-alert
      v-if="environmentNotice"
      :type="environmentNotice.type"
      :title="environmentNotice.title"
      variant="tonal"
    >
      {{ environmentNotice.text }}
    </v-alert>

    <SharedApiErrorAlert
      :error="holdings.errors.holdings"
      title="Holdings Endpoint Error"
    />
    <SharedApiErrorAlert
      :error="holdings.errors.portfolioMetrics"
      title="Portfolio Metrics Endpoint Error"
    />

    <template v-if="isInitialLoading">
      <v-row>
        <v-col cols="12" xl="8"><v-skeleton-loader type="card" /></v-col>
        <v-col cols="12" xl="4"><v-skeleton-loader type="card" /></v-col>
      </v-row>
      <v-skeleton-loader type="table" />
    </template>
    <template v-else>
      <v-row>
        <v-col cols="12" xl="8">
          <HoldingsPortfolioTotals
            :holdings="holdings.holdings"
            :metrics="holdings.portfolioMetrics"
          />
        </v-col>
        <v-col cols="12" xl="4">
          <HoldingsAllocationDonut
            :allocations="holdings.portfolioAllocation"
            :total-value="holdings.totalMarketValue"
          />
        </v-col>
      </v-row>

      <HoldingsHoldingsTable
        :holdings="holdings.holdings"
        :allocations="holdings.portfolioAllocation"
      />
    </template>
  </div>
</template>
