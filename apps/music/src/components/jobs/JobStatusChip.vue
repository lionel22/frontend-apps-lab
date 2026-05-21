<script setup lang="ts">
import { computed } from 'vue';
import type { MusicIngestionStatus } from '~/types/music';
import { formatStatusLabel } from '~/utils/formatters';

const props = defineProps<{
  status: MusicIngestionStatus;
}>();

const chipColor = computed(() => {
  switch (props.status) {
    case 'queued':
      return 'warning';
    case 'processing':
      return 'info';
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'primary';
  }
});

const chipIcon = computed(() => {
  switch (props.status) {
    case 'queued':
      return 'mdi-timer-sand';
    case 'processing':
      return 'mdi-cached';
    case 'success':
      return 'mdi-check-circle-outline';
    case 'failed':
      return 'mdi-alert-circle-outline';
    default:
      return 'mdi-music-note';
  }
});
</script>

<template>
  <v-chip
    class="music-shell-chip"
    :color="chipColor"
    :prepend-icon="chipIcon"
    size="small"
    variant="tonal"
  >
    {{ formatStatusLabel(status) }}
  </v-chip>
</template>
