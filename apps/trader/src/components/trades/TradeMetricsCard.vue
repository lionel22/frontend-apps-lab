<script setup lang="ts">
import { computed } from 'vue';
import type { Trade } from '~/types/trader';
import { formatCurrency } from '~/utils/formatters';

const props = defineProps<{
  trades: Trade[];
}>();

const summary = computed(() => {
  const totals = props.trades.reduce(
    (acc, trade) => {
      acc.pnl += trade.realizedPnl;
      acc.fees += trade.fees;
      acc.funding += trade.funding;
      return acc;
    },
    { pnl: 0, fees: 0, funding: 0 },
  );

  return {
    ...totals,
    count: props.trades.length,
  };
});
</script>

<template>
  <v-card>
    <v-card-title>Trade Metrics</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="6" md="3">
          <div class="bx-metric-label mb-1">Trades</div>
          <div class="bx-mono" style="font-size: 1.3rem; font-weight: 700; color: #00e5ff">
            {{ summary.count }}
          </div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="bx-metric-label mb-1">PnL</div>
          <div class="bx-mono" style="font-size: 1.3rem; font-weight: 700" :style="{ color: summary.pnl >= 0 ? '#00e676' : '#ff1744' }">
            {{ formatCurrency(summary.pnl) }}
          </div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="bx-metric-label mb-1">Fees</div>
          <div class="bx-mono" style="font-size: 1.3rem; font-weight: 700; color: #ffab00">
            {{ formatCurrency(summary.fees) }}
          </div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="bx-metric-label mb-1">Funding</div>
          <div class="bx-mono" style="font-size: 1.3rem; font-weight: 700; color: #448aff">
            {{ formatCurrency(summary.funding) }}
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
