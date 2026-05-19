<script setup lang="ts">
import { computed } from 'vue';
import type { PositionHealth } from '~/types/trader';

const props = defineProps<{
  health: PositionHealth | null;
}>();

const caption = computed(() => {
  if (!props.health) {
    return 'Health model is waiting for a server snapshot.';
  }

  if (props.health.status === 'HOLD') {
    return 'Health is still supportive enough to hold or add deliberately.';
  }
  if (props.health.status === 'WATCH') {
    return 'The position is still viable, but the edge is thinning out.';
  }
  return 'Exit pressure is building fast and the server score is now in the red zone.';
});
</script>

<template>
  <div class="d-flex flex-column ga-2">
    <SignalsReadinessGauge
      :score="health?.healthScore ?? null"
      title="Position Health"
      :caption="caption"
    />
    <div v-if="health" class="bx-health-footnote">
      {{ health.status.replaceAll('_', ' ') }} • Exit pressure {{ Math.round(health.exitPressureScore) }}/100
    </div>
  </div>
</template>

<style scoped>
.bx-health-footnote {
  font-size: 0.76rem;
  color: rgba(226, 232, 240, 0.62);
}
</style>
