<script setup lang="ts">
import { ref } from 'vue';
import type { PagedResponse, Trade } from '~/types/trader';
import { formatCurrency, formatDateTime } from '~/utils/formatters';

const props = defineProps<{
  pagedTrades: PagedResponse<Trade>;
  loading?: boolean;
}>();

const emit = defineEmits<{
  'page-change': [offset: number, limit: number];
}>();

const expandedTradeId = ref<string | null>(null);

function toggleExpanded(id: string) {
  expandedTradeId.value = expandedTradeId.value === id ? null : id;
}

function prevPage() {
  const nextOffset = Math.max(props.pagedTrades.offset - props.pagedTrades.limit, 0);
  emit('page-change', nextOffset, props.pagedTrades.limit);
}

function nextPage() {
  const nextOffset = props.pagedTrades.offset + props.pagedTrades.limit;
  if (nextOffset >= props.pagedTrades.total) {
    return;
  }
  emit('page-change', nextOffset, props.pagedTrades.limit);
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Closed Trades</span>
      <div class="d-flex align-center ga-2">
        <v-btn size="small" variant="text" :disabled="pagedTrades.offset === 0" @click="prevPage">
          Previous
        </v-btn>
        <v-btn
          size="small"
          variant="text"
          :disabled="pagedTrades.offset + pagedTrades.limit >= pagedTrades.total"
          @click="nextPage"
        >
          Next
        </v-btn>
      </div>
    </v-card-title>
    <v-card-subtitle>
      Showing {{ pagedTrades.offset + 1 }}-
      {{ Math.min(pagedTrades.offset + pagedTrades.limit, pagedTrades.total) }}
      of {{ pagedTrades.total }}
    </v-card-subtitle>
    <v-card-text>
      <SharedLoadingSpinner v-if="loading" inline label="Refreshing trades..." />
      <v-table v-else density="comfortable" hover>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Side</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>Fees</th>
            <th>Funding</th>
            <th>PnL</th>
            <th>Closed</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!pagedTrades.items.length">
            <td colspan="9" class="text-center py-8 text-medium-emphasis">
              No trades available for this page.
            </td>
          </tr>
          <template v-for="trade in pagedTrades.items" :key="trade.id">
            <tr>
              <td class="font-weight-medium">{{ trade.symbol }}</td>
              <td>{{ trade.side }}</td>
              <td>{{ formatCurrency(trade.entryPrice, 'USD', 4) }}</td>
              <td>{{ formatCurrency(trade.exitPrice, 'USD', 4) }}</td>
              <td>{{ formatCurrency(trade.fees) }}</td>
              <td>{{ formatCurrency(trade.funding) }}</td>
              <td>
                <v-chip
                  :color="trade.realizedPnl >= 0 ? 'success' : 'error'"
                  variant="tonal"
                  size="small"
                >
                  {{ formatCurrency(trade.realizedPnl) }}
                </v-chip>
              </td>
              <td>{{ formatDateTime(trade.closedAt) }}</td>
              <td>
                <v-btn size="x-small" variant="text" @click="toggleExpanded(trade.id)">
                  {{ expandedTradeId === trade.id ? 'Hide' : 'Details' }}
                </v-btn>
              </td>
            </tr>
            <tr v-if="expandedTradeId === trade.id">
              <td colspan="9">
                <TradesTradeExpander :trade="trade" />
              </td>
            </tr>
          </template>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
