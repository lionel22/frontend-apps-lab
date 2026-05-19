<script setup lang="ts">
import { computed } from 'vue';
import type { PortfolioMetrics } from '~/types/trader';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '~/utils/formatters';

const props = defineProps<{
  metrics: PortfolioMetrics | null;
}>();

const rows = computed(() => {
  if (!props.metrics) {
    return [];
  }

  return [
    { label: 'Total Value', value: formatCurrency(props.metrics.totalValue) },
    { label: 'Daily Change', value: formatCurrency(props.metrics.dailyChange) },
    { label: 'Win Rate', value: formatPercent(props.metrics.winRate) },
    { label: 'Sharpe', value: formatNumber(props.metrics.sharpeRatio, 2) },
    {
      label: 'Realized PnL',
      value: formatCurrency(props.metrics.realizedPnl),
    },
    {
      label: 'Unrealized PnL',
      value: formatCurrency(props.metrics.unrealizedPnl),
    },
    {
      label: 'Profit Factor',
      value:
        props.metrics.profitFactor === null
          ? 'N/A'
          : formatNumber(props.metrics.profitFactor, 2),
    },
    { label: 'Trades', value: formatNumber(props.metrics.totalTrades, 0) },
  ];
});
</script>

<template>
  <v-row>
    <v-col v-for="row in rows" :key="row.label" cols="12" md="6" xl="3">
      <v-card class="bx-metric-card">
        <v-card-text>
          <div class="bx-metric-label">{{ row.label }}</div>
          <div class="bx-metric-value">{{ row.value }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.bx-metric-card {
  min-height: 100%;
}

.bx-metric-label {
  font-size: 0.76rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.56);
}

.bx-metric-value {
  margin-top: 10px;
  font-family: var(--bx-font-mono);
  font-size: 1rem;
  font-weight: 700;
  color: rgba(248, 250, 252, 0.92);
}
</style>
