<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useTraderStore } from '~/stores/trader';
import { useHoldingsStore } from '~/stores/useHoldingsStore';
import { useLiveFeedPollingPause } from '~/composables/useLiveFeedPollingPause';
import { usePolling } from '~/composables/usePolling';

const trader = useTraderStore();
const holdings = useHoldingsStore();
const shouldPausePolling = useLiveFeedPollingPause();

const isInitialLoading = computed(
  () =>
    (trader.loading.status ||
      trader.loading.watchlist ||
      trader.loading.signals ||
      trader.loading.backtests ||
      holdings.loading.portfolioMetrics) &&
    !trader.status,
);

async function refreshDashboard(force = false) {
  await Promise.all([
    trader.fetchStatus(force),
    trader.fetchWatchlist(force),
    trader.fetchSignals(force),
    trader.fetchPositions(force),
    trader.fetchBacktestList(0, trader.backtests.limit, force),
    holdings.refreshSnapshot(force),
  ]);
}

onMounted(async () => {
  await refreshDashboard(true);
});

usePolling(async () => {
  await refreshDashboard(true);
}, {
  interval: trader.pollingIntervals.status,
  immediate: false,
  paused: shouldPausePolling,
});
</script>

<template>
  <div class="d-flex flex-column ga-5">
    <SharedApiErrorAlert
      :error="trader.errors.status"
      title="Status Load Error"
    />

    <template v-if="isInitialLoading">
      <v-skeleton-loader type="card" />
      <v-skeleton-loader type="card" />
      <v-skeleton-loader type="card" />
      <v-row>
        <v-col cols="12" lg="6"><v-skeleton-loader type="card" /></v-col>
        <v-col cols="12" lg="6"><v-skeleton-loader type="card" /></v-col>
      </v-row>
      <v-skeleton-loader type="table" />
    </template>
    <template v-else>
      <DashboardStatusCards :status="trader.status" />

      <DashboardReadinessGauges
        :status="trader.status"
        :signals="trader.signals"
        :positions="trader.positions"
        :backtest-count="trader.backtests.total"
      />

      <DashboardPortfolioSummary
        :metrics="holdings.portfolioMetrics"
        :holdings-count="holdings.holdings.length"
      />

      <v-row>
        <v-col cols="12" lg="6">
          <DashboardWatchlistSummary :watchlist="trader.watchlist" />
        </v-col>
        <v-col cols="12" lg="6">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Operational Summary</span>
              <v-chip
                :color="trader.isKillSwitchActive ? 'error' : 'success'"
                variant="tonal"
                size="small"
              >
                <span class="bx-status-dot mr-2" :class="trader.isKillSwitchActive ? 'bx-status-dot--error' : 'bx-status-dot--live'" />
                {{ trader.isKillSwitchActive ? 'Kill-Switch Active' : 'Trading Path Clear' }}
              </v-chip>
            </v-card-title>
            <v-card-text>
              <div class="d-flex flex-column ga-4">
                <div class="d-flex justify-space-between align-center">
                  <span class="bx-metric-label">Open Positions</span>
                  <span class="bx-mono" style="font-size: 1.1rem; font-weight: 700; color: #00e5ff">
                    {{ trader.openPositionCount }}
                  </span>
                </div>
                <div class="bx-divider" />
                <div class="d-flex justify-space-between align-center">
                  <span class="bx-metric-label">Portfolio Risk</span>
                  <span class="bx-mono" style="font-size: 1.1rem; font-weight: 700" :style="{ color: trader.totalPortfolioRisk >= 60 ? '#ff1744' : trader.totalPortfolioRisk >= 35 ? '#ffab00' : '#00e676' }">
                    {{ trader.totalPortfolioRisk.toFixed(2) }}%
                  </span>
                </div>
                <div class="bx-divider" />
                <div class="d-flex justify-space-between align-center">
                  <span class="bx-metric-label">Backtests Tracked</span>
                  <span class="bx-mono" style="font-size: 1.1rem; font-weight: 700; color: rgba(226,232,240,0.7)">
                    {{ trader.backtests.total }}
                  </span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <DashboardSignalHeatmap :signals="trader.signals" />
    </template>
  </div>
</template>
