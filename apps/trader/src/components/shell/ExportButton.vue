<script setup lang="ts">
withDefaults(
  defineProps<{
    loading?: boolean;
    disabled?: boolean;
    label?: string;
    statusText?: string;
  }>(),
  {
    loading: false,
    disabled: false,
    label: 'Export CSV',
    statusText: 'Preparing export...',
  },
);

const emit = defineEmits<{
  download: [];
  cancel: [];
}>();
</script>

<template>
  <div class="d-flex flex-column align-end ga-2">
    <v-btn
      v-if="!loading"
      color="primary"
      variant="tonal"
      :disabled="disabled"
      @click="emit('download')"
    >
      {{ label }}
    </v-btn>

    <div v-else class="bx-export-state">
      <div class="d-flex align-center justify-space-between ga-3">
        <div class="d-flex align-center ga-2">
          <v-progress-circular indeterminate size="18" width="2" color="primary" />
          <span class="bx-metric-label">{{ statusText }}</span>
        </div>
        <v-btn size="small" variant="text" @click="emit('cancel')">
          Cancel
        </v-btn>
      </div>
      <v-progress-linear indeterminate color="primary" class="mt-2" />
    </div>
  </div>
</template>

<style scoped>
.bx-export-state {
  min-width: 220px;
}
</style>
