<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  error: string | { message: string } | null;
  title?: string;
}>();

const dismissed = ref(false);

const message = computed(() => {
  if (!props.error) {
    return '';
  }
  if (typeof props.error === 'string') {
    return props.error;
  }
  return props.error.message;
});

watch(
  () => props.error,
  () => {
    dismissed.value = false;
  },
);
</script>

<template>
  <v-alert
    v-if="message && !dismissed"
    type="error"
    variant="tonal"
    closable
    class="mb-4"
    @click:close="dismissed = true"
  >
    <template #title>
      {{ title || 'Trader API Error' }}
    </template>
    {{ message }}
  </v-alert>
</template>