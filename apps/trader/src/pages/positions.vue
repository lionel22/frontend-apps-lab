<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useTraderStore } from '~/stores/trader';
import { usePermissions } from '~/composables/usePermissions';
import { usePolling } from '~/composables/usePolling';

const trader = useTraderStore();
const { can } = usePermissions();
const actionLoading = ref(false);

async function refresh(force = false) {
  await Promise.all([trader.fetchStatus(force), trader.fetchPositions(force)]);
}

onMounted(async () => {
  await refresh(true);
});

usePolling(async () => {
  await refresh(true);
}, { interval: trader.pollingIntervals.positions, immediate: false });

async function triggerKillSwitch(payload: { actor: string; reason: string }) {
  actionLoading.value = true;
  try {
    await trader.executeKillSwitch(payload);
    await refresh(true);
  } finally {
    actionLoading.value = false;
  }
}

async function resumeTrading(payload: { actor: string; reason: string }) {
  actionLoading.value = true;
  try {
    await trader.resumeTrading(payload);
    await refresh(true);
  } finally {
    actionLoading.value = false;
  }
}
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert :error="trader.errors.positions" title="Positions Endpoint Error" />

    <v-row>
      <v-col cols="12" lg="4">
        <PositionsRiskIndicator :positions="trader.positions" />
      </v-col>
      <v-col cols="12" lg="8">
        <PositionsKillSwitchButton
          :kill-switch-active="trader.isKillSwitchActive"
          :loading="actionLoading"
          :disabled="!can('execute_kill_switch')"
          @kill-switch="triggerKillSwitch"
          @resume="resumeTrading"
        />
      </v-col>
    </v-row>

    <PositionsTable :positions="trader.positions" />
  </div>
</template>