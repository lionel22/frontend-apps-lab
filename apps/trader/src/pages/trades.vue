<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import type { TradeFilters } from '~/types/trader';
import { useTraderContracts } from '~/composables/useTraderApi';
import { useTraderStore } from '~/stores/trader';
import { useUiStore } from '~/stores/ui';
import { usePolling } from '~/composables/usePolling';
import { toUtcEndOfDayIso, toUtcStartOfDayIso } from '~/utils/date-boundaries';

const trader = useTraderStore();
const ui = useUiStore();
const contracts = useTraderContracts();

const filters = reactive({
  search: ui.filters.tradesSearch,
  symbol: ui.filters.tradesSymbol,
  side: ui.filters.tradesSide,
  closedAfter: ui.filters.tradesClosedAfter,
  closedBefore: ui.filters.tradesClosedBefore,
  sortBy: ui.filters.tradesSortBy,
  sortDirection: ui.filters.tradesSortDirection,
});

const exportLoading = ref(false);
const exportStatus = ref('Preparing server-side CSV...');
let exportController: AbortController | null = null;
let debounceHandle: ReturnType<typeof setTimeout> | null = null;

const sideOptions = [
  { title: 'All sides', value: null },
  { title: 'Long', value: 'LONG' },
  { title: 'Short', value: 'SHORT' },
] as const;

const sortFieldOptions = [
  { title: 'Closed At', value: 'closedAt' },
  { title: 'Opened At', value: 'openedAt' },
  { title: 'Realized PnL', value: 'realizedPnl' },
  { title: 'Symbol', value: 'symbol' },
  { title: 'Entry Price', value: 'entryPrice' },
  { title: 'Exit Price', value: 'exitPrice' },
] as const;

const sortDirectionOptions = [
  { title: 'Descending', value: 'desc' },
  { title: 'Ascending', value: 'asc' },
] as const;

const activeFilterCount = computed(() =>
  [
    filters.search,
    filters.symbol,
    filters.side,
    filters.closedAfter,
    filters.closedBefore,
  ].filter(Boolean).length,
);

function normalizeFilters(): TradeFilters {
  return {
    search: filters.search.trim() || undefined,
    symbol: filters.symbol.trim().toUpperCase() || undefined,
    side: filters.side || undefined,
    closedAfter: filters.closedAfter
      ? toUtcStartOfDayIso(filters.closedAfter)
      : undefined,
    closedBefore: filters.closedBefore
      ? toUtcEndOfDayIso(filters.closedBefore)
      : undefined,
    sortBy: filters.sortBy,
    sortDirection: filters.sortDirection,
  };
}

async function refresh(force = false, offset = trader.trades.offset) {
  await trader.fetchTrades(offset, trader.trades.limit, force);
}

async function applyFilters(offset = 0) {
  await trader.fetchTrades(offset, trader.trades.limit, true, normalizeFilters());
}

function queueFilterRefresh() {
  if (debounceHandle) {
    clearTimeout(debounceHandle);
  }

  debounceHandle = setTimeout(() => {
    void applyFilters(0);
  }, 300);
}

function resetFilters() {
  filters.search = '';
  filters.symbol = '';
  filters.side = null;
  filters.closedAfter = '';
  filters.closedBefore = '';
  filters.sortBy = 'closedAt';
  filters.sortDirection = 'desc';
  void applyFilters(0);
}

function triggerDownload(blob: Blob, fileName: string) {
  if (!import.meta.client) {
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function startExport() {
  if (exportLoading.value) {
    return;
  }

  exportLoading.value = true;
  exportStatus.value = 'Preparing server-side CSV...';
  exportController = new AbortController();

  try {
    const file = await contracts.downloadTradesExport(
      normalizeFilters(),
      exportController.signal,
    );
    triggerDownload(file.blob, file.fileName);
  } catch (error) {
    if (!(error instanceof Error && error.name === 'AbortError')) {
      exportStatus.value = 'Export failed.';
    }
  } finally {
    exportLoading.value = false;
    exportController = null;
  }
}

function cancelExport() {
  exportController?.abort();
}

onMounted(async () => {
  await refresh(true);
});

onBeforeUnmount(() => {
  if (debounceHandle) {
    clearTimeout(debounceHandle);
  }

  exportController?.abort();
});

watch(
  () => [
    filters.search,
    filters.symbol,
    filters.side,
    filters.closedAfter,
    filters.closedBefore,
    filters.sortBy,
    filters.sortDirection,
  ],
  () => {
    queueFilterRefresh();
  },
);

usePolling(async () => {
  await refresh(true);
}, { interval: trader.pollingIntervals.trades, immediate: false });

async function handlePageChange(offset: number, limit: number) {
  await trader.fetchTrades(offset, limit, true, normalizeFilters());
}
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert :error="trader.errors.trades" title="Trades Endpoint Error" />

    <v-card>
      <v-card-title class="d-flex justify-space-between align-center flex-wrap ga-4">
        <div>
          <div>Trades Explorer</div>
          <div class="bx-metric-label mt-1">
            {{ trader.trades.total }} matching trades
            <span v-if="activeFilterCount"> • {{ activeFilterCount }} active filter{{ activeFilterCount > 1 ? 's' : '' }}</span>
          </div>
        </div>

        <ShellExportButton
          :loading="exportLoading"
          :disabled="trader.loading.trades"
          label="Export Trades CSV"
          :status-text="exportStatus"
          @download="startExport"
          @cancel="cancelExport"
        />
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.search"
              label="Search symbol / trade / order"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field
              v-model="filters.symbol"
              label="Exact symbol"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.side"
              :items="sideOptions"
              item-title="title"
              item-value="value"
              label="Side"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field
              v-model="filters.closedAfter"
              label="Closed after"
              type="date"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field
              v-model="filters.closedBefore"
              label="Closed before"
              type="date"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="1" class="d-flex align-center justify-end">
            <v-btn variant="text" size="small" @click="resetFilters">
              Reset
            </v-btn>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.sortBy"
              :items="sortFieldOptions"
              item-title="title"
              item-value="value"
              label="Sort by"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.sortDirection"
              :items="sortDirectionOptions"
              item-title="title"
              item-value="value"
              label="Direction"
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <TradesTradeMetricsCard :trades="trader.trades.items" />

    <TradesTable
      :paged-trades="trader.trades"
      :loading="trader.loading.trades"
      @page-change="handlePageChange"
    />
  </div>
</template>
