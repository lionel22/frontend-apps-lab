<script setup lang="ts">
import { computed } from 'vue';
import { useNotifications } from '~/composables/useNotifications';
import { useTraderStore } from '~/stores/trader';
import { formatDateTime } from '~/utils/formatters';

const trader = useTraderStore();
const notifications = useNotifications();

const context = computed(() => notifications.killSwitchState.value);
</script>

<template>
  <v-alert v-if="trader.isKillSwitchActive" type="error" variant="tonal" border="start">
    <div class="d-flex flex-wrap align-center justify-space-between ga-3">
      <div>
        <div class="font-weight-bold">Kill-switch active</div>
        <div style="color: rgba(226,232,240,0.78)">
          New exposure should remain blocked until an operator resumes trading.
        </div>
        <div v-if="context.timestamp" class="bx-metric-label mt-2">
          Activated {{ formatDateTime(context.timestamp) }}
          <span v-if="context.actor"> • {{ context.actor }}</span>
          <span v-if="context.reason"> • {{ context.reason }}</span>
        </div>
      </div>

      <v-btn variant="text" size="small" to="/positions">
        Review positions
      </v-btn>
    </div>
  </v-alert>
</template>