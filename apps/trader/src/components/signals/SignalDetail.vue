<script setup lang="ts">
import type { SignalView } from '~/types/trader';

defineProps<{
  signal: SignalView | null;
}>();
</script>

<template>
  <v-card>
    <v-card-title>Signal Detail</v-card-title>
    <v-card-text>
      <div v-if="!signal" class="text-medium-emphasis py-8 text-center">
        Select a symbol to inspect signal contributions and staleness.
      </div>
      <div v-else class="d-flex flex-column ga-4">
        <div class="d-flex align-center ga-3">
          <v-chip color="primary" variant="tonal">{{ signal.symbol }}</v-chip>
          <v-chip color="info" variant="outlined">{{ signal.timeframe }}</v-chip>
          <v-chip color="teal" variant="outlined">Score {{ signal.compositeScore.toFixed(2) }}</v-chip>
          <v-chip color="indigo" variant="outlined">Confidence {{ signal.confidence.toFixed(2) }}</v-chip>
        </div>

        <SignalsSignalStalenessIndicator
          :stale-signals="signal.staleSignals"
          :missing-signals="signal.missingRequiredSignals"
        />

        <SignalsSignalContributionChart :contributions="signal.contributions" />
      </div>
    </v-card-text>
  </v-card>
</template>