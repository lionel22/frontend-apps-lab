<script setup lang="ts">
defineProps<{
  kicker?: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="d-flex flex-column flex-md-row justify-space-between align-md-end ga-4 mb-6">
    <div>
      <div
        v-if="kicker"
        class="music-kicker mb-2"
      >
        {{ kicker }}
      </div>
      <h1 class="text-h4 font-weight-bold mb-2">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="music-copy-muted text-body-1 mb-0"
      >
        {{ description }}
      </p>
    </div>
    <div class="d-flex align-center ga-2 flex-wrap">
      <slot name="actions" />
    </div>
  </div>
</template>
