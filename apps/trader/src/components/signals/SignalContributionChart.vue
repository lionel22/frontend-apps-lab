<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  contributions: Record<string, number>;
}>();

const rows = computed(() => {
  return Object.entries(props.contributions)
    .map(([signal, value]) => ({ signal, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
});

function barWidth(value: number) {
  const normalized = Math.min(Math.abs(value), 1);
  return `${Math.max(normalized * 100, 4)}%`;
}

function color(value: number) {
  return value >= 0 ? 'success' : 'error';
}
</script>

<template>
  <div class="d-flex flex-column ga-3">
    <div
      v-for="row in rows"
      :key="row.signal"
      class="d-flex align-center ga-3"
    >
      <div style="width: 160px" class="text-caption font-weight-medium text-truncate">
        {{ row.signal }}
      </div>
      <v-sheet
        :color="color(row.value)"
        :width="barWidth(row.value)"
        height="12"
        rounded
      />
      <div class="text-caption text-medium-emphasis" style="width: 60px">
        {{ row.value.toFixed(2) }}
      </div>
    </div>
  </div>
</template>