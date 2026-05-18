<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { WeightProfile, WeightProfileUpdatePayload } from '~/types/trader';
import { useSession } from '~/composables/useSession';
import {
  buildConfigDiff,
  validateWeightProfileUpdate,
  type ConfigDiffItem,
} from '~/utils/validators';

const props = withDefaults(
  defineProps<{
    profile: WeightProfile | null;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  submit: [payload: WeightProfileUpdatePayload];
}>();

const session = useSession();

const form = reactive({
  actor: session.actor.value,
  reason: '',
  weights: [] as Array<{ key: string; value: number }>,
  thresholds: [] as Array<{ key: string; value: number }>,
  errors: {} as Record<string, string>,
});

function hydrateFromProfile(profile: WeightProfile | null) {
  const target = profile;
  form.actor = session.actor.value;
  form.reason = '';
  form.weights = Object.entries(target?.weights ?? {}).map(([key, value]) => ({
    key,
    value,
  }));
  form.thresholds = Object.entries(target?.thresholds ?? {}).map(([key, value]) => ({
    key,
    value,
  }));
  form.errors = {};

  if (!form.weights.length) {
    form.weights = [{ key: 'signal.momentum', value: 1 }];
  }

  if (!form.thresholds.length) {
    form.thresholds = [{ key: 'entry.minScore', value: 0.55 }];
  }
}

watch(
  () => props.profile,
  (profile) => {
    hydrateFromProfile(profile);
  },
  { immediate: true },
);

watch(
  () => session.actor.value,
  (actor) => {
    form.actor = actor;
  },
);

function addWeightRow() {
  form.weights.push({ key: '', value: 0 });
}

function addThresholdRow() {
  form.thresholds.push({ key: '', value: 0 });
}

function removeWeightRow(index: number) {
  form.weights.splice(index, 1);
}

function removeThresholdRow(index: number) {
  form.thresholds.splice(index, 1);
}

const payload = computed<WeightProfileUpdatePayload>(() => {
  return {
    actor: form.actor,
    reason: form.reason || undefined,
    weights: form.weights.reduce<Record<string, number>>((acc, row) => {
      if (row.key.trim()) {
        acc[row.key.trim()] = Number(row.value);
      }
      return acc;
    }, {}),
    thresholds: form.thresholds.reduce<Record<string, number>>((acc, row) => {
      if (row.key.trim()) {
        acc[row.key.trim()] = Number(row.value);
      }
      return acc;
    }, {}),
  };
});

const diff = computed<ConfigDiffItem[]>(() =>
  buildConfigDiff(props.profile, payload.value),
);

function submit() {
  const validationErrors = validateWeightProfileUpdate(payload.value);
  form.errors = validationErrors;

  if (Object.keys(validationErrors).length) {
    return;
  }

  emit('submit', payload.value);
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Weight Profile Update</span>
      <v-chip v-if="profile" color="primary" variant="tonal" size="small">
        Version {{ profile.version }}
      </v-chip>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field v-model="form.actor" label="Actor" variant="outlined" maxlength="64" />
        </v-col>
        <v-col cols="12" md="8">
          <v-text-field
            v-model="form.reason"
            label="Reason (optional)"
            variant="outlined"
            maxlength="256"
            counter
          />
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <div class="d-flex justify-space-between align-center mb-2">
        <div class="text-subtitle-2">Weights</div>
        <v-btn size="small" variant="text" @click="addWeightRow">Add</v-btn>
      </div>
      <v-row v-for="(row, index) in form.weights" :key="`weight-${index}`" class="mb-1">
        <v-col cols="7">
          <v-text-field v-model="row.key" label="Weight Key" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model.number="row.value"
            label="Value"
            type="number"
            step="0.01"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="1" class="d-flex align-center">
          <v-btn
            variant="text"
            size="small"
            @click="removeWeightRow(index)"
            aria-label="Remove weight row"
          >
            Remove
          </v-btn>
        </v-col>
      </v-row>

      <div class="d-flex justify-space-between align-center mb-2 mt-4">
        <div class="text-subtitle-2">Thresholds</div>
        <v-btn size="small" variant="text" @click="addThresholdRow">Add</v-btn>
      </div>
      <v-row
        v-for="(row, index) in form.thresholds"
        :key="`threshold-${index}`"
        class="mb-1"
      >
        <v-col cols="7">
          <v-text-field v-model="row.key" label="Threshold Key" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model.number="row.value"
            label="Value"
            type="number"
            step="0.01"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="1" class="d-flex align-center">
          <v-btn
            variant="text"
            size="small"
            @click="removeThresholdRow(index)"
            aria-label="Remove threshold row"
          >
            Remove
          </v-btn>
        </v-col>
      </v-row>

      <v-alert
        v-for="(message, key) in form.errors"
        :key="key"
        type="warning"
        variant="tonal"
        class="mt-2"
      >
        {{ key }}: {{ message }}
      </v-alert>

      <ConfigDiffViewer :diff="diff" class="mt-4" />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="primary" :loading="props.loading" @click="submit">
        Save Profile
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
