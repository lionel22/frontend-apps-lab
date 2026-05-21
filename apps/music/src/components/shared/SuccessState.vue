<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    message: string;
    eyebrow?: string;
  }>(),
  {
    title: 'Ready for the next slice',
    eyebrow: 'Foundation ready',
  },
);
</script>

<template>
  <v-card class="pa-5">
    <div class="d-flex align-center justify-space-between ga-3 mb-3">
      <div class="music-kicker">
        {{ eyebrow }}
      </div>
      <v-chip
        color="success"
        variant="tonal"
        size="small"
      >
        Stable
      </v-chip>
    </div>
    <div class="text-h6 font-weight-bold mb-2">
      {{ title }}
    </div>
    <p class="music-copy-muted text-body-2 mb-0">
      {{ message }}
    </p>
  </v-card>
</template>
