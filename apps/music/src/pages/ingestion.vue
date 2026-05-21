<script setup lang="ts">
import { computed, ref } from 'vue';
import TitleAutocomplete from '~/components/discovery/TitleAutocomplete.vue';
import FileUploadForm from '~/components/ingestion/FileUploadForm.vue';
import UrlIngestionForm from '~/components/ingestion/UrlIngestionForm.vue';
import { useIngestionActions } from '~/composables/useIngestionActions';
import {
  buildSuggestionReferenceKey,
  type AutocompleteSuggestionViewModel,
} from '~/types/music';
import {
  DEFAULT_MUSIC_UPLOAD_LIMIT_MB,
  MUSIC_ACCEPTED_UPLOAD_EXTENSIONS,
} from '~/utils/constants';
import { formatRelativeTime, formatUploadLimit } from '~/utils/formatters';

const ingestion = useIngestionActions();
const selectedSuggestion = ref<AutocompleteSuggestionViewModel | null>(null);

const urlSuccessKey = computed(() => {
  const workflow = ingestion.ingestionWorkflow.value;
  if (workflow.lastSource !== 'url' || workflow.error) {
    return null;
  }

  return workflow.lastSubmittedAt;
});

const uploadSuccessKey = computed(() => {
  const workflow = ingestion.ingestionWorkflow.value;
  if (workflow.lastSource !== 'upload' || workflow.error) {
    return null;
  }

  return workflow.lastSubmittedAt;
});

const urlSubmitError = computed(() =>
  ingestion.lastSubmissionSource.value === 'url'
    ? ingestion.lastSubmissionError.value
    : null,
);

const uploadSubmitError = computed(() =>
  ingestion.lastSubmissionSource.value === 'upload'
    ? ingestion.lastSubmissionError.value
    : null,
);

const lastCreatedJobIds = computed(() => {
  const lastSubmission = ingestion.lastSubmission.value;
  if (!lastSubmission) {
    return [];
  }

  if (lastSubmission.createdJobIds.length > 0) {
    return lastSubmission.createdJobIds;
  }

  return lastSubmission.createdJobs.map((job) => job.id);
});

const jobsLink = computed(() => {
  const focus = lastCreatedJobIds.value.join(',');

  return {
    path: '/jobs',
    query: focus ? { focus } : {},
  };
});

const prefillUrl = computed(
  () =>
    selectedSuggestion.value?.reference.resolvedUrl ??
    selectedSuggestion.value?.resolvedUrl ??
    null,
);

const prefillLabel = computed(
  () => selectedSuggestion.value?.reference.label ?? null,
);

const prefillKey = computed(() =>
  selectedSuggestion.value
    ? buildSuggestionReferenceKey(selectedSuggestion.value.reference)
    : null,
);

const discoverySeedMessage = computed(() => {
  if (!selectedSuggestion.value) {
    return '';
  }

  if (prefillUrl.value) {
    return `${selectedSuggestion.value.reference.label} returned a resolved URL, so the URL ingestion form below is prefilled without rebuilding the payload shape locally.`;
  }

  return `${selectedSuggestion.value.reference.label} is still reusable as a stable reference, but this provider did not return a resolved URL. Keep the operator label for traceability or continue in discovery for similar-search and batch ingestion.`;
});

const discoverySeedAlertType = computed(() =>
  prefillUrl.value ? 'success' : 'info',
);

async function handleUrlSubmit(payload: { url: string; label?: string }) {
  await ingestion.submitUrlIngestion(payload);
}

async function handleUploadSubmit(payload: { files: File[]; sourceLabel?: string }) {
  await ingestion.submitUploadIngestion(payload);
}
</script>

<template>
  <div>
    <SharedSectionHeader
      kicker="Ingestion"
      title="URL and upload entry points"
      description="Queue remote sources or local files, then hand off immediately into canonical jobs monitoring without losing the operator trail."
    >
      <template #actions>
        <v-chip
          class="music-shell-chip"
          color="primary"
          variant="tonal"
          size="small"
        >
          Default limit {{ formatUploadLimit(DEFAULT_MUSIC_UPLOAD_LIMIT_MB) }}
        </v-chip>
        <v-chip
          class="music-shell-chip"
          color="secondary"
          variant="tonal"
          size="small"
        >
          {{ MUSIC_ACCEPTED_UPLOAD_EXTENSIONS.length }} common audio formats
        </v-chip>
      </template>
    </SharedSectionHeader>

    <v-row class="mb-2">
      <v-col cols="12">
        <TitleAutocomplete v-model="selectedSuggestion" />

        <v-alert
          v-if="selectedSuggestion"
          class="mt-4"
          :type="discoverySeedAlertType"
          variant="tonal"
        >
          {{ discoverySeedMessage }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        lg="6"
      >
        <UrlIngestionForm
          :pending="ingestion.isSubmittingUrl.value"
          :disabled="ingestion.isSubmitting.value"
          :submit-error="urlSubmitError"
          :success-key="urlSuccessKey"
          :prefill-url="prefillUrl"
          :prefill-label="prefillLabel"
          :prefill-key="prefillKey"
          @submit="handleUrlSubmit"
        />
      </v-col>

      <v-col
        cols="12"
        lg="6"
      >
        <FileUploadForm
          :pending="ingestion.isSubmittingUpload.value"
          :disabled="ingestion.isSubmitting.value"
          :submit-error="uploadSubmitError"
          :success-key="uploadSuccessKey"
          :upload-limit-mb="DEFAULT_MUSIC_UPLOAD_LIMIT_MB"
          :accepted-extensions="MUSIC_ACCEPTED_UPLOAD_EXTENSIONS"
          @submit="handleUploadSubmit"
        />
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12">
        <v-card
          v-if="ingestion.lastSubmission.value"
          class="pa-5"
        >
          <div class="d-flex flex-column flex-md-row justify-space-between align-md-start ga-4 mb-4">
            <div>
              <div class="music-kicker mb-2">
                Submission trace
              </div>
              <div class="text-h6 font-weight-bold mb-2">
                {{ ingestion.lastSubmissionSource.value === 'upload' ? 'Upload' : 'URL' }} request accepted
              </div>
              <p class="music-copy-muted text-body-2 mb-0">
                {{ ingestion.lastSubmission.value.message || `${ingestion.lastSubmission.value.acceptedCount} source${ingestion.lastSubmission.value.acceptedCount === 1 ? '' : 's'} accepted` }}
                <span v-if="ingestion.ingestionWorkflow.value.lastSubmittedAt">
                  • {{ formatRelativeTime(ingestion.ingestionWorkflow.value.lastSubmittedAt) }}
                </span>
              </p>
            </div>

            <v-btn
              color="primary"
              :to="jobsLink"
            >
              Open jobs monitoring
            </v-btn>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="jobId in lastCreatedJobIds"
              :key="jobId"
              class="music-shell-chip"
              color="primary"
              variant="tonal"
            >
              {{ jobId }}
            </v-chip>
          </div>
        </v-card>

        <v-card
          v-else-if="ingestion.lastSubmissionError.value"
          class="pa-5"
        >
          <div class="music-kicker mb-2">
            Latest failure
          </div>
          <div class="text-h6 font-weight-bold mb-2">
            Submission did not queue a job
          </div>
          <p class="music-copy-muted text-body-2 mb-4">
            {{ ingestion.lastSubmissionError.value }}
          </p>
          <v-btn
            variant="tonal"
            color="primary"
            @click="ingestion.clearFeedback"
          >
            Clear feedback
          </v-btn>
        </v-card>

        <SharedEmptyState
          v-else
          title="No ingestion submitted yet"
          message="Use either surface above to enqueue work, then follow it through the jobs monitor with the same canonical contract."
        />
      </v-col>
    </v-row>
  </div>
</template>
