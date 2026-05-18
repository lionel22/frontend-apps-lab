<script setup lang="ts">
import type { WatchlistAsset } from '~/types/trader';
import { formatDateTime } from '~/utils/formatters';

defineProps<{
  assets: WatchlistAsset[];
}>();
</script>

<template>
  <v-card>
    <v-card-title>Watchlist Assets</v-card-title>
    <v-card-text>
      <v-table density="comfortable" hover>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Rank Score</th>
            <th>Sector</th>
            <th>Liquidity</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!assets.length">
            <td colspan="5" class="text-center py-8 text-medium-emphasis">
              No eligible assets match current filters.
            </td>
          </tr>
          <tr v-for="asset in assets" :key="asset.id">
            <td class="font-weight-medium">{{ asset.symbol }}</td>
            <td>
              <v-chip size="small" color="primary" variant="tonal">
                {{ asset.rankScore.toFixed(2) }}
              </v-chip>
            </td>
            <td>{{ asset.sectorBucket || 'Unassigned' }}</td>
            <td>
              <v-chip size="small" variant="outlined" color="teal">
                {{ asset.liquidityTier }}
              </v-chip>
            </td>
            <td>{{ formatDateTime(asset.updatedAt) }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>