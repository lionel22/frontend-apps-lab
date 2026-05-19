<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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

// ── Time range filter ─────────────────────────────────────────────────────────
const RANGE_OPTIONS = [
  { label: '7D',  days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'ALL', days: null },
] as const;

const selectedDays = ref<number | null>(null);

const filteredCurve = computed(() => {
  const all = holdings.portfolioEquityCurve;
  if (!selectedDays.value) return all;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - selectedDays.value);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return all.filter((p) => p.date >= cutoffStr);
});
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
          <div class="d-flex justify-end mb-2">
            <v-btn-toggle
              v-model="selectedDays"
              density="compact"
              variant="tonal"
              size="small"
              mandatory
            >
              <v-btn
                v-for="opt in RANGE_OPTIONS"
                :key="opt.label"
                :value="opt.days"
              >
                {{ opt.label }}
              </v-btn>
            </v-btn-toggle>
          </div>
          <PerformanceEquityCurveChart :points="filteredCurve" />
        </v-col>
        <v-col cols="12" xl="4">
          <PerformanceRiskPanel :metrics="holdings.portfolioMetrics" />
        </v-col>
      </v-row>
    </template>
  </div>
</template>
