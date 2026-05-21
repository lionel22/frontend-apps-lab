<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import SelectionBar from '~/components/discovery/SelectionBar.vue';
import SimilarResultsList from '~/components/discovery/SimilarResultsList.vue';
import SimilarSearchForm from '~/components/discovery/SimilarSearchForm.vue';
import TitleAutocomplete from '~/components/discovery/TitleAutocomplete.vue';
import { useBatchIngestion } from '~/composables/useBatchIngestion';
import { useSelection } from '~/composables/useSelection';
import { useSimilarDiscovery } from '~/composables/useSimilarDiscovery';
import {
  buildSuggestionReferenceKey,
  type AutocompleteSuggestionViewModel,
  type MusicDiscoveryMode,
} from '~/types/music';
import { MUSIC_SIMILAR_RESULT_LIMIT } from '~/utils/constants';
import {
  formatDiscoveryMode,
  formatProviderLabel,
  formatRelativeTime,
} from '~/utils/formatters';

const selectedSuggestion = ref<AutocompleteSuggestionViewModel | null>(null);
const selectedMode = ref<MusicDiscoveryMode>('catalog');
const similarDiscovery = useSimilarDiscovery();
const batchIngestion = useBatchIngestion();
const selection = useSelection();

const providerChipLabel = computed(() =>
  similarDiscovery.providerUsed.value
    ? formatProviderLabel(similarDiscovery.providerUsed.value)
    : `Awaiting ${formatDiscoveryMode(selectedMode.value)} result`,
);

const shouldShowSelectionBar = computed(
  () => selection.hasSelection.value || similarDiscovery.items.value.length > 0,
);

const shouldShowEmptyResults = computed(
  () =>
    Boolean(selectedSuggestion.value) &&
    similarDiscovery.hasAttemptedSearch.value &&
    !similarDiscovery.isLoading.value &&
    !similarDiscovery.error.value &&
    similarDiscovery.items.value.length === 0,
);

const jobsLink = computed(() => {
  const focus = batchIngestion.lastResult.value?.createdJobIds.join(',') ?? '';

  return {
    path: '/jobs',
    query: focus ? { focus } : {},
  };
});

const batchOutcomeTitle = computed(() => {
  const lastResult = batchIngestion.lastResult.value;
  if (!lastResult) {
    return '';
  }

  return lastResult.failedReferences.length > 0
    ? 'Partial batch outcome'
    : 'Batch queued for monitoring';
});

const batchOutcomeMessage = computed(() => {
  const lastResult = batchIngestion.lastResult.value;
  if (!lastResult) {
    return '';
  }

  const createdCount = lastResult.createdJobIds.length;
  const failedCount = lastResult.failedReferences.length;
  if (!failedCount) {
    return `${createdCount} job${createdCount === 1 ? '' : 's'} created from the current shortlist.`;
  }

  return `${createdCount} job${createdCount === 1 ? '' : 's'} created, while ${failedCount} selection${failedCount === 1 ? '' : 's'} still need manual retry or deselection.`;
});

async function runSimilarSearch() {
  if (!selectedSuggestion.value) {
    return;
  }

  similarDiscovery.setReference(selectedSuggestion.value.reference);
  await similarDiscovery
    .search({
      reference: selectedSuggestion.value.reference,
      mode: selectedMode.value,
      limit: MUSIC_SIMILAR_RESULT_LIMIT,
    })
    .catch(() => undefined);
}

async function retrySimilarSearch() {
  await similarDiscovery.retry().catch(() => undefined);
}

async function submitSelectedBatch() {
  if (!selection.selectedReferences.value.length) {
    return;
  }

  await batchIngestion
    .submit({
      searchId: similarDiscovery.searchId.value ?? undefined,
      references: selection.selectedReferences.value,
    })
    .catch(() => undefined);
}

watch(selectedMode, (mode, previousMode) => {
  similarDiscovery.setMode(mode);
  if (
    mode === previousMode ||
    !selectedSuggestion.value ||
    !similarDiscovery.hasAttemptedSearch.value
  ) {
    return;
  }

  void runSimilarSearch();
});

watch(selectedSuggestion, (current, previous) => {
  const currentKey = current
    ? buildSuggestionReferenceKey(current.reference)
    : null;
  const previousKey = previous
    ? buildSuggestionReferenceKey(previous.reference)
    : null;

  if (currentKey === previousKey) {
    return;
  }

  batchIngestion.clearResult();
  selection.clear();
  similarDiscovery.reset();

  if (!current) {
    return;
  }
});
</script>

<template>
  <div>
    <SharedSectionHeader
      kicker="Discovery"
      title="Autocomplete, similar search, and shortlist selection"
      description="Reuse stable title references, switch modes explicitly, and send a curated shortlist into ingestion without frontend provider fallback logic."
    >
      <template #actions>
        <v-chip
          class="music-shell-chip"
          color="secondary"
          variant="tonal"
          size="small"
        >
          {{ formatDiscoveryMode(selectedMode) }}
        </v-chip>
        <v-chip
          class="music-shell-chip"
          color="primary"
          variant="tonal"
          size="small"
        >
          {{ providerChipLabel }}
        </v-chip>
      </template>
    </SharedSectionHeader>

    <v-row class="mb-2">
      <v-col
        cols="12"
        lg="6"
      >
        <TitleAutocomplete v-model="selectedSuggestion" />
      </v-col>

      <v-col
        cols="12"
        lg="6"
      >
        <SimilarSearchForm
          v-model:mode="selectedMode"
          :selected-suggestion="selectedSuggestion"
          :pending="similarDiscovery.isLoading.value"
          :provider-used="similarDiscovery.providerUsed.value"
          :last-completed-at="similarDiscovery.lastCompletedAt.value"
          @submit="runSimilarSearch"
          @clear-seed="selectedSuggestion = null"
        />
      </v-col>
    </v-row>

    <SelectionBar
      v-if="shouldShowSelectionBar"
      :selected-count="selection.selectedReferences.value.length"
      :total-count="similarDiscovery.items.value.length"
      :mode="selectedMode"
      :provider-used="similarDiscovery.providerUsed.value"
      :pending="batchIngestion.isSubmitting.value"
      @clear="selection.clear()"
      @submit="submitSelectedBatch"
    />

    <v-card
      v-if="batchIngestion.lastResult.value"
      class="pa-5 mb-4"
    >
      <div class="d-flex flex-column flex-md-row justify-space-between align-md-start ga-4 mb-4">
        <div>
          <div class="music-kicker mb-2">
            Batch handoff
          </div>
          <div class="text-h6 font-weight-bold mb-2">
            {{ batchOutcomeTitle }}
          </div>
          <p class="music-copy-muted text-body-2 mb-0">
            {{ batchOutcomeMessage }}
            <span v-if="batchIngestion.lastSubmittedAt.value">
              • {{ formatRelativeTime(batchIngestion.lastSubmittedAt.value) }}
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

      <div
        v-if="batchIngestion.lastResult.value.createdJobIds.length"
        class="d-flex flex-wrap ga-2 mb-4"
      >
        <v-chip
          v-for="jobId in batchIngestion.lastResult.value.createdJobIds"
          :key="jobId"
          class="music-shell-chip"
          color="primary"
          variant="tonal"
        >
          {{ jobId }}
        </v-chip>
      </div>

      <div v-if="batchIngestion.lastResult.value.failedReferences.length">
        <div class="music-kicker mb-2">
          Selections still blocked
        </div>
        <v-list
          bg-color="transparent"
          class="pa-0"
        >
          <v-list-item
            v-for="failure in batchIngestion.lastResult.value.failedReferences"
            :key="buildSuggestionReferenceKey(failure.reference)"
            class="px-0"
          >
            <v-list-item-title>
              {{ failure.reference.label }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ failure.reason }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>
    </v-card>

    <v-alert
      v-if="batchIngestion.error.value"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ batchIngestion.error.value }}
    </v-alert>

    <SharedEmptyState
      v-if="!selectedSuggestion"
      title="No discovery seed selected yet"
      message="Pick a known title from autocomplete to seed similar-search without rebuilding the reference payload by hand."
    />

    <SharedLoadingSpinner
      v-else-if="similarDiscovery.isLoading.value"
      label="Running similar discovery"
    />

    <div v-else-if="similarDiscovery.error.value">
      <SharedErrorState
        :title="similarDiscovery.errorKind.value === 'provider-unavailable' ? 'Discovery provider unavailable' : 'Similar search could not be loaded'"
        :description="similarDiscovery.errorKind.value === 'provider-unavailable' ? 'The current seed and mode remain intact. Retry explicitly or switch mode manually; no frontend fallback was applied.' : 'The current discovery request failed before a shortlist could be shown.'"
        :error="similarDiscovery.error.value"
        :retry-label="similarDiscovery.errorKind.value === 'provider-unavailable' ? 'Retry this provider' : 'Retry search'"
        @retry="retrySimilarSearch"
      />

      <v-alert
        v-if="selection.hasSelection.value"
        type="info"
        variant="tonal"
        class="mt-4"
      >
        Existing shortlist selections were kept. Reset them manually if you want to start over.
      </v-alert>
    </div>

    <SharedEmptyState
      v-else-if="shouldShowEmptyResults"
      title="No similar tracks returned"
      message="The request completed, but the active provider did not return a shortlist for this seed. Keep the seed, retry explicitly, or switch mode manually."
      action-label="Retry similar search"
      @action="runSimilarSearch"
    />

    <SimilarResultsList
      v-else-if="similarDiscovery.items.value.length"
      :results="similarDiscovery.items.value"
    />
  </div>
</template>
