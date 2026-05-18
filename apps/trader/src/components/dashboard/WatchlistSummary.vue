<script setup lang="ts">
import { computed } from 'vue';
import type { WatchlistAsset } from '~/types/trader';

const props = defineProps<{
  watchlist: WatchlistAsset[];
}>();

const sectorBreakdown = computed(() => {
  const summary: Record<string, number> = {};
  for (const asset of props.watchlist) {
    const sector = asset.sectorBucket || 'Unassigned';
    summary[sector] = (summary[sector] ?? 0) + 1;
  }

  return Object.entries(summary)
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count);
});

const liquidityBreakdown = computed(() => {
  const summary: Record<string, number> = {};
  for (const asset of props.watchlist) {
    const key = asset.liquidityTier || 'unknown';
    summary[key] = (summary[key] ?? 0) + 1;
  }

  return Object.entries(summary)
    .map(([tier, count]) => ({ tier, count }))
    .sort((a, b) => b.count - a.count);
});
</script>

<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Watchlist Snapshot</span>
      <v-chip color="primary" size="small" variant="tonal">
        {{ watchlist.length }} assets
      </v-chip>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="7">
          <div class="bx-metric-label mb-3">Sector Breakdown</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="row in sectorBreakdown"
              :key="row.sector"
              variant="tonal"
              color="secondary"
              size="small"
            >
              {{ row.sector }}
              <span class="ml-1" style="opacity: 0.7">{{ row.count }}</span>
            </v-chip>
          </div>
        </v-col>
        <v-col cols="12" md="5">
          <div class="bx-metric-label mb-3">Liquidity Tiers</div>
          <div class="d-flex flex-column ga-2">
            <div
              v-for="row in liquidityBreakdown"
              :key="row.tier"
              class="d-flex align-center justify-space-between"
              style="padding: 6px 12px; border-radius: 8px; background: rgba(0, 229, 255, 0.04); border: 1px solid rgba(0, 229, 255, 0.06)"
            >
              <span class="bx-mono" style="font-size: 0.78rem; color: rgba(226,232,240,0.7)">{{ row.tier }}</span>
              <span class="bx-mono" style="font-size: 0.82rem; font-weight: 700; color: #00e5ff">{{ row.count }}</span>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
