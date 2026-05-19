<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  pressure: number | null;
}>();

const tone = computed(() => {
  if (props.pressure === null) {
    return 'grey';
  }
  if (props.pressure >= 70) {
    return 'error';
  }
  if (props.pressure >= 40) {
    return 'warning';
  }
  return 'success';
});

const label = computed(() => {
  if (props.pressure === null) {
    return 'Pending';
  }
  if (props.pressure >= 70) {
    return 'Strong Exit';
  }
  if (props.pressure >= 40) {
    return 'Building';
  }
  return 'Contained';
});
</script>

<template>
  <div class="bx-exit-pressure">
    <div class="d-flex justify-space-between align-center mb-2 ga-3">
      <span class="bx-metric-label">Exit Pressure</span>
      <span class="bx-metric-value">{{ pressure === null ? '--' : `${Math.round(pressure)}/100` }}</span>
    </div>
    <v-progress-linear
      :model-value="pressure ?? 0"
      :color="tone"
      rounded
      height="10"
      bg-color="rgba(148,163,184,0.16)"
    />
    <div class="bx-pressure-label mt-2">{{ label }}</div>
  </div>
</template>

<style scoped>
.bx-exit-pressure {
  border-radius: 16px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.52);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.bx-metric-label {
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.58);
}

.bx-metric-value {
  font-family: var(--bx-font-mono);
  font-size: 0.86rem;
  font-weight: 700;
  color: rgba(248, 250, 252, 0.9);
}

.bx-pressure-label {
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.66);
}
</style>
