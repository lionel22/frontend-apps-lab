<script setup lang="ts">
import { computed } from 'vue';
import { useMusicStore } from '~/stores/music';
import { useSession } from '~/composables/useSession';

const music = useMusicStore();
const session = useSession();

const summaryCards = computed(() => [
  {
    label: 'Active jobs',
    value: music.jobs.summaryCounts.active,
  },
  {
    label: 'Queued',
    value: music.jobs.summaryCounts.queued,
  },
  {
    label: 'Recent failures',
    value: music.jobs.summaryCounts.recentFailures,
  },
]);
</script>

<template>
  <div>
    <SharedSectionHeader
      kicker="Sequence 0"
      title="Operator shell scaffold"
      description="Nuxt, Vuetify, Pinia, runtime config, and shared session foundations are in place for the dedicated music app."
    >
      <template #actions>
        <v-chip
          class="music-shell-chip"
          color="secondary"
          variant="tonal"
          size="small"
        >
          {{ session.requireAuth.value ? 'Shared token mode' : 'Auth optional' }}
        </v-chip>
      </template>
    </SharedSectionHeader>

    <v-row class="mb-4">
      <v-col
        v-for="card in summaryCards"
        :key="card.label"
        cols="12"
        md="4"
      >
        <v-card class="pa-5">
          <div class="music-kicker mb-2">
            Canonical jobs model
          </div>
          <div class="music-metric-value mb-2">
            {{ card.value }}
          </div>
          <div class="music-copy-muted text-body-2">
            {{ card.label }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <SharedSuccessState
      title="Sequence 0 foundation is ready"
      message="The app shell now targets the frozen contracts: one canonical jobs list, polling-only MVP behavior, and shared token session support when auth is enabled."
    />
  </div>
</template>
