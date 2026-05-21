<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useUiStore } from '~/stores/ui';

const ui = useUiStore();
const openById = reactive<Record<string, boolean>>({});

watch(
  () => ui.alerts,
  (alerts) => {
    for (const alert of alerts) {
      if (!(alert.id in openById)) {
        openById[alert.id] = true;
      }
    }
  },
  { deep: true, immediate: true },
);

function dismiss(id: string) {
  openById[id] = false;
  ui.removeAlert(id);
}
</script>

<template>
  <div>
    <v-snackbar
      v-for="alert in ui.alerts"
      :key="alert.id"
      v-model="openById[alert.id]"
      location="top right"
      :timeout="alert.duration"
      :color="alert.type"
      @update:model-value="(value) => !value && dismiss(alert.id)"
    >
      {{ alert.message }}
      <template #actions>
        <v-btn
          variant="text"
          @click="dismiss(alert.id)"
        >
          Dismiss
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
