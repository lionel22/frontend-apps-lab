<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { BacktestLaunchPayload, BacktestTimeframe } from '~/types/trader';
import { validateBacktestLaunch } from '~/utils/validators';
import {
  DEFAULT_BACKTEST_PROFILE_NAME,
  BACKTEST_TIMEFRAME_OPTIONS,
} from '~/utils/domain';
import {
  toUtcEndOfDayIso,
  toUtcStartOfDayIso,
} from '~/utils/date-boundaries';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    loading?: boolean;
    symbolOptions?: string[];
  }>(),
  {
    loading: false,
    symbolOptions: () => [],
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  launch: [payload: BacktestLaunchPayload];
}>();

const form = reactive({
  symbols: ['BTC/USDT', 'ETH/USDT'],
  days: 90,
  timeframe: '4h' as BacktestTimeframe,
  profileName: DEFAULT_BACKTEST_PROFILE_NAME,
  startDate: '',
  endDate: '',
});

const COMMON_SPOT_SYMBOLS = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'BNB/USDT',
  'XRP/USDT',
  'DOGE/USDT',
  'ADA/USDT',
  'AVAX/USDT',
] as const;

const localError = ref('');
const symbolSearch = ref('');
const customSymbol = ref('');
const hasExplicitDateRange = computed(() =>
  Boolean(form.startDate || form.endDate),
);
const mergedSymbolOptions = computed(() => {
  const symbols = [
    ...COMMON_SPOT_SYMBOLS,
    ...props.symbolOptions,
    ...form.symbols,
  ];
  return Array.from(new Set(symbols.filter(Boolean)));
});

const filteredSymbolOptions = computed(() => {
  const query = symbolSearch.value.trim().toUpperCase();
  if (!query) {
    return mergedSymbolOptions.value;
  }

  return mergedSymbolOptions.value.filter((symbol) =>
    normalizeSymbol(symbol).includes(query),
  );
});

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function isSymbolSelected(symbol: string): boolean {
  const normalized = normalizeSymbol(symbol);
  return form.symbols.some((item) => normalizeSymbol(item) === normalized);
}

function toggleSymbol(symbol: string): void {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) {
    return;
  }

  if (isSymbolSelected(normalized)) {
    form.symbols = form.symbols.filter(
      (item) => normalizeSymbol(item) !== normalized,
    );
    return;
  }

  form.symbols = [...form.symbols, normalized];
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      localError.value = '';
    }
  },
);

function close() {
  emit('update:modelValue', false);
}

function buildPayload(): BacktestLaunchPayload {
  return {
    symbols: form.symbols.map(normalizeSymbol).filter(Boolean),
    days: hasExplicitDateRange.value ? undefined : form.days,
    timeframe: form.timeframe,
    profileName: form.profileName || undefined,
    startDate: form.startDate ? toUtcStartOfDayIso(form.startDate) : undefined,
    endDate: form.endDate ? toUtcEndOfDayIso(form.endDate) : undefined,
    marketScope: 'spot',
  };
}

function addCustomSymbol(): void {
  const normalized = normalizeSymbol(customSymbol.value);
  if (!normalized) {
    return;
  }

  if (!isSymbolSelected(normalized)) {
    form.symbols = [...form.symbols, normalized];
  }

  customSymbol.value = '';
}

function submit() {
  const payload = buildPayload();

  const validationErrors = validateBacktestLaunch(payload);
  if (Object.keys(validationErrors).length) {
    localError.value = Object.values(validationErrors)[0];
    return;
  }

  emit('launch', payload);
}
</script>

<template>
  <v-dialog :model-value="props.modelValue" max-width="640" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>Launch Backtest</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-autocomplete
              v-model="form.symbols"
              :items="mergedSymbolOptions"
              v-model:search="symbolSearch"
              label="Symbols"
              placeholder="Search symbols..."
              chips
              closable-chips
              multiple
              clearable
              hide-selected
              hint="Search and select symbols, then optionally add custom symbols manually."
              persistent-hint
              variant="outlined"
            />
            <div class="d-flex ga-2 mt-2">
              <v-text-field
                v-model="customSymbol"
                label="Add custom symbol"
                placeholder="ex: LINK/USDT"
                variant="outlined"
                density="comfortable"
                hide-details
                @keyup.enter="addCustomSymbol"
              />
              <v-btn
                color="primary"
                variant="tonal"
                @click="addCustomSymbol"
              >
                Add
              </v-btn>
            </div>
            <div class="d-flex flex-wrap ga-2 mt-3">
              <v-chip
                v-for="symbol in filteredSymbolOptions"
                :key="symbol"
                :color="isSymbolSelected(symbol) ? 'primary' : undefined"
                :variant="isSymbolSelected(symbol) ? 'flat' : 'outlined'"
                size="small"
                @click="toggleSymbol(symbol)"
              >
                {{ symbol }}
              </v-chip>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.days"
              label="Days"
              type="number"
              min="1"
              :disabled="hasExplicitDateRange"
              hint="Used only when no explicit date range is set."
              persistent-hint
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="form.timeframe"
              :items="BACKTEST_TIMEFRAME_OPTIONS"
              label="Timeframe"
              item-title="title"
              item-value="value"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.profileName"
              label="Profile"
              hint="Defaults to the backend spot profile name if left unchanged."
              persistent-hint
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.startDate"
              label="Start Date"
              type="date"
              clearable
              hint="Converted to the start of day in UTC when submitted."
              persistent-hint
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.endDate"
              label="End Date"
              type="date"
              clearable
              hint="Converted to the end of day in UTC when submitted."
              persistent-hint
              variant="outlined"
            />
          </v-col>
        </v-row>

        <v-alert v-if="localError" type="warning" variant="tonal">
          {{ localError }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :disabled="props.loading"
          @click="close"
        >
          Cancel
        </v-btn>
        <v-btn color="primary" :loading="props.loading" @click="submit">
          Launch
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
