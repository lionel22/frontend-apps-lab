<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useTraderStore } from '~/stores/trader';
import { usePolling } from '~/composables/usePolling';
import { useTraderContracts } from '~/composables/useTraderApi';
import type { SignalReadiness, SignalView } from '~/types/trader';

const trader = useTraderStore();
const api = useTraderContracts();
const selectedSignalKey = ref<string>('');
const readiness = ref<SignalReadiness | null>(null);
const readinessLoading = ref(false);
const readinessError = ref<string | null>(null);

function signalKey(signal: SignalView) {
  return `${signal.symbol}::${signal.timeframe}`;
}

function compositeScoreToReadiness(compositeScore: number) {
  return Math.max(0, Math.min(100, ((compositeScore + 1) / 2) * 100));
}

const selectedSignal = computed(() => {
  if (!selectedSignalKey.value) {
    return trader.signals[0] ?? null;
  }

  return (
    trader.signals.find((signal) => signalKey(signal) === selectedSignalKey.value) ??
    null
  );
});

async function refreshSignals(force = false) {
  await trader.fetchSignals(force);

  if (!trader.signals.length) {
    selectedSignalKey.value = '';
    readiness.value = null;
    readinessError.value = null;
    return;
  }

  if (!selectedSignalKey.value) {
    selectedSignalKey.value = signalKey(trader.signals[0]);
    return;
  }

  if (!selectedSignal.value) {
    selectedSignalKey.value = signalKey(trader.signals[0]);
  }
}

async function refreshReadiness() {
  if (!selectedSignal.value) {
    readiness.value = null;
    readinessError.value = null;
    return;
  }

  readinessLoading.value = true;
  readinessError.value = null;

  try {
    readiness.value = await api.fetchSignalReadiness(
      selectedSignal.value.symbol,
      selectedSignal.value.timeframe,
    );
  } catch (error) {
    readinessError.value =
      error instanceof Error ? error.message : 'Failed to compute readiness.';
  } finally {
    readinessLoading.value = false;
  }
}

onMounted(async () => {
  await refreshSignals(true);
});

watch(
  () =>
    selectedSignal.value
      ? `${signalKey(selectedSignal.value)}::${selectedSignal.value.timestamp}`
      : '',
  async (nextKey) => {
    if (!nextKey) {
      readiness.value = null;
      readinessError.value = null;
      return;
    }

    await refreshReadiness();
  },
  { immediate: true },
);

usePolling(async () => {
  await refreshSignals(true);
}, { interval: trader.pollingIntervals.signals, immediate: false });
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert :error="trader.errors.signals" title="Signal Endpoint Error" />

    <v-card>
      <v-card-title>Signal Snapshots</v-card-title>
      <v-card-text>
        <v-table density="comfortable" hover>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Timeframe</th>
              <th>Score</th>
              <th>Readiness</th>
              <th>Confidence</th>
              <th>Stale</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!trader.signals.length">
              <td colspan="6" class="text-center py-8 text-medium-emphasis">
                No aggregated signal rows available.
              </td>
            </tr>
            <tr
              v-for="signal in trader.signals"
              :key="`${signal.symbol}-${signal.timeframe}`"
              style="cursor: pointer"
              :class="signalKey(signal) === selectedSignalKey ? 'bg-grey-lighten-4' : ''"
              @click="selectedSignalKey = signalKey(signal)"
            >
              <td class="font-weight-medium">{{ signal.symbol }}</td>
              <td>{{ signal.timeframe }}</td>
              <td>{{ signal.compositeScore.toFixed(2) }}</td>
              <td style="min-width: 220px">
                <SignalsReadinessGauge
                  :score="compositeScoreToReadiness(signal.compositeScore)"
                  dense
                />
              </td>
              <td>{{ signal.confidence.toFixed(2) }}</td>
              <td>
                <SignalsSignalStalenessIndicator
                  :stale-signals="signal.staleSignals"
                  :missing-signals="signal.missingRequiredSignals"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" xl="7">
        <SignalsEntryReadinessPanel
          :signal="selectedSignal"
          :readiness="readiness"
          :loading="readinessLoading"
          :error="readinessError"
        />
      </v-col>
      <v-col cols="12" xl="5">
        <SignalsSignalDetail :signal="selectedSignal" />
      </v-col>
    </v-row>
  </div>
</template>