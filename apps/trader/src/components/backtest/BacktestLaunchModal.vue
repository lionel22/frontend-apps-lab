<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import type { BacktestLaunchPayload } from '~/types/trader';
import { validateBacktestLaunch } from '~/utils/validators';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  launch: [payload: BacktestLaunchPayload];
}>();

const form = reactive({
  symbolsCsv: 'BTCUSDT,ETHUSDT',
  days: 90,
  timeframe: '4h' as '4h' | '1d',
  profileName: 'spot-swing-default',
  startDate: '',
  endDate: '',
});

const localError = ref('');

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
    symbols: form.symbolsCsv
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean),
    days: form.days,
    timeframe: form.timeframe,
    profileName: form.profileName || undefined,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
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
            <v-text-field
              v-model="form.symbolsCsv"
              label="Symbols (comma-separated)"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.days"
              label="Days"
              type="number"
              min="1"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="form.timeframe"
              :items="['4h', '1d']"
              label="Timeframe"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.profileName"
              label="Profile"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.startDate"
              label="Start Date (ISO)"
              placeholder="2026-01-01T00:00:00Z"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.endDate"
              label="End Date (ISO)"
              placeholder="2026-03-31T00:00:00Z"
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