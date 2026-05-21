<script setup lang="ts">
import { computed } from 'vue';
import type { MusicIngestionStatus } from '~/types/music';
import { MUSIC_STATUS_OPTIONS } from '~/utils/constants';
import { formatRelativeTime } from '~/utils/formatters';

const props = defineProps<{
  modelValue: MusicIngestionStatus | 'all';
  autoRefreshEnabled: boolean;
  refreshing: boolean;
  lastLoadedAt?: string | null;
  pollingIntervalMs: number;
  focusCount?: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: MusicIngestionStatus | 'all'];
  'update:autoRefreshEnabled': [value: boolean];
  refresh: [];
}>();

const statusOptions = computed(() => [
  { title: 'All statuses', value: 'all' },
  ...MUSIC_STATUS_OPTIONS.map((status) => ({
    title: status.charAt(0).toUpperCase() + status.slice(1),
    value: status,
  })),
]);

const refreshLabel = computed(() => {
  if (!props.lastLoadedAt) {
    return 'No refresh yet';
  }

  return `Updated ${formatRelativeTime(props.lastLoadedAt)}`;
});

const autoRefreshLabel = computed(
  () => `Auto-refresh ${Math.round(props.pollingIntervalMs / 1000)}s`,
);
</script>

<template>
  <v-card class="pa-4 mb-4">
    <div class="d-flex flex-column flex-lg-row align-lg-center justify-space-between ga-4">
      <div class="d-flex flex-column flex-md-row ga-3 flex-grow-1">
        <v-select
          :model-value="modelValue"
          :items="statusOptions"
          item-title="title"
          item-value="value"
          label="Status filter"
          variant="outlined"
          density="comfortable"
          hide-details
          max-width="260"
          @update:model-value="emit('update:modelValue', $event)"
        />

        <v-switch
          :model-value="autoRefreshEnabled"
          color="primary"
          density="comfortable"
          hide-details
          inset
          :label="autoRefreshLabel"
          @update:model-value="emit('update:autoRefreshEnabled', Boolean($event))"
        />
      </div>

      <div class="d-flex align-center flex-wrap justify-end ga-2">
        <v-chip
          class="music-shell-chip"
          size="small"
          variant="outlined"
        >
          {{ refreshLabel }}
        </v-chip>
        <v-chip
          v-if="focusCount"
          class="music-shell-chip"
          color="primary"
          size="small"
          variant="tonal"
        >
          Tracking {{ focusCount }} job{{ focusCount === 1 ? '' : 's' }}
        </v-chip>
        <v-btn
          color="primary"
          variant="tonal"
          :loading="refreshing"
          @click="emit('refresh')"
        >
          Refresh
        </v-btn>
      </div>
    </div>
  </v-card>
</template>
