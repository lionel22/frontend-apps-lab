<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useHoldingsStore } from '~/stores/useHoldingsStore';
import { usePolling } from '~/composables/usePolling';

const holdings = useHoldingsStore();

const isInitialLoading = computed(
  () =>
    (holdings.loading.portfolioMetrics || holdings.loading.portfolioEquityCurve) &&
    holdings.portfolioEquityCurve.length === 0,
);

async function refresh(force = false) {
  await Promise.all([
    holdings.fetchPortfolioMetrics(force),
    holdings.fetchPortfolioEquityCurve(force),
  ]);
}

onMounted(async () => {
  await refresh(true);
});

usePolling(async () => {
  await refresh(true);
}, { interval: holdings.pollingInterval, immediate: false });
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert
      :error="holdings.errors.portfolioMetrics"
      title="Performance Metrics Error"
    />
    <SharedApiErrorAlert
      :error="holdings.errors.portfolioEquityCurve"
      title="Equity Curve Error"
    />

    <template v-if="isInitialLoading">
      <v-skeleton-loader type="card" />
      <v-row>
        <v-col cols="12" xl="8"><v-skeleton-loader type="card" /></v-col>
        <v-col cols="12" xl="4"><v-skeleton-loader type="card" /></v-col>
      </v-row>
    </template>
    <template v-else>
      <PerformanceMetricsGrid :metrics="holdings.portfolioMetrics" />

      <v-row>
        <v-col cols="12" xl="8">
          <PerformanceEquityCurveChart :points="holdings.portfolioEquityCurve" />
        </v-col>
        <v-col cols="12" xl="4">
          <PerformanceRiskPanel :metrics="holdings.portfolioMetrics" />
        </v-col>
      </v-row>
    </template>
  </div>
</template>