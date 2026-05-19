<script setup lang="ts">
import { computed } from 'vue';
import type { PortfolioMetrics } from '~/types/trader';
import { formatCurrency, formatPercent } from '~/utils/formatters';

const props = defineProps<{
  metrics: PortfolioMetrics | null;
  holdingsCount: number;
}>();

const trendTone = computed(() => {
  if (!props.metrics) {
    return 'secondary';
  }

  if (props.metrics.dailyChange > 0) {
    return 'success';
  }

  if (props.metrics.dailyChange < 0) {
    return 'error';
  }

  return 'secondary';
});
</script>

<template>
  <v-card class="bx-portfolio-card">
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Portfolio Summary</span>
      <v-chip color="info" size="small" variant="tonal">
        {{ holdingsCount }} holdings
      </v-chip>
    </v-card-title>

    <v-card-text v-if="metrics">
      <div class="d-flex flex-column ga-4">
        <div class="d-flex flex-wrap justify-space-between align-center ga-3">
          <div>
            <div class="bx-metric-label mb-1">Marked Portfolio Value</div>
            <div class="bx-mono bx-portfolio-value">
              {{ formatCurrency(metrics.totalValue) }}
            </div>
          </div>

          <v-chip :color="trendTone" variant="tonal" size="small">
            {{ formatCurrency(metrics.dailyChange) }}
            <span class="ml-1">{{ formatPercent(metrics.dailyChangePct) }}</span>
          </v-chip>
        </div>

        <div class="bx-summary-grid">
          <div class="bx-summary-pill">
            <span class="bx-metric-label">Exposure</span>
            <strong class="bx-mono">{{ formatPercent(metrics.exposurePct) }}</strong>
          </div>
          <div class="bx-summary-pill">
            <span class="bx-metric-label">Drawdown</span>
            <strong class="bx-mono">{{ formatPercent(metrics.maxDrawdown) }}</strong>
          </div>
          <div class="bx-summary-pill">
            <span class="bx-metric-label">Win Rate</span>
            <strong class="bx-mono">{{ formatPercent(metrics.winRate) }}</strong>
          </div>
          <div class="bx-summary-pill">
            <span class="bx-metric-label">Trades</span>
            <strong class="bx-mono">{{ metrics.totalTrades }}</strong>
          </div>
        </div>
      </div>
    </v-card-text>

    <v-card-text v-else>
      <div class="bx-empty-state">
        Waiting for the first live portfolio snapshot.
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.bx-portfolio-card {
  background:
    radial-gradient(circle at top right, rgba(0, 229, 255, 0.12), transparent 40%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.86));
}

.bx-portfolio-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #00e5ff;
}

.bx-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.bx-summary-pill {
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(0, 229, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bx-empty-state {
  color: rgba(226, 232, 240, 0.62);
}

@media (max-width: 960px) {
  .bx-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>