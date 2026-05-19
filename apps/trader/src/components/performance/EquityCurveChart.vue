<script setup lang="ts">
import { computed } from 'vue';
import type { PortfolioEquityPoint } from '~/types/trader';
import { formatCurrency, formatDateTime } from '~/utils/formatters';

const props = defineProps<{
  points: PortfolioEquityPoint[];
}>();

const chartPoints = computed(() => {
  if (props.points.length < 2) {
    return '';
  }

  const minEquity = Math.min(...props.points.map((point) => point.equity));
  const maxEquity = Math.max(...props.points.map((point) => point.equity));
  const span = Math.max(maxEquity - minEquity, 1);

  return props.points
    .map((point, index) => {
      const x = (index / Math.max(props.points.length - 1, 1)) * 100;
      const y = 100 - ((point.equity - minEquity) / span) * 100;
      return `${x},${y}`;
    })
    .join(' ');
});

const latestPoint = computed(() => props.points.at(-1) ?? null);
const earliestPoint = computed(() => props.points[0] ?? null);
const trendTone = computed(() => {
  if (!latestPoint.value || !earliestPoint.value) {
    return 'info';
  }

  return latestPoint.value.equity >= earliestPoint.value.equity ? 'success' : 'error';
});
</script>

<template>
  <v-card class="bx-equity-chart">
    <v-card-title class="d-flex flex-wrap align-center justify-space-between ga-3">
      <span>Equity Curve</span>
      <v-chip :color="trendTone" variant="tonal" size="small">
        {{ latestPoint ? formatCurrency(latestPoint.equity) : 'No curve yet' }}
      </v-chip>
    </v-card-title>
    <v-card-text>
      <div v-if="points.length < 2" class="text-center py-8 text-medium-emphasis">
        Not enough realized history yet to render the equity curve.
      </div>
      <div v-else class="d-flex flex-column ga-3">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="bx-equity-svg">
          <defs>
            <linearGradient id="equity-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00e5ff" />
              <stop offset="100%" stop-color="#00e676" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="url(#equity-line)"
            stroke-width="2.2"
            points="0,100 100,100"
            opacity="0.08"
          />
          <polyline
            fill="none"
            stroke="url(#equity-line)"
            stroke-width="2.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            :points="chartPoints"
          />
        </svg>

        <div class="d-flex flex-wrap justify-space-between ga-3 bx-metric-caption">
          <span>{{ earliestPoint ? formatDateTime(earliestPoint.date) : '-' }}</span>
          <span>{{ latestPoint ? formatDateTime(latestPoint.date) : '-' }}</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.bx-equity-chart {
  min-height: 100%;
}

.bx-equity-svg {
  width: 100%;
  height: 280px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(0, 229, 255, 0.08), rgba(15, 23, 42, 0.1)),
    rgba(15, 23, 42, 0.62);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  padding: 16px;
}

.bx-metric-caption {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.64);
}
</style>
