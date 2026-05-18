<script setup lang="ts">
import { computed } from 'vue';
import type { BacktestRunDetail } from '~/types/trader';
import { formatCurrency, formatDateTime } from '~/utils/formatters';

const props = defineProps<{
  run: BacktestRunDetail;
}>();

const points = computed(() => {
  const curve = props.run.equityCurve;
  if (!curve.length) {
    return '';
  }

  const min = Math.min(...curve.map((point) => point.value));
  const max = Math.max(...curve.map((point) => point.value));
  const range = Math.max(max - min, 1);

  return curve
    .map((point, index) => {
      const x = (index / Math.max(curve.length - 1, 1)) * 100;
      const y = 100 - ((point.value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');
});
</script>

<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Backtest Result {{ run.id.slice(0, 8) }}</span>
      <v-chip
        :color="run.status === 'COMPLETED' ? 'success' : run.status === 'FAILED' ? 'error' : 'info'"
        variant="tonal"
      >
        {{ run.status }}
      </v-chip>
    </v-card-title>
    <v-card-text class="d-flex flex-column ga-4">
      <div>
        <div class="text-subtitle-2 mb-2">Equity Curve</div>
        <div v-if="!run.equityCurve.length" class="text-medium-emphasis py-6">
          No equity points available for this run.
        </div>
        <svg
          v-else
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style="width: 100%; height: 220px"
        >
          <polyline :points="points" fill="none" stroke="#115e59" stroke-width="2.5" />
        </svg>
      </div>

      <v-row>
        <v-col cols="12" md="3">
          <v-chip color="primary" variant="tonal">
            Sharpe: {{ (run.metrics.sharpeRatio ?? 0).toFixed(2) }}
          </v-chip>
        </v-col>
        <v-col cols="12" md="3">
          <v-chip color="warning" variant="tonal">
            MaxDD: {{ (run.metrics.maxDrawdown ?? 0).toFixed(2) }}
          </v-chip>
        </v-col>
        <v-col cols="12" md="3">
          <v-chip color="info" variant="tonal">
            PF: {{ (run.metrics.profitFactor ?? 0).toFixed(2) }}
          </v-chip>
        </v-col>
        <v-col cols="12" md="3">
          <v-chip color="teal" variant="tonal">
            Calmar: {{ (run.metrics.calmarRatio ?? 0).toFixed(2) }}
          </v-chip>
        </v-col>
      </v-row>

      <div>
        <div class="text-subtitle-2 mb-2">Trades</div>
        <v-table density="compact" hover>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Side</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>PnL</th>
              <th>Closed</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!run.trades.length">
              <td colspan="6" class="text-center py-6 text-medium-emphasis">
                No replayed trades recorded.
              </td>
            </tr>
            <tr v-for="(trade, index) in run.trades" :key="`${trade.symbol}-${index}`">
              <td>{{ trade.symbol }}</td>
              <td>{{ trade.side }}</td>
              <td>{{ formatCurrency(trade.entryPrice, 'USD', 4) }}</td>
              <td>{{ formatCurrency(trade.exitPrice, 'USD', 4) }}</td>
              <td>
                <v-chip
                  :color="trade.pnl >= 0 ? 'success' : 'error'"
                  variant="tonal"
                  size="small"
                >
                  {{ formatCurrency(trade.pnl) }}
                </v-chip>
              </td>
              <td>{{ formatDateTime(trade.closedAt || null) }}</td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card-text>
  </v-card>
</template>