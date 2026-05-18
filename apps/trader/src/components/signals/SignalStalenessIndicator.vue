<script setup lang="ts">
defineProps<{
  staleSignals: string[];
  missingSignals: string[];
}>();
</script>

<template>
  <div class="d-flex flex-wrap ga-2">
    <v-chip
      v-for="signal in staleSignals"
      :key="`stale-${signal}`"
      color="warning"
      variant="tonal"
      size="small"
    >
      Stale: {{ signal }}
    </v-chip>
    <v-chip
      v-for="signal in missingSignals"
      :key="`missing-${signal}`"
      color="error"
      variant="tonal"
      size="small"
    >
      Missing: {{ signal }}
    </v-chip>
    <v-chip
      v-if="!staleSignals.length && !missingSignals.length"
      color="success"
      variant="tonal"
      size="small"
    >
      Signals healthy
    </v-chip>
  </div>
</template>