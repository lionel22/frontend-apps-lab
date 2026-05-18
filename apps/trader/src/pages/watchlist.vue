<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useTraderStore } from '~/stores/trader';
import { useLocalStorage } from '~/composables/useLocalStorage';

const trader = useTraderStore();

const sectorFilter = useLocalStorage<string | null>('trader.watchlist.sector', null);
const liquidityTierFilter = useLocalStorage<string | null>(
  'trader.watchlist.liquidity-tier',
  null,
);

onMounted(async () => {
  await trader.fetchWatchlist(true);
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
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert
      :error="trader.errors.watchlist"
      title="Watchlist Load Error"
    />

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

    <WatchlistTable :assets="filteredAssets" />
  </div>
</template>