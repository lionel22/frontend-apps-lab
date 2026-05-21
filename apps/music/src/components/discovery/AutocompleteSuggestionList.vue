<script setup lang="ts">
import type { AutocompleteSuggestionViewModel } from '~/types/music';
import { formatProviderLabel } from '~/utils/formatters';

defineProps<{
  suggestions: AutocompleteSuggestionViewModel[];
  highlightedIndex: number;
}>();

const emit = defineEmits<{
  highlight: [index: number];
  select: [suggestion: AutocompleteSuggestionViewModel];
}>();
</script>

<template>
  <div class="music-suggestion-list mt-4">
    <div class="music-kicker px-4 pt-4 pb-2">
      Suggestions
    </div>
    <v-list
      bg-color="transparent"
      class="pa-0"
      role="listbox"
    >
      <v-list-item
        v-for="(suggestion, index) in suggestions"
        :key="`${suggestion.reference.provider}-${suggestion.reference.externalId ?? suggestion.reference.label}-${index}`"
        :active="index === highlightedIndex"
        class="music-suggestion-item px-4 py-3"
        role="option"
        tabindex="0"
        @click="emit('select', suggestion)"
        @focus="emit('highlight', index)"
        @mouseenter="emit('highlight', index)"
        @keydown.enter.prevent="emit('select', suggestion)"
        @keydown.space.prevent="emit('select', suggestion)"
      >
        <div class="d-flex justify-space-between align-start ga-3 flex-wrap">
          <div>
            <div class="text-subtitle-1 font-weight-bold">
              {{ suggestion.title }}
            </div>
            <div class="text-body-2 music-copy-muted">
              {{ suggestion.artist || 'Artist metadata unavailable' }}
            </div>
            <div class="text-caption music-copy-muted mt-2">
              {{ suggestion.sourceLabel }}
            </div>
          </div>

          <div class="d-flex flex-wrap justify-end ga-2">
            <v-chip
              class="music-shell-chip"
              color="primary"
              size="small"
              variant="tonal"
            >
              {{ formatProviderLabel(suggestion.provider) }}
            </v-chip>
            <v-chip
              v-if="suggestion.reference.externalId"
              class="music-shell-chip"
              size="small"
              variant="outlined"
            >
              {{ suggestion.reference.externalId }}
            </v-chip>
            <v-chip
              v-if="suggestion.resolvedUrl || suggestion.reference.resolvedUrl"
              class="music-shell-chip"
              color="secondary"
              size="small"
              variant="tonal"
            >
              URL ready
            </v-chip>
          </div>
        </div>
      </v-list-item>
    </v-list>
  </div>
</template>

<style scoped>
.music-suggestion-list {
  border: 1px solid var(--music-border);
  border-radius: 20px;
  background: rgba(8, 17, 26, 0.42);
}

.music-suggestion-item + .music-suggestion-item {
  border-top: 1px solid var(--music-border);
}
</style>
