<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    size?: number;
    inline?: boolean;
  }>(),
  {
    label: 'Loading music control data...',
    size: 36,
    inline: false,
  },
);
</script>

<template>
  <div
    :class="inline ? 'd-inline-flex' : 'd-flex justify-center py-8'"
    class="align-center ga-3"
  >
    <v-progress-circular
      indeterminate
      :size="size"
      :width="4"
      color="primary"
    />
    <span class="text-body-2 music-copy-muted">{{ label }}</span>
  </div>
</template>
