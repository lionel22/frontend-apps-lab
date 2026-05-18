<script setup lang="ts">
import { computed } from 'vue';
import type { SignalView } from '~/types/trader';

const props = defineProps<{
  signals: SignalView[];
}>();

const contributionKeys = computed(() => {
  const keys = new Set<string>();
  for (const signal of props.signals) {
    for (const key of Object.keys(signal.contributions)) {
      keys.add(key);
    }
  }

  return Array.from(keys).slice(0, 6);
});

function heatColor(value: number): string {
  if (value >= 0.7) return 'rgba(0, 230, 118, 0.7)';
  if (value >= 0.55) return 'rgba(0, 230, 118, 0.35)';
  if (value >= 0.4) return 'rgba(255, 171, 0, 0.35)';
  if (value >= 0.25) return 'rgba(255, 171, 0, 0.2)';
  return 'rgba(255, 23, 68, 0.25)';
}
</script>

<template>
  <v-card>
    <v-card-title>Signal Heatmap</v-card-title>
    <v-card-text>
      <v-table density="compact">
        <thead>
          <tr>
            <th>Symbol</th>
            <th class="text-center">Composite</th>
            <th class="text-center">Confidence</th>
            <th v-for="key in contributionKeys" :key="key" class="text-center">
              {{ key }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!signals.length">
            <td :colspan="3 + contributionKeys.length" class="text-center py-6 text-medium-emphasis">
              No signal snapshots available.
            </td>
          </tr>
          <tr v-for="signal in signals" :key="`${signal.symbol}-${signal.timeframe}`">
            <td class="font-weight-medium" style="color: #e2e8f0">{{ signal.symbol }}</td>
            <td class="text-center">
              <span
                class="bx-heatmap-cell"
                :style="{ background: heatColor(signal.compositeScore), color: signal.compositeScore >= 0.5 ? '#0a0e17' : '#e2e8f0' }"
              >
                {{ signal.compositeScore.toFixed(2) }}
              </span>
            </td>
            <td class="text-center">
              <span
                class="bx-heatmap-cell"
                :style="{ background: heatColor(signal.confidence), color: signal.confidence >= 0.5 ? '#0a0e17' : '#e2e8f0' }"
              >
                {{ signal.confidence.toFixed(2) }}
              </span>
            </td>
            <td v-for="key in contributionKeys" :key="`${signal.symbol}-${key}`" class="text-center">
              <span
                class="bx-heatmap-cell bx-heatmap-cell--small"
                :style="{ background: heatColor(signal.contributions[key] ?? 0), color: (signal.contributions[key] ?? 0) >= 0.5 ? '#0a0e17' : '#e2e8f0' }"
              >
                {{ (signal.contributions[key] ?? 0).toFixed(2) }}
              </span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.bx-heatmap-cell {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-family: var(--bx-font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 52px;
  text-align: center;
}
.bx-heatmap-cell--small {
  padding: 2px 6px;
  font-size: 0.7rem;
  min-width: 44px;
}
</style>
