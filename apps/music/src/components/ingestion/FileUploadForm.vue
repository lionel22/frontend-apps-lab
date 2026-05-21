<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { MusicUploadIngestionInput } from '~/types/music';
import { formatUploadLimit } from '~/utils/formatters';

const props = withDefaults(
  defineProps<{
    pending?: boolean;
    disabled?: boolean;
    submitError?: string | null;
    successKey?: string | null;
    uploadLimitMb: number;
    acceptedExtensions: readonly string[];
  }>(),
  {
    pending: false,
    disabled: false,
    submitError: null,
    successKey: null,
  },
);

const emit = defineEmits<{
  submit: [payload: MusicUploadIngestionInput];
}>();

const files = ref<File[]>([]);
const sourceLabel = ref('');
const validationError = ref<string | null>(null);

const isBusy = computed(() => props.pending || props.disabled);
const visibleError = computed(() => validationError.value ?? props.submitError);
const acceptValue = computed(() => ['audio/*', ...props.acceptedExtensions].join(','));
const totalSizeMb = computed(() => {
  const totalBytes = files.value.reduce((sum, file) => sum + file.size, 0);
  return totalBytes / (1024 * 1024);
});

function resetForm() {
  files.value = [];
  sourceLabel.value = '';
  validationError.value = null;
}

function hasAcceptedExtension(file: File): boolean {
  const normalizedName = file.name.trim().toLowerCase();
  return props.acceptedExtensions.some((extension) =>
    normalizedName.endsWith(extension.toLowerCase()),
  );
}

function validateFiles(selectedFiles: File[]): string | null {
  if (selectedFiles.length === 0) {
    return 'Choose at least one audio file.';
  }

  const maxBytes = props.uploadLimitMb * 1024 * 1024;
  const oversizedFile = selectedFiles.find((file) => file.size > maxBytes);
  if (oversizedFile) {
    return `${oversizedFile.name} exceeds the ${formatUploadLimit(props.uploadLimitMb)} upload limit.`;
  }

  const unsupportedFile = selectedFiles.find(
    (file) => !file.type.startsWith('audio/') && !hasAcceptedExtension(file),
  );
  if (unsupportedFile) {
    return `${unsupportedFile.name} is not a supported audio file.`;
  }

  return null;
}

function submit() {
  validationError.value = validateFiles(files.value);

  if (validationError.value) {
    return;
  }

  emit('submit', {
    files: files.value,
    sourceLabel: sourceLabel.value.trim() || undefined,
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
</script>

<template>
  <v-card class="pa-5 h-100">
    <div class="d-flex align-center justify-space-between ga-3 mb-4">
      <div>
        <div class="music-kicker mb-2">
          File upload
        </div>
        <div class="text-h6 font-weight-bold">
          Send local audio files
        </div>
      </div>
      <v-chip
        class="music-shell-chip"
        color="secondary"
        variant="tonal"
        size="small"
      >
        {{ formatUploadLimit(uploadLimitMb) }} max
      </v-chip>
    </div>

    <p class="music-copy-muted text-body-2 mb-4">
      Use common audio formats and keep the upload source labeled so failures stay actionable in jobs monitoring.
    </p>

    <v-form @submit.prevent="submit">
      <v-file-input
        v-model="files"
        label="Audio files"
        :accept="acceptValue"
        variant="outlined"
        density="comfortable"
        chips
        counter
        multiple
        show-size
        hide-details="auto"
        :disabled="isBusy"
      />

      <v-text-field
        v-model="sourceLabel"
        class="mt-4"
        label="Batch label"
        placeholder="Optional shorthand for this upload batch"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        :disabled="isBusy"
      />

      <div class="d-flex flex-wrap ga-2 mt-4">
        <v-chip
          v-for="extension in acceptedExtensions"
          :key="extension"
          class="music-shell-chip"
          size="small"
          variant="outlined"
        >
          {{ extension }}
        </v-chip>
        <v-chip
          v-if="files.length"
          class="music-shell-chip"
          color="primary"
          size="small"
          variant="tonal"
        >
          {{ files.length }} files • {{ totalSizeMb.toFixed(1) }} MB
        </v-chip>
      </div>

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
          Audio uploads default to {{ formatUploadLimit(uploadLimitMb) }} until a richer backend capability contract exists.
        </div>
        <v-btn
          color="primary"
          type="submit"
          :loading="props.pending"
          :disabled="isBusy"
        >
          Upload files
        </v-btn>
      </div>
    </v-form>
  </v-card>
</template>
