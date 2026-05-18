<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTraderStore } from '~/stores/trader';
import { useLocalStorage } from '~/composables/useLocalStorage';

const trader = useTraderStore();
const manualSymbol = ref('');

const sectorFilter = useLocalStorage<string | null>('trader.watchlist.sector', null);
const liquidityTierFilter = useLocalStorage<string | null>(
  'trader.watchlist.liquidity-tier',
  null,
);

onMounted(async () => {
  await trader.fetchWatchlist(true);
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
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert
      :error="trader.errors.watchlist"
      title="Watchlist Load Error"
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
      @remove="removeAsset"
    />
  </div>
</template>
