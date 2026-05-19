<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useTraderStore } from '~/stores/trader';

const trader = useTraderStore();

const isInitialLoading = computed(() => trader.loading.correlation && !trader.correlation);

onMounted(async () => {
  await trader.fetchCorrelation(true);
});

const stateMessage = computed(() => {
  if (!trader.correlation) {
    return 'No correlation report available yet.';
  }
  if (trader.correlation.state === 'empty') {
    return 'No persisted correlation report exists yet for the selected windows.';
  }
  if (trader.correlation.state === 'low-sample') {
    return `Correlation is low-confidence: ${trader.correlation.sampleSize}/${trader.correlation.minSamples} samples.`;
  }
  return '';
});
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert
      :error="trader.errors.correlation"
      title="Correlation Endpoint Error"
    />

    <template v-if="isInitialLoading">
      <v-skeleton-loader type="card" />
      <v-skeleton-loader type="card" />
      <v-skeleton-loader type="table" />
    </template>
    <template v-else>
      <v-alert v-if="stateMessage" type="warning" variant="tonal">
        {{ stateMessage }}
      </v-alert>

      <SignalsCorrelationMatrix :rows="trader.correlation?.summary || []" />

      <SignalsSignalTrendChart :windows="trader.correlation?.windows || []" />

      <v-card>
        <v-card-title>Degradation Flags</v-card-title>
        <v-card-text>
          <div class="d-flex flex-wrap ga-2">
            <v-tooltip
              v-for="row in (trader.correlation?.summary || []).filter((item) => item.degraded)"
              :key="row.signal"
              location="top"
            >
              <template #activator="{ props }">
                <v-chip v-bind="props" color="error" variant="tonal" size="small">
                  {{ row.signal }}
                </v-chip>
              </template>
              <div>
                Corr {{ row.correlation.toFixed(2) }}
                • Trend {{ row.trend }}
                • Samples {{ row.sampleSize }}
              </div>
            </v-tooltip>
            <v-chip
              v-if="!(trader.correlation?.summary || []).some((item) => item.degraded)"
              color="success"
              variant="tonal"
              size="small"
            >
              No degraded signals detected.
            </v-chip>
          </div>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
