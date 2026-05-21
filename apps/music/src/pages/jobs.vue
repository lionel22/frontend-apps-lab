<script setup lang="ts">
import { computed } from 'vue';
import JobsList from '~/components/jobs/JobsList.vue';
import JobsToolbar from '~/components/jobs/JobsToolbar.vue';
import { useJobPolling } from '~/composables/useJobPolling';

const route = useRoute();

const focusedJobIds = computed(() => {
  const rawFocus = route.query.focus;
  const serializedFocus = Array.isArray(rawFocus)
    ? rawFocus.join(',')
    : rawFocus;

  if (typeof serializedFocus !== 'string') {
    return [];
  }

  return serializedFocus
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
});

const jobsPolling = useJobPolling({
  initialStatus: focusedJobIds.value.length > 0 ? 'all' : undefined,
});

const selectedStatus = computed({
  get: () => jobsPolling.statusFilter.value,
  set: (value) => jobsPolling.setStatusFilter(value),
});

const autoRefreshEnabled = computed({
  get: () => jobsPolling.polling.value.enabled,
  set: (value) => jobsPolling.setAutoRefreshEnabled(value),
});

const summaryCards = computed(() => {
  const summary = jobsPolling.jobs.value.summaryCounts;
  return [
    { title: 'Queued', value: summary.queued, color: 'warning' },
    { title: 'Processing', value: summary.processing, color: 'info' },
    { title: 'Success', value: summary.success, color: 'success' },
    { title: 'Failed', value: summary.failed, color: 'error' },
    { title: 'Active', value: summary.active, color: 'primary' },
    { title: 'Recent failures', value: summary.recentFailures, color: 'error' },
  ];
});

const missingFocusedJobIds = computed(() => {
  const visibleIds = new Set(jobsPolling.jobs.value.items.map((job) => job.id));
  return focusedJobIds.value.filter((jobId) => !visibleIds.has(jobId));
});

async function refreshJobs() {
  await jobsPolling.refresh({ manual: true }).catch(() => undefined);
}
</script>

<template>
  <div>
    <SharedSectionHeader
      kicker="Jobs"
      title="Canonical monitoring surface"
      description="Filter, refresh, and auto-refresh the same jobs payload that powers Sequence 0 dashboard foundations, with explicit traceability back from ingestion submissions."
    >
      <template #actions>
        <v-chip
          class="music-shell-chip"
          :color="autoRefreshEnabled ? 'secondary' : 'default'"
          variant="tonal"
          size="small"
        >
          {{ autoRefreshEnabled ? `Polling every ${Math.round(jobsPolling.polling.value.intervalMs / 1000)}s` : 'Polling paused' }}
        </v-chip>
      </template>
    </SharedSectionHeader>

    <v-row class="mb-2">
      <v-col
        v-for="card in summaryCards"
        :key="card.title"
        cols="6"
        md="4"
        xl="2"
      >
        <v-card class="pa-4 h-100">
          <div class="music-kicker mb-2">
            {{ card.title }}
          </div>
          <div class="music-metric-value mb-1">
            {{ card.value }}
          </div>
          <v-chip
            class="music-shell-chip"
            :color="card.color"
            size="small"
            variant="tonal"
          >
            Canonical jobs read
          </v-chip>
        </v-card>
      </v-col>
    </v-row>

    <JobsToolbar
      v-model="selectedStatus"
      v-model:auto-refresh-enabled="autoRefreshEnabled"
      :refreshing="jobsPolling.jobsState.value.loading || jobsPolling.jobsState.value.refreshing"
      :last-loaded-at="jobsPolling.jobsState.value.lastLoadedAt"
      :polling-interval-ms="jobsPolling.polling.value.intervalMs"
      :focus-count="focusedJobIds.length"
      @refresh="refreshJobs"
    />

    <v-alert
      v-if="missingFocusedJobIds.length"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      Tracking {{ missingFocusedJobIds.length }} created job{{ missingFocusedJobIds.length === 1 ? '' : 's' }} from ingestion, but they are not visible in the current refresh yet. Keep the filter on all or refresh again.
    </v-alert>

    <v-alert
      v-if="jobsPolling.jobsState.value.error && jobsPolling.jobs.value.items.length"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ jobsPolling.jobsState.value.error }}
    </v-alert>

    <SharedLoadingSpinner
      v-if="jobsPolling.jobsState.value.loading && !jobsPolling.jobs.value.items.length"
      label="Loading canonical ingestion jobs"
    />

    <SharedErrorState
      v-else-if="jobsPolling.jobsState.value.error && !jobsPolling.jobs.value.items.length"
      title="Jobs could not be loaded"
      :error="jobsPolling.jobsState.value.error"
      @retry="refreshJobs"
    />

    <SharedEmptyState
      v-else-if="!jobsPolling.jobs.value.items.length"
      title="No jobs match this view"
      message="Queue a URL or upload from the ingestion page, then come back here to monitor queued, processing, success, and failed states."
      action-label="Open ingestion"
      @action="navigateTo('/ingestion')"
    />

    <JobsList
      v-else
      :jobs="jobsPolling.jobs.value.items"
      :highlighted-job-ids="focusedJobIds"
    />
  </div>
</template>
