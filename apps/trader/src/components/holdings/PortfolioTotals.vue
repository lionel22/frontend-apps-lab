<script setup lang="ts">
import { computed } from 'vue';
import type { PortfolioMetrics, SpotHolding } from '~/types/trader';
import { formatCurrency, formatNumber, formatPercent } from '~/utils/formatters';

const props = defineProps<{
  holdings: SpotHolding[];
  metrics: PortfolioMetrics | null;
}>();

const largestAllocation = computed(() => props.metrics?.portfolioAllocation[0] ?? null);
const activeAssetCount = computed(
  () => props.holdings.filter((holding) => holding.marketValue > 0).length,
);
const dailyTone = computed(() => {
  if (!props.metrics) {
    return 'secondary';
  }
  return props.metrics.dailyChange >= 0 ? 'success' : 'error';
});
</script>

<template>
  <v-card class="bx-holdings-card">
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Portfolio Totals</span>
      <v-chip :color="dailyTone" variant="tonal" size="small">
        {{ metrics ? formatPercent(metrics.dailyChangePct) : 'No change' }}
      </v-chip>
    </v-card-title>

    <v-card-text v-if="metrics">
      <div class="d-flex flex-column ga-4">
        <div class="d-flex flex-wrap justify-space-between align-center ga-4">
          <div>
            <div class="bx-metric-label mb-1">Total Marked Value</div>
            <div class="bx-holdings-hero">{{ formatCurrency(metrics.totalValue) }}</div>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip variant="outlined" color="info">{{ activeAssetCount }} active assets</v-chip>
            <v-chip variant="outlined" color="warning">
              Exposure {{ formatPercent(metrics.exposurePct) }}
            </v-chip>
            <v-chip variant="outlined" color="secondary">
              Concentration {{ formatPercent(metrics.maxConcentrationPct) }}
            </v-chip>
          </div>
        </div>

        <div class="bx-totals-grid">
          <div class="bx-total-metric">
            <span class="bx-metric-label">Daily Change</span>
            <strong class="bx-mono" :style="{ color: metrics.dailyChange >= 0 ? '#00e676' : '#ff5252' }">
              {{ formatCurrency(metrics.dailyChange) }}
            </strong>
          </div>
          <div class="bx-total-metric">
            <span class="bx-metric-label">Realized PnL</span>
            <strong class="bx-mono">{{ formatCurrency(metrics.realizedPnl) }}</strong>
          </div>
          <div class="bx-total-metric">
            <span class="bx-metric-label">Unrealized PnL</span>
            <strong class="bx-mono">{{ formatCurrency(metrics.unrealizedPnl) }}</strong>
          </div>
          <div class="bx-total-metric">
            <span class="bx-metric-label">Win Rate</span>
            <strong class="bx-mono">{{ formatPercent(metrics.winRate) }}</strong>
          </div>
          <div class="bx-total-metric">
            <span class="bx-metric-label">Profit Factor</span>
            <strong class="bx-mono">{{ metrics.profitFactor === null ? 'Perfect' : formatNumber(metrics.profitFactor) }}</strong>
          </div>
          <div class="bx-total-metric">
            <span class="bx-metric-label">Max Drawdown</span>
            <strong class="bx-mono">{{ formatPercent(metrics.maxDrawdown) }}</strong>
          </div>
          <div class="bx-total-metric">
            <span class="bx-metric-label">Avg Trade Duration</span>
            <strong class="bx-mono">{{ formatNumber(metrics.averageTradeDurationHours) }}h</strong>
          </div>
          <div class="bx-total-metric">
            <span class="bx-metric-label">Largest Weight</span>
            <strong class="bx-mono">
              {{ largestAllocation ? `${largestAllocation.symbol} ${formatPercent(largestAllocation.allocationPct)}` : 'N/A' }}
            </strong>
          </div>
        </div>
      </div>
    </v-card-text>

    <v-card-text v-else>
      <div class="bx-empty-state">Waiting for portfolio metrics.</div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.bx-holdings-card {
  background:
    radial-gradient(circle at top right, rgba(0, 229, 255, 0.14), transparent 38%),
    radial-gradient(circle at bottom left, rgba(255, 171, 0, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.88));
}

.bx-holdings-hero {
  font-family: var(--bx-font-mono);
  font-size: 1.8rem;
  font-weight: 800;
  color: #00e5ff;
}

.bx-totals-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.bx-total-metric {
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

@media (max-width: 1280px) {
  .bx-totals-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
