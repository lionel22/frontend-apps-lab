<script setup lang="ts">
import type { WatchlistAsset } from '~/types/trader';
import { formatDateTime } from '~/utils/formatters';

defineProps<{
  assets: WatchlistAsset[];
  busy?: boolean;
}>();

const emit = defineEmits<{
  remove: [symbol: string];
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
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!assets.length">
            <td colspan="6" class="text-center py-8 text-medium-emphasis">
              No eligible assets match current filters.
            </td>
          </tr>
          <tr v-for="asset in assets" :key="asset.id">
            <td class="font-weight-medium">
              <div class="d-flex flex-wrap align-center ga-2">
                <span>{{ asset.symbol }}</span>
                <v-chip
                  v-if="asset.selectionSource === 'manual'"
                  size="x-small"
                  color="amber"
                  variant="tonal"
                >
                  Manual
                </v-chip>
              </div>
            </td>
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
            <td class="text-right">
              <v-btn
                size="small"
                color="error"
                variant="text"
                :disabled="busy"
                @click="emit('remove', asset.symbol)"
              >
                Remove
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
