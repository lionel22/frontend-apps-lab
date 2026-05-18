<script setup lang="ts">
import { computed } from 'vue';
import type { SignalCorrelationWindow } from '~/types/trader';

const props = defineProps<{
  windows: SignalCorrelationWindow[];
}>();

const points = computed(() => {
  if (!props.windows.length) {
    return '';
  }

  const values = props.windows.map((window) => {
    if (!window.rows.length) {
      return 0;
    }
    const avg =
      window.rows.reduce((acc, row) => acc + row.correlation, 0) /
      window.rows.length;
    return avg;
  });

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value + 1) / 2) * 100;
      return `${x},${y}`;
    })
    .join(' ');
});
</script>

<template>
  <v-card>
    <v-card-title>Correlation Trend</v-card-title>
    <v-card-text>
      <div v-if="!windows.length" class="text-medium-emphasis py-8 text-center">
        No historical windows available.
      </div>
      <svg v-else viewBox="0 0 100 100" preserveAspectRatio="none" style="width: 100%; height: 220px">
        <line x1="0" y1="50" x2="100" y2="50" stroke="#94a3b8" stroke-dasharray="3,3" />
        <polyline :points="points" fill="none" stroke="#0f766e" stroke-width="2.5" />
      </svg>
    </v-card-text>
  </v-card>
</template>