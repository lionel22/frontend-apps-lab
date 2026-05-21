<script setup lang="ts">
import { computed } from 'vue';
import type {
  AutocompleteSuggestionViewModel,
  MusicDiscoveryMode,
} from '~/types/music';
import {
  formatDiscoveryMode,
  formatProviderLabel,
  formatRelativeTime,
} from '~/utils/formatters';

const props = withDefaults(
  defineProps<{
    selectedSuggestion?: AutocompleteSuggestionViewModel | null;
    mode: MusicDiscoveryMode;
    pending?: boolean;
    providerUsed?: string | null;
    lastCompletedAt?: string | null;
  }>(),
  {
    selectedSuggestion: null,
    pending: false,
    providerUsed: null,
    lastCompletedAt: null,
  },
);

const emit = defineEmits<{
  'update:mode': [value: MusicDiscoveryMode];
  submit: [];
  clearSeed: [];
}>();

const modeModel = computed({
  get: () => props.mode,
  set: (value: MusicDiscoveryMode) => emit('update:mode', value),
});

const providerChipLabel = computed(() =>
  props.providerUsed
    ? formatProviderLabel(props.providerUsed)
    : props.mode === 'llm'
      ? 'Awaiting LLM provider response'
      : 'Awaiting backend catalog provider',
);
</script>

<template>
  <v-card class="pa-5 h-100">
    <div class="d-flex align-center justify-space-between ga-3 mb-4">
      <div>
        <div class="music-kicker mb-2">
          Similar search
        </div>
        <div class="text-h6 font-weight-bold">
          Explore related tracks
        </div>
      </div>
      <div class="d-flex flex-wrap ga-2 justify-end">
        <v-chip
          class="music-shell-chip"
          color="secondary"
          variant="tonal"
          size="small"
        >
          {{ formatDiscoveryMode(mode) }}
        </v-chip>
        <v-chip
          class="music-shell-chip"
          color="primary"
          variant="tonal"
          size="small"
        >
          {{ providerChipLabel }}
        </v-chip>
      </div>
    </div>

    <p class="music-copy-muted text-body-2 mb-4">
      Switch between `LLM` and `catalog` modes on the same stable seed reference. The backend still decides the concrete provider, and the UI keeps retry or mode switching explicit.
    </p>

    <v-alert
      v-if="selectedSuggestion"
      type="success"
      variant="tonal"
      class="mb-4"
    >
      Seeding from <strong>{{ selectedSuggestion.reference.label }}</strong>
      <span v-if="selectedSuggestion.reference.externalId">
        • {{ selectedSuggestion.reference.externalId }}
      </span>
    </v-alert>

    <v-alert
      v-else
      type="info"
      variant="tonal"
      class="mb-4"
    >
      Pick a title from autocomplete first. The search request reuses the same stable reference payload rather than retyping title and artist.
    </v-alert>

    <v-btn-toggle
      v-model="modeModel"
      class="mb-4"
      color="primary"
      divided
      mandatory
      :disabled="pending"
    >
      <v-btn value="catalog">
        Catalog
      </v-btn>
      <v-btn value="llm">
        LLM
      </v-btn>
    </v-btn-toggle>

    <div class="d-flex align-center justify-space-between flex-wrap ga-3">
      <div class="text-caption music-copy-muted">
        <span v-if="lastCompletedAt">
          Last completed {{ formatRelativeTime(lastCompletedAt) }}
        </span>
        <span v-else>
          No similar search completed yet.
        </span>
      </div>

      <div class="d-flex flex-wrap ga-2 justify-end">
        <v-btn
          variant="text"
          :disabled="pending || !selectedSuggestion"
          @click="emit('clearSeed')"
        >
          Clear seed
        </v-btn>
        <v-btn
          color="primary"
          :loading="pending"
          :disabled="pending || !selectedSuggestion"
          @click="emit('submit')"
        >
          Search similar tracks
        </v-btn>
      </div>
    </div>
  </v-card>
</template>
