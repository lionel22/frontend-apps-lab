<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTraderStore } from '~/stores/trader';
import { useLocalStorage } from '~/composables/useLocalStorage';
import { usePolling } from '~/composables/usePolling';

const trader = useTraderStore();
const manualSymbol = ref('');

const sectorFilter = useLocalStorage<string | null>('trader.watchlist.sector', null);
const liquidityTierFilter = useLocalStorage<string | null>(
  'trader.watchlist.liquidity-tier',
  null,
);

onMounted(async () => {
  await Promise.all([trader.fetchWatchlist(true), trader.fetchSignals(true)]);
});

const isManualSymbolValid = computed(() =>
  /^[A-Za-z0-9]{2,16}\/[A-Za-z0-9]{2,10}$/.test(manualSymbol.value.trim()),
);

const manualSymbolErrors = computed(() => {
  if (!manualSymbol.value.trim() || isManualSymbolValid.value) {
    return [];
  }

  return ['Use BASE/QUOTE format, for example BTC/USDT.'];
});

const sectorOptions = computed(() => {
  const set = new Set(
    trader.watchlist
      .map((asset) => asset.sectorBucket)
      .filter((sector): sector is string => Boolean(sector)),
  );
  return Array.from(set).sort();
});

const liquidityTierOptions = computed(() => {
  const set = new Set(
    trader.watchlist
      .map((asset) => asset.liquidityTier)
      .filter((tier): tier is string => Boolean(tier)),
  );
  return Array.from(set).sort();
});

const filteredAssets = computed(() => {
  return trader.watchlist.filter((asset) => {
    const sectorMatch =
      !sectorFilter.value || asset.sectorBucket === sectorFilter.value;
    const liquidityMatch =
      !liquidityTierFilter.value ||
      asset.liquidityTier === liquidityTierFilter.value;
    return sectorMatch && liquidityMatch;
  });
});

const preferredSignalsBySymbol = computed(() => {
  const bySymbol: Record<string, (typeof trader.signals)[number]> = {};
  const timeframeRank: Record<string, number> = {
    '4h': 0,
    '1h': 1,
    '1d': 2,
  };

  for (const signal of trader.signals) {
    const current = bySymbol[signal.symbol];

    if (!current) {
      bySymbol[signal.symbol] = signal;
      continue;
    }

    const currentRank = timeframeRank[current.timeframe] ?? 99;
    const nextRank = timeframeRank[signal.timeframe] ?? 99;

    if (
      nextRank < currentRank ||
      (nextRank === currentRank && signal.confidence > current.confidence)
    ) {
      bySymbol[signal.symbol] = signal;
    }
  }

  return bySymbol;
});

async function rebuildWatchlist() {
  await trader.rebuildWatchlist();
}

async function addManualAsset() {
  if (!isManualSymbolValid.value) {
    return;
  }

  const result = await trader.addWatchlistAsset(manualSymbol.value.trim());
  if (result) {
    manualSymbol.value = '';
  }
}

async function removeAsset(symbol: string) {
  await trader.removeWatchlistAsset(symbol);
}

usePolling(async () => {
  await Promise.all([trader.fetchWatchlist(true), trader.fetchSignals(true)]);
}, { interval: trader.pollingIntervals.watchlist, immediate: false });
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert
      :error="trader.errors.watchlist"
      title="Watchlist Load Error"
    />

    <SharedApiErrorAlert
      :error="trader.errors.signals"
      title="Watchlist Readiness Error"
    />

    <v-card>
      <v-card-title class="d-flex flex-wrap justify-space-between align-center ga-3">
        <span>Watchlist Controls</span>
        <v-btn
          color="primary"
          variant="flat"
          :loading="trader.loading.watchlist"
          @click="rebuildWatchlist"
        >
          Rebuild Now
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-row align="end">
          <v-col cols="12" md="8">
            <v-text-field
              v-model="manualSymbol"
              label="Add Asset Manually"
              placeholder="BTC/USDT"
              hint="Assets use BASE/QUOTE format and stay pinned until removed manually."
              persistent-hint
              :error-messages="manualSymbolErrors"
              :disabled="trader.loading.watchlist"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-btn
              block
              color="secondary"
              variant="tonal"
              :disabled="!isManualSymbolValid || trader.loading.watchlist"
              :loading="trader.loading.watchlist"
              @click="addManualAsset"
            >
              Add Asset
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>Filters</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <WatchlistSectorFilter
              v-model="sectorFilter"
              :options="sectorOptions"
            />
          </v-col>
          <v-col cols="12" md="6">
            <WatchlistLiquidityTierFilter
              v-model="liquidityTierFilter"
              :options="liquidityTierOptions"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <WatchlistTable
      :assets="filteredAssets"
      :busy="trader.loading.watchlist"
      :signals-by-symbol="preferredSignalsBySymbol"
      @remove="removeAsset"
    />
  </div>
</template>
