<script setup lang="ts">
import type { Position } from '~/types/trader';
import { formatCurrency, formatDateTime } from '~/utils/formatters';

defineProps<{
  positions: Position[];
}>();
</script>

<template>
  <v-card>
    <v-card-title>Open Positions</v-card-title>
    <v-card-text>
      <v-table density="comfortable" hover>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Side</th>
            <th>Size</th>
            <th>Entry</th>
            <th>Mark</th>
            <th>Unrealized</th>
            <th>Realized</th>
            <th>Risk %</th>
            <th>Opened</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!positions.length">
            <td colspan="9" class="text-center py-8 text-medium-emphasis">
              No open positions.
            </td>
          </tr>
          <tr v-for="position in positions" :key="position.id">
            <td class="font-weight-medium">{{ position.symbol }}</td>
            <td>{{ position.side }}</td>
            <td>{{ position.quantity.toFixed(4) }}</td>
            <td>{{ formatCurrency(position.entryPrice, 'USD', 4) }}</td>
            <td>{{ formatCurrency(position.markPrice, 'USD', 4) }}</td>
            <td>
              <v-chip
                :color="position.unrealizedPnl >= 0 ? 'success' : 'error'"
                variant="tonal"
                size="small"
              >
                {{ formatCurrency(position.unrealizedPnl) }}
              </v-chip>
            </td>
            <td>{{ formatCurrency(position.realizedPnl) }}</td>
            <td>{{ position.riskPct.toFixed(2) }}%</td>
            <td>{{ formatDateTime(position.openedAt) }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>