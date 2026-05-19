<script setup lang="ts">
import { computed } from 'vue';
import { useSseStore } from '~/stores/sse';

const sse = useSseStore();

const dotClass = computed(() => {
  if (sse.connectionState === 'connected') {
    return 'bx-status-dot--live';
  }
  if (sse.connectionState === 'reconnecting' || sse.pollingFallbackActive) {
    return 'bx-status-dot--warning';
  }
  return 'bx-status-dot--error';
});

const label = computed(() => {
  if (sse.connectionState === 'connected') {
    return 'Live feed connected';
  }
  if (sse.pollingFallbackActive) {
    return 'Polling fallback active';
  }
  if (sse.connectionState === 'reconnecting') {
    return 'Reconnecting live feed';
  }
  return 'Live feed disconnected';
});
</script>

<template>
  <div class="d-flex align-center ga-2">
    <span
      class="bx-status-dot"
      :class="dotClass"
    />
    <span class="bx-status-label">{{ label }}</span>
  </div>
</template>

<style scoped>
.bx-status-label {
  font-size: 0.7rem;
  color: rgba(226, 232, 240, 0.5);
  font-weight: 500;
}
</style>
