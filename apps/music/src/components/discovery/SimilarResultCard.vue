<script setup lang="ts">
import type { SimilarResultViewModel } from '~/types/music';
import { formatConfidence, formatProviderLabel } from '~/utils/formatters';

defineProps<{
  result: SimilarResultViewModel;
  selected: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <v-card class="pa-4 h-100 d-flex flex-column justify-space-between">
    <div>
      <div class="d-flex justify-space-between align-start ga-3 mb-3">
        <div>
          <div class="music-kicker mb-2">
            Similar candidate
          </div>
          <div class="text-h6 font-weight-bold">
            {{ result.title }}
          </div>
          <div class="text-body-2 music-copy-muted">
            {{ result.artist || 'Artist metadata unavailable' }}
          </div>
        </div>

        <v-chip
          class="music-shell-chip"
          :color="selected ? 'success' : 'primary'"
          size="small"
          variant="tonal"
        >
          {{ selected ? 'Selected' : 'Available' }}
        </v-chip>
      </div>

      <div class="d-flex flex-wrap ga-2 mb-3">
        <v-chip
          class="music-shell-chip"
          color="primary"
          size="small"
          variant="tonal"
        >
          {{ formatProviderLabel(result.providerUsed) }}
        </v-chip>
        <v-chip
          v-if="result.confidence !== undefined"
          class="music-shell-chip"
          size="small"
          variant="outlined"
        >
          {{ formatConfidence(result.confidence) }}
        </v-chip>
        <v-chip
          v-if="result.reference.externalId"
          class="music-shell-chip"
          size="small"
          variant="outlined"
        >
          {{ result.reference.externalId }}
        </v-chip>
      </div>

      <div class="text-body-2 music-copy-muted mb-3">
        {{ result.sourceLabel || result.reference.label }}
      </div>

      <v-alert
        v-if="result.resolvedUrl || result.reference.resolvedUrl"
        type="info"
        variant="tonal"
        density="compact"
      >
        Provider returned a resolved source URL for this candidate.
      </v-alert>
    </div>

    <v-btn
      class="mt-4"
      :color="selected ? 'success' : 'primary'"
      :variant="selected ? 'flat' : 'tonal'"
      block
      @click="emit('toggle')"
    >
      {{ selected ? 'Remove from shortlist' : 'Add to shortlist' }}
    </v-btn>
  </v-card>
</template>
