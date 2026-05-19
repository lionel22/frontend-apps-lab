<script setup lang="ts">
import { computed } from 'vue';
import type { PortfolioAllocation, SpotHolding } from '~/types/trader';
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from '~/utils/formatters';

const props = defineProps<{
  holdings: SpotHolding[];
  allocations: PortfolioAllocation[];
}>();

const allocationBySymbol = computed(() =>
  new Map(props.allocations.map((row) => [row.symbol, row.allocationPct])),
);

const rows = computed(() =>
  [...props.holdings]
    .map((holding) => ({
      ...holding,
      allocationPct: allocationBySymbol.value.get(holding.symbol) ?? 0,
      lockedShare:
        holding.totalBalance > 0 ? holding.lockedBalance / holding.totalBalance : 0,
    }))
    .sort((left, right) => right.marketValue - left.marketValue),
);
</script>

<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Held Assets</span>
      <v-chip color="info" variant="tonal" size="small">
        {{ rows.length }} tracked symbols
      </v-chip>
    </v-card-title>

    <v-card-text class="pa-0">
      <v-table density="comfortable" class="bx-holdings-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Total Balance</th>
            <th>Free / Locked</th>
            <th>Mark Price</th>
            <th>Market Value</th>
            <th>Allocation</th>
            <th>Last Update</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="7" class="text-center py-8" style="color: rgba(226,232,240,0.6)">
              No spot holdings are available yet.
            </td>
          </tr>
          <tr v-for="row in rows" :key="row.symbol">
            <td>
              <div class="d-flex flex-column">
                <strong class="bx-mono">{{ row.symbol }}</strong>
                <span style="font-size: 0.75rem; color: rgba(226,232,240,0.55)">
                  Locked {{ formatPercent(row.lockedShare) }}
                </span>
              </div>
            </td>
            <td>{{ formatNumber(row.totalBalance, 6) }}</td>
            <td>
              <div class="d-flex flex-column">
                <span>{{ formatNumber(row.freeBalance, 6) }}</span>
                <span style="font-size: 0.75rem; color: rgba(226,232,240,0.55)">
                  {{ formatNumber(row.lockedBalance, 6) }} locked
                </span>
              </div>
            </td>
            <td>{{ formatCurrency(row.costBasis, 'USD', 4) }}</td>
            <td>
              <strong class="bx-mono">{{ formatCurrency(row.marketValue) }}</strong>
            </td>
            <td>
              <div class="d-flex flex-column ga-2">
                <div class="d-flex justify-space-between">
                  <span class="bx-mono" style="font-size: 0.78rem">{{ formatPercent(row.allocationPct) }}</span>
                </div>
                <div class="bx-allocation-track">
                  <div
                    class="bx-allocation-fill"
                    :style="{ width: `${Math.min(row.allocationPct * 100, 100)}%` }"
                  />
                </div>
              </div>
            </td>
            <td>{{ formatDateTime(row.lastUpdated) }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.bx-holdings-table :deep(th) {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.85);
}

.bx-holdings-table :deep(td) {
  vertical-align: middle;
}

.bx-allocation-track {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  overflow: hidden;
}

.bx-allocation-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff5252 0%, #ffab00 45%, #00e676 100%);
}
</style>