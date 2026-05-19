<script setup lang="ts">
import { computed } from 'vue';
import type { SignalReadiness } from '~/types/trader';
import { formatNumber } from '~/utils/formatters';

const props = defineProps<{
  dimensions: SignalReadiness['dimensions'] | null;
}>();

const rows = computed(() => {
  if (!props.dimensions) {
    return [];
  }

  return [
    props.dimensions.technical,
    props.dimensions.regime,
    props.dimensions.liquidity,
    props.dimensions.participation,
    props.dimensions.sentiment,
  ].map((dimension) => ({
    ...dimension,
    normalizedScore: Math.max(0, Math.min(100, ((dimension.score + 1) / 2) * 100)),
    formattedScore: formatNumber(dimension.score, 2),
  }));
});
</script>

<template>
  <v-card variant="tonal" color="surface">
    <v-card-title class="text-subtitle-1">Dimension Breakdown</v-card-title>
    <v-card-text>
      <div v-if="!rows.length" class="text-medium-emphasis">
        Readiness dimensions will appear once a signal snapshot is selected.
      </div>
      <div v-else class="d-flex flex-column ga-4">
        <div v-for="dimension in rows" :key="dimension.label" class="d-flex flex-column ga-2">
          <div class="d-flex justify-space-between align-center ga-3">
            <div>
              <div class="font-weight-medium">{{ dimension.label }}</div>
              <div class="bx-dimension-sources">
                {{ dimension.sources.join(' • ') || 'No source mapping' }}
              </div>
            </div>
            <div class="bx-dimension-score">
              {{ dimension.formattedScore }}
            </div>
          </div>
          <SignalsReadinessGauge :score="dimension.normalizedScore" dense />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.bx-dimension-sources {
  font-size: 0.76rem;
  line-height: 1.45;
  color: rgba(226, 232, 240, 0.58);
}

.bx-dimension-score {
  font-family: var(--bx-font-mono);
  font-size: 0.82rem;
  font-weight: 700;
  color: rgba(248, 250, 252, 0.9);
}
</style>