<script setup lang="ts">
import type { BacktestRunSummary, PagedResponse } from '~/types/trader';
import { formatDateTime } from '~/utils/formatters';

const props = defineProps<{
  pagedBacktests: PagedResponse<BacktestRunSummary>;
  loading?: boolean;
}>();

const emit = defineEmits<{
  launch: [];
  open: [runId: string];
  'page-change': [offset: number, limit: number];
}>();

function previousPage() {
  const nextOffset = Math.max(
    props.pagedBacktests.offset - props.pagedBacktests.limit,
    0,
  );
  emit('page-change', nextOffset, props.pagedBacktests.limit);
}

function nextPage() {
  const nextOffset = props.pagedBacktests.offset + props.pagedBacktests.limit;
  if (nextOffset >= props.pagedBacktests.total) {
    return;
  }
  emit('page-change', nextOffset, props.pagedBacktests.limit);
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Backtest History</span>
      <div class="d-flex ga-2">
        <v-btn color="primary" variant="flat" @click="emit('launch')">
          Launch Backtest
        </v-btn>
        <v-btn size="small" variant="text" :disabled="pagedBacktests.offset === 0" @click="previousPage">
          Previous
        </v-btn>
        <v-btn
          size="small"
          variant="text"
          :disabled="pagedBacktests.offset + pagedBacktests.limit >= pagedBacktests.total"
          @click="nextPage"
        >
          Next
        </v-btn>
      </div>
    </v-card-title>
    <v-card-text>
      <SharedLoadingSpinner v-if="loading" inline label="Refreshing backtest list..." />
      <v-table v-else density="comfortable" hover>
        <thead>
          <tr>
            <th>Run</th>
            <th>Status</th>
            <th>Symbols</th>
            <th>Timeframe</th>
            <th>Sharpe</th>
            <th>Max Drawdown</th>
            <th>Finished</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!pagedBacktests.items.length">
            <td colspan="7" class="text-center py-8 text-medium-emphasis">
              No backtest runs found.
            </td>
          </tr>
          <tr
            v-for="run in pagedBacktests.items"
            v-else
            :key="run.id"
            style="cursor: pointer"
            @click="emit('open', run.id)"
          >
            <td class="font-weight-medium">{{ run.id.slice(0, 8) }}</td>
            <td>
              <v-chip
                :color="run.status === 'COMPLETED' ? 'success' : run.status === 'FAILED' ? 'error' : 'info'"
                variant="tonal"
                size="small"
              >
                {{ run.status }}
              </v-chip>
            </td>
            <td>{{ run.params.symbols.join(', ') }}</td>
            <td>{{ run.params.timeframe || '-' }}</td>
            <td>{{ (run.metrics.sharpeRatio ?? 0).toFixed(2) }}</td>
            <td>{{ (run.metrics.maxDrawdown ?? 0).toFixed(2) }}</td>
            <td>{{ formatDateTime(run.finishedAt || run.createdAt) }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>