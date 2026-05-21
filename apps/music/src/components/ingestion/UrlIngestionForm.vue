<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { MusicUrlIngestionInput } from '~/types/music';

const props = withDefaults(
  defineProps<{
    pending?: boolean;
    disabled?: boolean;
    submitError?: string | null;
    successKey?: string | null;
    prefillUrl?: string | null;
    prefillLabel?: string | null;
    prefillKey?: string | null;
  }>(),
  {
    pending: false,
    disabled: false,
    submitError: null,
    successKey: null,
    prefillUrl: null,
    prefillLabel: null,
    prefillKey: null,
  },
);

const emit = defineEmits<{
  submit: [payload: MusicUrlIngestionInput];
}>();

const url = ref('');
const label = ref('');
const validationError = ref<string | null>(null);

const isBusy = computed(() => props.pending || props.disabled);
const visibleError = computed(() => validationError.value ?? props.submitError);

function validateUrl(value: string): string | null {
  if (!value) {
    return 'Enter a URL before submitting.';
  }

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Use an http or https URL.';
    }

    return null;
  } catch {
    return 'Enter a valid URL.';
  }
}

function resetForm() {
  url.value = '';
  label.value = '';
  validationError.value = null;
}

function applyPrefill() {
  url.value = props.prefillUrl ?? '';
  label.value = props.prefillLabel ?? '';
  validationError.value = null;
}

function submit() {
  const normalizedUrl = url.value.trim();
  validationError.value = validateUrl(normalizedUrl);

  if (validationError.value) {
    return;
  }

  emit('submit', {
    url: normalizedUrl,
    label: label.value.trim() || undefined,
  });
}

watch(
  () => props.successKey,
  (current, previous) => {
    if (!current || current === previous) {
      return;
    }

    resetForm();
  },
);

watch(
  () => props.prefillKey,
  (current, previous) => {
    if (!current || current === previous) {
      return;
    }

    applyPrefill();
  },
);
</script>

<template>
  <v-card class="pa-5 h-100">
    <div class="d-flex align-center justify-space-between ga-3 mb-4">
      <div>
        <div class="music-kicker mb-2">
          URL ingestion
        </div>
        <div class="text-h6 font-weight-bold">
          Queue a remote source
        </div>
      </div>
      <v-chip
        class="music-shell-chip"
        color="primary"
        variant="tonal"
        size="small"
      >
        Single source
      </v-chip>
    </div>

    <p class="music-copy-muted text-body-2 mb-4">
      Submit a direct music URL and keep the resulting job traceable from the canonical jobs view.
    </p>

    <v-form @submit.prevent="submit">
      <v-text-field
        v-model="url"
        label="Source URL"
        placeholder="https://example.com/track.mp3"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        :disabled="isBusy"
      />

      <v-text-field
        v-model="label"
        class="mt-4"
        label="Operator label"
        placeholder="Optional shorthand for the jobs list"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        :disabled="isBusy"
      />

      <v-alert
        v-if="visibleError"
        type="error"
        variant="tonal"
        class="mt-4"
      >
        {{ visibleError }}
      </v-alert>

      <div class="d-flex align-center justify-space-between flex-wrap ga-3 mt-5">
        <div class="text-caption music-copy-muted">
          Valid URLs enqueue exactly once per submission action.
        </div>
        <v-btn
          color="primary"
          type="submit"
          :loading="props.pending"
          :disabled="isBusy"
        >
          Queue URL
        </v-btn>
      </div>
    </v-form>
  </v-card>
</template>
