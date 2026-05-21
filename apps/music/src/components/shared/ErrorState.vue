<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    error?: string | { message?: string } | null;
    description?: string;
    retryLabel?: string;
    compact?: boolean;
  }>(),
  {
    title: 'Music API error',
    error: null,
    description: 'The current workflow could not be loaded cleanly.',
    retryLabel: 'Retry',
    compact: false,
  },
);

const emit = defineEmits<{
  retry: [];
}>();

const message = computed(() => {
  if (!props.error) {
    return props.description;
  }

  if (typeof props.error === 'string') {
    return props.error;
  }

  return props.error.message || props.description;
});
</script>

<template>
  <v-card :class="compact ? 'pa-4' : 'pa-5'">
    <div class="music-kicker mb-2">
      Controlled failure
    </div>
    <div class="text-h6 font-weight-bold mb-2">
      {{ title }}
    </div>
    <p class="music-copy-muted text-body-2 mb-4">
      {{ message }}
    </p>
    <v-btn
      color="error"
      variant="tonal"
      @click="emit('retry')"
    >
      {{ retryLabel }}
    </v-btn>
  </v-card>
</template>
