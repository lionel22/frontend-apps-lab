<script setup lang="ts">
import { computed } from 'vue';
import JobStatusChip from '~/components/jobs/JobStatusChip.vue';
import type { IngestionJobViewModel } from '~/types/music';
import { formatDateTime, formatRelativeTime } from '~/utils/formatters';

const props = withDefaults(
  defineProps<{
    jobs: IngestionJobViewModel[];
    highlightedJobIds?: string[];
    emptyMessage?: string;
  }>(),
  {
    highlightedJobIds: () => [],
    emptyMessage: 'No jobs match the current filter.',
  },
);

const highlightedSet = computed(() => new Set(props.highlightedJobIds));

function isHighlighted(jobId: string): boolean {
  return highlightedSet.value.has(jobId);
}
</script>

<template>
  <v-card class="overflow-hidden">
    <v-table
      density="comfortable"
      fixed-header
      hover
    >
      <thead>
        <tr>
          <th>Status</th>
          <th>Source</th>
          <th>Job ID</th>
          <th>Updated</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!jobs.length">
          <td
            colspan="5"
            class="text-center text-medium-emphasis py-8"
          >
            {{ emptyMessage }}
          </td>
        </tr>

        <tr
          v-for="job in jobs"
          :id="`job-${job.id}`"
          :key="job.id"
          :class="{ 'music-job-highlighted': isHighlighted(job.id) }"
        >
          <td>
            <JobStatusChip :status="job.status" />
          </td>
          <td>
            <div class="font-weight-medium text-body-2">
              {{ job.sourceLabel }}
            </div>
            <div class="text-caption music-copy-muted mt-1">
              {{ job.sourceType || 'Source classification pending' }}
            </div>
            <div
              v-if="job.errorMessage"
              class="text-caption text-error mt-2"
            >
              {{ job.errorMessage }}
            </div>
            <v-chip
              v-if="isHighlighted(job.id)"
              class="music-shell-chip mt-2"
              color="primary"
              size="x-small"
              variant="tonal"
            >
              Tracked from ingestion
            </v-chip>
          </td>
          <td class="music-mono text-caption">
            {{ job.id }}
          </td>
          <td>
            <div class="text-body-2">
              {{ formatDateTime(job.updatedAt) }}
            </div>
            <div class="text-caption music-copy-muted mt-1">
              {{ formatRelativeTime(job.updatedAt) }}
            </div>
          </td>
          <td>
            <div class="text-body-2">
              {{ formatDateTime(job.createdAt) }}
            </div>
            <div class="text-caption music-copy-muted mt-1">
              Last update {{ formatRelativeTime(job.updatedAt) }}
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<style scoped>
.music-job-highlighted td {
  background: rgba(97, 218, 251, 0.08);
}
</style>
