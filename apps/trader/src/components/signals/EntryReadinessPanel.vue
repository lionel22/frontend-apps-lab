<script setup lang="ts">
import { computed } from 'vue';
import type { SignalReadiness, SignalView } from '~/types/trader';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '~/utils/formatters';

const props = withDefaults(
  defineProps<{
    signal: SignalView | null;
    readiness: SignalReadiness | null;
    loading?: boolean;
    error?: string | null;
  }>(),
  {
    loading: false,
    error: null,
  },
);

const summaryRows = computed(() => {
  if (!props.readiness) {
    return [];
  }

  return [
    {
      label: 'Nearest Trigger',
      value: props.readiness.thresholds.nearestAction,
    },
    {
      label: 'Confidence',
      value: formatPercent(props.readiness.confidence),
    },
    {
      label: 'Distance To Buy',
      value: formatNumber(props.readiness.thresholds.distanceToBuy, 2),
    },
    {
      label: 'Distance To Sell',
      value: formatNumber(props.readiness.thresholds.distanceToSell, 2),
    },
  ];
});

const previewRows = computed(() => {
  if (!props.readiness?.positionSizePreview) {
    return [];
  }

  const preview = props.readiness.positionSizePreview;

  return [
    { label: 'Entry Price', value: formatCurrency(preview.entryPrice) },
    { label: 'Stop Loss', value: formatCurrency(preview.stopLoss) },
    { label: 'Quantity', value: formatNumber(preview.quantity, 4) },
    { label: 'Cash At Risk', value: formatCurrency(preview.cashAtRisk) },
    { label: 'Stop Distance', value: formatCurrency(preview.stopDistance) },
    { label: 'Risk Fraction', value: formatPercent(preview.riskFraction) },
  ];
});
</script>

<template>
  <v-card class="bx-entry-panel">
    <v-card-title class="d-flex flex-wrap align-center justify-space-between ga-3">
      <span>Entry Readiness</span>
      <div v-if="readiness" class="d-flex flex-wrap ga-2">
        <v-chip color="primary" variant="tonal" size="small">
          {{ readiness.symbol }}
        </v-chip>
        <v-chip color="info" variant="outlined" size="small">
          {{ readiness.timeframe }}
        </v-chip>
      </div>
    </v-card-title>
    <v-card-text>
      <div v-if="!signal" class="text-medium-emphasis py-8 text-center">
        Select a signal row to inspect readiness, thresholds, and size preview.
      </div>
      <div v-else class="d-flex flex-column ga-4">
        <div v-if="loading" class="py-4">
          <v-progress-linear indeterminate color="primary" class="mb-3" />
          <div class="text-medium-emphasis">
            Computing readiness snapshot from the latest signal stack.
          </div>
        </div>

        <v-alert v-else-if="error" type="warning" variant="tonal">
          {{ error }}
        </v-alert>

        <template v-else-if="readiness">
          <SignalsReadinessGauge
            :score="readiness.readiness"
            title="Entry Window"
            caption="Normalized from composite signal quality and threshold distance."
          />

          <SignalsSignalStalenessIndicator
            :stale-signals="readiness.staleSignals"
            :missing-signals="readiness.missingRequiredSignals"
          />

          <v-row>
            <v-col v-for="row in summaryRows" :key="row.label" cols="6" md="3">
              <div class="bx-metric-tile">
                <div class="bx-metric-label">{{ row.label }}</div>
                <div class="bx-metric-value">{{ row.value }}</div>
              </div>
            </v-col>
          </v-row>

          <v-card variant="tonal" color="surface">
            <v-card-title class="text-subtitle-1">Position Size Preview</v-card-title>
            <v-card-text>
              <div v-if="previewRows.length" class="d-flex flex-column ga-3">
                <div
                  v-for="row in previewRows"
                  :key="row.label"
                  class="d-flex justify-space-between align-center ga-3"
                >
                  <span class="bx-metric-label">{{ row.label }}</span>
                  <span class="bx-metric-value">{{ row.value }}</span>
                </div>
              </div>
              <div v-else class="text-medium-emphasis">
                No price snapshot is available yet to compute a live size preview.
              </div>
            </v-card-text>
          </v-card>

          <SignalsDimensionBreakdown :dimensions="readiness.dimensions" />
        </template>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.bx-entry-panel {
  min-height: 100%;
}

.bx-metric-tile {
  height: 100%;
  border-radius: 18px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.52);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.bx-metric-label {
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.58);
}

.bx-metric-value {
  margin-top: 8px;
  font-family: var(--bx-font-mono);
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(248, 250, 252, 0.94);
}
</style>
