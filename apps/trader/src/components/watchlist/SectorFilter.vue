<script setup lang="ts">
const props = defineProps<{
  modelValue: string | null;
  options: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();
</script>

<template>
  <v-select
    :model-value="props.modelValue"
    :items="props.options"
    label="Sector"
    clearable
    density="comfortable"
    variant="outlined"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>