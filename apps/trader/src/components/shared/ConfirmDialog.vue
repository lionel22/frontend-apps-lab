<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    loading?: boolean;
  }>(),
  {
    title: 'Confirm Action',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'error',
    loading: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();

function close() {
  emit('update:modelValue', false);
  emit('cancel');
}

function confirm() {
  emit('confirm');
}
</script>

<template>
  <v-dialog :model-value="props.modelValue" max-width="520" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="text-h6">{{ props.title }}</v-card-title>
      <v-card-text>{{ props.message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="props.loading" @click="close">
          {{ props.cancelText }}
        </v-btn>
        <v-btn
          :color="props.confirmColor"
          :loading="props.loading"
          @click="confirm"
        >
          {{ props.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>