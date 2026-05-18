<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type {
  BacktestLaunchPayload,
  BacktestTimeframe,
} from '~/types/trader';
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

const localError = ref('');
const hasExplicitDateRange = computed(() =>
  Boolean(form.startDate || form.endDate),
);
const mergedSymbolOptions = computed(() => {
  const symbols = [...props.symbolOptions, ...form.symbols];
  return Array.from(new Set(symbols.filter(Boolean)));
});

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

function submit() {
  const payload: BacktestLaunchPayload = {
    symbols: form.symbols
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean),
    days: hasExplicitDateRange.value ? undefined : form.days,
    timeframe: form.timeframe,
    profileName: form.profileName || undefined,
    startDate: form.startDate ? toUtcStartOfDayIso(form.startDate) : undefined,
    endDate: form.endDate ? toUtcEndOfDayIso(form.endDate) : undefined,
    marketScope: 'spot',
  };

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
            <v-combobox
              v-model="form.symbols"
              :items="mergedSymbolOptions"
              label="Symbols"
              chips
              closable-chips
              multiple
              clearable
              hint="Select from the watchlist or type custom spot symbols like BTC/USDT."
              persistent-hint
              variant="outlined"
            />
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
        <v-btn variant="text" :disabled="props.loading" @click="close">Cancel</v-btn>
        <v-btn color="primary" :loading="props.loading" @click="submit">
          Launch
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
