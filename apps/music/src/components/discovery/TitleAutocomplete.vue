<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import AutocompleteSuggestionList from '~/components/discovery/AutocompleteSuggestionList.vue';
import { useMusicApi } from '~/composables/useMusicApi';
import type { AutocompleteSuggestionViewModel } from '~/types/music';
import {
  MUSIC_AUTOCOMPLETE_DEBOUNCE_MS,
  MUSIC_AUTOCOMPLETE_LIMIT,
  MUSIC_AUTOCOMPLETE_MIN_QUERY_LENGTH,
} from '~/utils/constants';

const props = withDefaults(
  defineProps<{
    modelValue?: AutocompleteSuggestionViewModel | null;
    title?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    minLength?: number;
    debounceMs?: number;
    limit?: number;
  }>(),
  {
    modelValue: null,
    title: 'Title autocomplete',
    description:
      'Search known tracks and reuse the stable reference payload instead of rebuilding title, artist, and provider fields locally.',
    placeholder: 'Start with a title or artist',
    disabled: false,
    minLength: MUSIC_AUTOCOMPLETE_MIN_QUERY_LENGTH,
    debounceMs: MUSIC_AUTOCOMPLETE_DEBOUNCE_MS,
    limit: MUSIC_AUTOCOMPLETE_LIMIT,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: AutocompleteSuggestionViewModel | null];
}>();

const api = useMusicApi();
const query = ref('');
const suggestions = ref<AutocompleteSuggestionViewModel[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const highlightedIndex = ref(-1);
const lastCompletedQuery = ref<string | null>(null);
const syncingFromModel = ref(false);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let requestSequence = 0;

const trimmedQuery = computed(() => query.value.trim());
const remainingCharacters = computed(() =>
  Math.max(props.minLength - trimmedQuery.value.length, 0),
);
const hasSuggestions = computed(() => suggestions.value.length > 0);
const showIdleState = computed(() => trimmedQuery.value.length === 0);
const showTooShortState = computed(
  () => trimmedQuery.value.length > 0 && trimmedQuery.value.length < props.minLength,
);
const showNoResultsState = computed(
  () =>
    Boolean(trimmedQuery.value) &&
    !loading.value &&
    !error.value &&
    !showTooShortState.value &&
    lastCompletedQuery.value === trimmedQuery.value &&
    suggestions.value.length === 0,
);

function clearPendingLookup() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

function resetSuggestions() {
  suggestions.value = [];
  highlightedIndex.value = -1;
}

function getErrorMessage(fallback: string, lookupError: unknown): string {
  if (lookupError instanceof Error && lookupError.message.trim().length > 0) {
    return lookupError.message;
  }

  const message =
    typeof lookupError === 'object' && lookupError !== null && 'message' in lookupError
      ? (lookupError as { message?: unknown }).message
      : undefined;

  return typeof message === 'string' && message.trim().length > 0
    ? message
    : fallback;
}

async function runLookup(normalizedQuery: string) {
  const currentSequence = ++requestSequence;
  loading.value = true;
  error.value = null;

  try {
    const result = await api.fetchTitleAutocomplete({
      query: normalizedQuery,
      limit: props.limit,
    });

    if (currentSequence !== requestSequence) {
      return;
    }

    suggestions.value = result;
    highlightedIndex.value = result.length > 0 ? 0 : -1;
    lastCompletedQuery.value = normalizedQuery;
  } catch (lookupError) {
    if (currentSequence !== requestSequence) {
      return;
    }

    resetSuggestions();
    error.value = getErrorMessage(
      'Unable to load title suggestions right now.',
      lookupError,
    );
    lastCompletedQuery.value = normalizedQuery;
  } finally {
    if (currentSequence === requestSequence) {
      loading.value = false;
    }
  }
}

function scheduleLookup(normalizedQuery: string) {
  clearPendingLookup();
  debounceTimer = setTimeout(() => {
    void runLookup(normalizedQuery);
  }, props.debounceMs);
}

function selectSuggestion(suggestion: AutocompleteSuggestionViewModel) {
  clearPendingLookup();
  error.value = null;
  resetSuggestions();
  syncingFromModel.value = true;
  query.value = suggestion.reference.label;
  emit('update:modelValue', suggestion);
  void nextTick(() => {
    syncingFromModel.value = false;
  });
}

function clearSelection() {
  clearPendingLookup();
  requestSequence += 1;
  error.value = null;
  lastCompletedQuery.value = null;
  resetSuggestions();
  syncingFromModel.value = true;
  query.value = '';
  emit('update:modelValue', null);
  void nextTick(() => {
    syncingFromModel.value = false;
  });
}

function moveHighlight(delta: number) {
  if (!suggestions.value.length) {
    return;
  }

  const lastIndex = suggestions.value.length - 1;
  if (highlightedIndex.value < 0) {
    highlightedIndex.value = 0;
    return;
  }

  highlightedIndex.value =
    highlightedIndex.value + delta > lastIndex
      ? 0
      : highlightedIndex.value + delta < 0
        ? lastIndex
        : highlightedIndex.value + delta;
}

function selectHighlighted() {
  const suggestion = suggestions.value[highlightedIndex.value] ?? suggestions.value[0];
  if (!suggestion) {
    return;
  }

  selectSuggestion(suggestion);
}

function retryLookup() {
  if (!trimmedQuery.value || showTooShortState.value) {
    return;
  }

  void runLookup(trimmedQuery.value);
}

watch(
  () => props.modelValue,
  (current) => {
    const nextLabel = current?.reference.label ?? '';
    if (query.value === nextLabel) {
      return;
    }

    syncingFromModel.value = true;
    query.value = nextLabel;
    if (!current) {
      error.value = null;
      lastCompletedQuery.value = null;
      resetSuggestions();
    }

    void nextTick(() => {
      syncingFromModel.value = false;
    });
  },
  { immediate: true },
);

watch(query, (value) => {
  if (syncingFromModel.value) {
    return;
  }

  const normalizedQuery = value.trim();
  error.value = null;

  if (
    props.modelValue &&
    normalizedQuery !== props.modelValue.reference.label.trim()
  ) {
    emit('update:modelValue', null);
  }

  if (!normalizedQuery) {
    clearPendingLookup();
    requestSequence += 1;
    lastCompletedQuery.value = null;
    resetSuggestions();
    loading.value = false;
    return;
  }

  if (normalizedQuery.length < props.minLength) {
    clearPendingLookup();
    requestSequence += 1;
    lastCompletedQuery.value = null;
    resetSuggestions();
    loading.value = false;
    return;
  }

  scheduleLookup(normalizedQuery);
});

onBeforeUnmount(() => {
  clearPendingLookup();
});
</script>

<template>
  <v-card class="pa-5 h-100">
    <div class="d-flex align-center justify-space-between ga-3 mb-4">
      <div>
        <div class="music-kicker mb-2">
          Discovery seed
        </div>
        <div class="text-h6 font-weight-bold">
          {{ title }}
        </div>
      </div>
      <v-chip
        class="music-shell-chip"
        color="primary"
        variant="tonal"
        size="small"
      >
        Stable reference payload
      </v-chip>
    </div>

    <p class="music-copy-muted text-body-2 mb-4">
      {{ description }}
    </p>

    <v-text-field
      v-model="query"
      :label="title"
      :placeholder="placeholder"
      variant="outlined"
      density="comfortable"
      hide-details="auto"
      :disabled="disabled"
      @keydown.down.prevent="moveHighlight(1)"
      @keydown.up.prevent="moveHighlight(-1)"
      @keydown.enter.prevent="selectHighlighted"
      @keydown.esc.prevent="clearSelection"
    >
      <template #append-inner>
        <v-btn
          v-if="query"
          icon="mdi-close"
          variant="text"
          size="x-small"
          @click.stop="clearSelection"
        />
      </template>
    </v-text-field>

    <v-alert
      v-if="showIdleState"
      type="info"
      variant="tonal"
      class="mt-4"
    >
      Start with a known title to seed similar discovery or prefill URL ingestion without rebuilding title, artist, and provider fields.
    </v-alert>

    <v-alert
      v-else-if="showTooShortState"
      type="info"
      variant="tonal"
      class="mt-4"
    >
      Type {{ remainingCharacters }} more character{{ remainingCharacters === 1 ? '' : 's' }} before autocomplete runs.
    </v-alert>

    <SharedLoadingSpinner
      v-else-if="loading"
      class="mt-4"
      label="Loading title matches"
      :size="24"
    />

    <div
      v-else-if="error"
      class="mt-4"
    >
      <v-alert
        type="error"
        variant="tonal"
        class="mb-3"
      >
        {{ error }}
      </v-alert>
      <v-btn
        variant="tonal"
        color="error"
        @click="retryLookup"
      >
        Retry title search
      </v-btn>
    </div>

    <v-alert
      v-else-if="showNoResultsState"
      type="warning"
      variant="tonal"
      class="mt-4"
    >
      No known title matched "{{ trimmedQuery }}". Keep typing or change the seed term.
    </v-alert>

    <AutocompleteSuggestionList
      v-else-if="hasSuggestions"
      :suggestions="suggestions"
      :highlighted-index="highlightedIndex"
      @highlight="highlightedIndex = $event"
      @select="selectSuggestion"
    />
  </v-card>
</template>
