<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    message: string;
    actionLabel?: string;
  }>(),
  {
    title: 'Nothing here yet',
    actionLabel: '',
  },
);

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <v-card class="pa-5">
    <div class="music-kicker mb-2">
      Empty state
    </div>
    <div class="text-h6 font-weight-bold mb-2">
      {{ title }}
    </div>
    <p class="music-copy-muted text-body-2 mb-4">
      {{ message }}
    </p>
    <v-btn
      v-if="actionLabel"
      color="primary"
      variant="tonal"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </v-btn>
  </v-card>
</template>
