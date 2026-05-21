<script setup lang="ts">
import type { MusicDiscoveryMode } from '~/types/music';
import { formatDiscoveryMode, formatProviderLabel } from '~/utils/formatters';

withDefaults(
  defineProps<{
    selectedCount: number;
    totalCount: number;
    mode: MusicDiscoveryMode;
    providerUsed?: string | null;
    pending?: boolean;
  }>(),
  {
    providerUsed: null,
    pending: false,
  },
);

const emit = defineEmits<{
  submit: [];
  clear: [];
}>();
</script>

<template>
  <v-card class="pa-4 mb-4">
    <div class="d-flex flex-column flex-lg-row justify-space-between align-lg-center ga-4">
      <div>
        <div class="music-kicker mb-2">
          Shortlist selection
        </div>
        <div class="text-h6 font-weight-bold mb-2">
          {{ selectedCount }} of {{ totalCount }} candidate{{ totalCount === 1 ? '' : 's' }} selected
        </div>
        <p class="music-copy-muted text-body-2 mb-0">
          Selection stays stable through result refreshes and mode changes until the operator resets it explicitly.
        </p>
      </div>

      <div class="d-flex flex-column align-lg-end ga-3">
        <div class="d-flex flex-wrap ga-2 justify-lg-end">
          <v-chip
            class="music-shell-chip"
            color="secondary"
            size="small"
            variant="tonal"
          >
            {{ formatDiscoveryMode(mode) }}
          </v-chip>
          <v-chip
            class="music-shell-chip"
            color="primary"
            size="small"
            variant="tonal"
          >
            {{ providerUsed ? formatProviderLabel(providerUsed) : 'Provider pending' }}
          </v-chip>
        </div>

        <div class="d-flex flex-wrap ga-2 justify-lg-end">
          <v-btn
            variant="text"
            :disabled="pending || selectedCount === 0"
            @click="emit('clear')"
          >
            Reset selection
          </v-btn>
          <v-btn
            color="primary"
            :loading="pending"
            :disabled="pending || selectedCount === 0"
            @click="emit('submit')"
          >
            Submit selected batch
          </v-btn>
        </div>
      </div>
    </div>
  </v-card>
</template>
