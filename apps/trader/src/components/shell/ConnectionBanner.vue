<script setup lang="ts">
import { computed } from 'vue';
import { useSseStore } from '~/stores/sse';

const sse = useSseStore();

const visible = computed(
  () => sse.connectionState !== 'connected' || sse.pollingFallbackActive,
);

const title = computed(() => {
  if (sse.pollingFallbackActive) {
    return 'Live feed degraded';
  }
  if (sse.connectionState === 'reconnecting') {
    return 'Reconnecting live feed';
  }
  return 'Live feed unavailable';
});

const type = computed(() =>
  sse.connectionState === 'reconnecting' && !sse.pollingFallbackActive
    ? 'info'
    : 'warning',
);

const message = computed(() => {
  if (sse.pollingFallbackActive) {
    return 'Realtime updates are delayed. The console is using page polling until the stream recovers.';
  }
  if (sse.lastError) {
    return sse.lastError;
  }
  if (sse.connectionState === 'reconnecting') {
    return 'Operator data is reconnecting now.';
  }
  return 'Realtime operator events are currently unavailable.';
});
</script>

<template>
  <v-alert
    v-if="visible"
    :type="type"
    variant="tonal"
    border="start"
  >
    <div class="text-subtitle-2 mb-1">
      {{ title }}
    </div>
    <div class="text-body-2">
      {{ message }}
    </div>
  </v-alert>
</template>
