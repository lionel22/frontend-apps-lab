<script setup lang="ts">
import { computed } from 'vue';
import type { Position } from '~/types/trader';

const props = defineProps<{
  positions: Position[];
}>();

const totalRiskPct = computed(() =>
  props.positions.reduce((acc, position) => acc + position.riskPct, 0),
);

const color = computed(() => {
  if (totalRiskPct.value >= 60) {
    return 'error';
  }
  if (totalRiskPct.value >= 35) {
    return 'warning';
  }
  return 'success';
});
</script>

<template>
  <v-card>
    <v-card-text class="pa-5">
      <div class="d-flex align-center justify-space-between mb-4">
        <span class="bx-metric-label">Portfolio Risk</span>
        <span class="bx-status-dot" :class="color === 'error' ? 'bx-status-dot--error' : color === 'warning' ? 'bx-status-dot--warning' : 'bx-status-dot--live'" />
      </div>
      <div class="bx-metric-value mb-4" :style="{ color: `rgb(var(--v-theme-${color}))` }">
        {{ totalRiskPct.toFixed(2) }}%
      </div>
      <v-progress-linear
        :model-value="Math.min(totalRiskPct, 100)"
        :color="color"
        height="8"
        rounded
      />
      <div class="bx-metric-label mt-3">
        Aggregated open-position risk as % of portfolio
      </div>
    </v-card-text>
  </v-card>
</template>
