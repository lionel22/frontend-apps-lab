<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts';
import { useNotifications } from '~/composables/useNotifications';
import { usePermissions } from '~/composables/usePermissions';
import { useSession } from '~/composables/useSession';
import { usePositionsStore } from '~/stores/usePositionsStore';
import { useTraderStore } from '~/stores/trader';
import { validateControlAction } from '~/utils/validators';

const trader = useTraderStore();
const positions = usePositionsStore();
const session = useSession();
const { can } = usePermissions();
const notifications = useNotifications();
const keyboard = useKeyboardShortcuts();

const dialogOpen = ref(false);
const loading = ref(false);
const reason = ref('');
const localError = ref('');
const countdownRemaining = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const action = computed<'kill' | 'resume'>(() =>
  trader.isKillSwitchActive ? 'resume' : 'kill',
);

const dialogTitle = computed(() =>
  action.value === 'kill' ? 'Confirm Kill-Switch' : 'Confirm Resume',
);

const dialogMessage = computed(() =>
  action.value === 'kill'
    ? 'This action halts all trading activity immediately.'
    : 'This action resumes trading activity after a halt.',
);

const impactedPositions = computed(() => positions.positions.length);

function clearCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function startCountdown() {
  clearCountdown();
  countdownRemaining.value = 3;
  countdownTimer = setInterval(() => {
    countdownRemaining.value = Math.max(0, countdownRemaining.value - 1);
    if (countdownRemaining.value === 0) {
      clearCountdown();
    }
  }, 1000);
}

async function openDialog() {
  if (action.value === 'kill') {
    await positions.fetchPositions(true);
    startCountdown();
  } else {
    clearCountdown();
    countdownRemaining.value = 0;
  }

  reason.value = '';
  localError.value = '';
  dialogOpen.value = true;
}

async function submit() {
  const actor = session.actor.value;
  const validationErrors = validateControlAction(actor, reason.value);
  if (Object.keys(validationErrors).length) {
    localError.value = Object.values(validationErrors)[0];
    return;
  }

  loading.value = true;

  try {
    const payload = {
      actor,
      reason: reason.value,
    };

    if (action.value === 'kill') {
      await trader.executeKillSwitch(payload);
      notifications.recordKillSwitchChange({
        active: true,
        actor,
        reason: reason.value,
        timestamp: new Date().toISOString(),
        impactedPositions: impactedPositions.value,
      });
    } else {
      await trader.resumeTrading(payload);
      notifications.recordKillSwitchChange({
        active: false,
        actor,
        reason: reason.value,
        timestamp: new Date().toISOString(),
      });
    }

    await trader.fetchStatus(true);
    dialogOpen.value = false;
  } finally {
    loading.value = false;
  }
}

watch(dialogOpen, (open) => {
  if (!open) {
    clearCountdown();
    countdownRemaining.value = 0;
  }
});

onBeforeUnmount(() => {
  clearCountdown();
});

keyboard.useShortcut({
  id: 'shell-kill-switch-halt',
  key: 'h',
  label: 'Ctrl + Shift + H',
  description: 'Open the halt trading confirmation',
  ctrl: true,
  shift: true,
  isEnabled: () => can('execute_kill_switch') && action.value === 'kill' && !dialogOpen.value,
  handler: openDialog,
});

keyboard.useShortcut({
  id: 'shell-kill-switch-resume',
  key: 'r',
  label: 'Ctrl + Shift + R',
  description: 'Open the resume trading confirmation',
  ctrl: true,
  shift: true,
  isEnabled: () => can('execute_kill_switch') && action.value === 'resume' && !dialogOpen.value,
  handler: openDialog,
});
</script>

<template>
  <div class="d-inline-flex align-center">
    <v-btn
      :color="trader.isKillSwitchActive ? 'success' : 'error'"
      variant="tonal"
      size="small"
      :disabled="!can('execute_kill_switch')"
      @click="openDialog"
    >
      {{ trader.isKillSwitchActive ? 'Resume Trading' : 'Kill-Switch' }}
    </v-btn>

    <v-dialog v-model="dialogOpen" max-width="540">
      <v-card>
        <v-card-title>{{ dialogTitle }}</v-card-title>
        <v-card-text>
          <p class="mb-3" style="color: rgba(226,232,240,0.7)">{{ dialogMessage }}</p>
          <v-alert
            v-if="action === 'kill'"
            type="error"
            variant="tonal"
            class="mb-3"
          >
            {{ impactedPositions }} open position{{ impactedPositions > 1 ? 's' : '' }} will be affected.
            <span v-if="countdownRemaining > 0">
              Confirmation unlocks in {{ countdownRemaining }}s.
            </span>
          </v-alert>
          <div class="bx-metric-label mb-2">
            Actor:
            <span class="bx-mono" style="color: rgba(226,232,240,0.7)">{{ session.actor }}</span>
          </div>
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
            :color="action === 'kill' ? 'error' : 'success'"
            variant="flat"
            :loading="loading"
            :disabled="action === 'kill' && countdownRemaining > 0"
            @click="submit"
          >
            {{ action === 'kill' ? (countdownRemaining > 0 ? `Hold ${countdownRemaining}s` : 'Activate') : 'Resume' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>