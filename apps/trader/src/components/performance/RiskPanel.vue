<script setup lang="ts">
import { computed } from 'vue';
import type { PortfolioMetrics } from '~/types/trader';
import { formatNumber, formatPercent } from '~/utils/formatters';

const props = defineProps<{
  metrics: PortfolioMetrics | null;
}>();

const rows = computed(() => {
  if (!props.metrics) {
    return [];
  }

  return [
    {
      label: 'Exposure',
      value: formatPercent(props.metrics.exposurePct),
    },
    {
      label: 'Max Drawdown',
      value: formatPercent(props.metrics.maxDrawdown),
    },
    {
      label: 'Max Concentration',
      value: formatPercent(props.metrics.maxConcentrationPct),
    },
    {
      label: 'Calmar Ratio',
      value: formatNumber(props.metrics.calmarRatio, 2),
    },
    {
      label: 'Avg Duration',
      value: `${formatNumber(props.metrics.averageTradeDurationHours, 1)}h`,
    },
  ];
});
</script>

<template>
  <v-card>
    <v-card-title>Risk Panel</v-card-title>
    <v-card-text>
      <div v-if="!rows.length" class="text-medium-emphasis">
        Risk metrics will populate once the portfolio analytics snapshot is available.
      </div>
      <div v-else class="d-flex flex-column ga-4">
        <div
          v-for="row in rows"
          :key="row.label"
          class="d-flex justify-space-between align-center ga-3"
        >
          <span class="bx-metric-label">{{ row.label }}</span>
          <span class="bx-metric-value">{{ row.value }}</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.bx-metric-label {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.62);
}

.bx-metric-value {
  font-family: var(--bx-font-mono);
  font-size: 0.88rem;
  font-weight: 700;
  color: rgba(248, 250, 252, 0.92);
}
</style>