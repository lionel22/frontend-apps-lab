<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useTraderStore } from '~/stores/trader';
import { usePolling } from '~/composables/usePolling';

const trader = useTraderStore();
const selectedSymbol = ref<string>('');

const selectedSignal = computed(() => {
  return (
    trader.selectedSignal ||
    trader.signals.find((signal) => signal.symbol === selectedSymbol.value) ||
    null
  );
});

async function refreshSignals(force = false) {
  await trader.fetchSignals(force);
  if (!selectedSymbol.value && trader.signals.length) {
    selectedSymbol.value = trader.signals[0].symbol;
  }
}

onMounted(async () => {
  await refreshSignals(true);
});

watch(selectedSymbol, async (symbol) => {
  if (!symbol) {
    return;
  }
  await trader.fetchSignalDetail(symbol);
});

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
              <th>Confidence</th>
              <th>Stale</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!trader.signals.length">
              <td colspan="5" class="text-center py-8 text-medium-emphasis">
                No aggregated signal rows available.
              </td>
            </tr>
            <tr
              v-for="signal in trader.signals"
              :key="`${signal.symbol}-${signal.timeframe}`"
              style="cursor: pointer"
              :class="signal.symbol === selectedSymbol ? 'bg-grey-lighten-4' : ''"
              @click="selectedSymbol = signal.symbol"
            >
              <td class="font-weight-medium">{{ signal.symbol }}</td>
              <td>{{ signal.timeframe }}</td>
              <td>{{ signal.compositeScore.toFixed(2) }}</td>
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

    <SignalsSignalDetail :signal="selectedSignal" />
  </div>
</template>