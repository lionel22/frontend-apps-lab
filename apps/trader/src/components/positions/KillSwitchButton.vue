<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSession } from '~/composables/useSession';
import { validateControlAction } from '~/utils/validators';

const props = withDefaults(
  defineProps<{
    killSwitchActive: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    loading: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  'kill-switch': [payload: { actor: string; reason: string }];
  resume: [payload: { actor: string; reason: string }];
}>();

const session = useSession();
const dialogOpen = ref(false);
const pendingAction = ref<'kill' | 'resume'>('kill');
const reason = ref('');
const localError = ref('');

const dialogTitle = computed(() =>
  pendingAction.value === 'kill' ? 'Confirm Kill-Switch' : 'Confirm Resume',
);

const dialogMessage = computed(() =>
  pendingAction.value === 'kill'
    ? 'This action halts all trading activity immediately.'
    : 'This action resumes trading activity after a halt.',
);

function open(action: 'kill' | 'resume') {
  pendingAction.value = action;
  reason.value = '';
  localError.value = '';
  dialogOpen.value = true;
}

function submit() {
  const actor = session.actor.value;
  const validationErrors = validateControlAction(actor, reason.value);
  if (Object.keys(validationErrors).length) {
    localError.value = Object.values(validationErrors)[0];
    return;
  }

  const payload = {
    actor,
    reason: reason.value,
  };

  if (pendingAction.value === 'kill') {
    emit('kill-switch', payload);
  } else {
    emit('resume', payload);
  }

  dialogOpen.value = false;
}
</script>

<template>
  <v-card>
    <v-card-title>Execution Controls</v-card-title>
    <v-card-text>
      <div class="d-flex flex-wrap ga-3">
        <v-btn
          color="error"
          variant="flat"
          :disabled="props.disabled || props.killSwitchActive"
          :loading="props.loading && !props.killSwitchActive"
          @click="open('kill')"
        >
          ⚡ Activate Kill-Switch
        </v-btn>
        <v-btn
          color="success"
          variant="flat"
          :disabled="props.disabled || !props.killSwitchActive"
          :loading="props.loading && props.killSwitchActive"
          @click="open('resume')"
        >
          ▶ Resume Trading
        </v-btn>
      </div>
      <div class="bx-metric-label mt-3">
        Actor: <span class="bx-mono" style="color: rgba(226,232,240,0.6)">{{ session.actor }}</span>
      </div>
    </v-card-text>
  </v-card>

  <v-dialog v-model="dialogOpen" max-width="540">
    <v-card>
      <v-card-title>{{ dialogTitle }}</v-card-title>
      <v-card-text>
        <p class="mb-3" style="color: rgba(226,232,240,0.7)">{{ dialogMessage }}</p>
        <v-textarea
          v-model="reason"
          label="Reason"
          rows="3"
          maxlength="120"
          counter
        />
        <v-alert v-if="localError" type="warning" variant="tonal" class="mt-2">
          {{ localError }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialogOpen = false">Cancel</v-btn>
        <v-btn
          :color="pendingAction === 'kill' ? 'error' : 'success'"
          variant="flat"
          :loading="props.loading"
          @click="submit"
        >
          {{ pendingAction === 'kill' ? '⚡ Activate' : '▶ Resume' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
