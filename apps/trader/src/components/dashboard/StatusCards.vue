<script setup lang="ts">
import { computed } from 'vue';
import type { StatusSnapshot } from '~/types/trader';

const props = defineProps<{
  status: StatusSnapshot | null;
}>();

const cards = computed(() => {
  if (!props.status) {
    return [];
  }

  return [
    {
      title: 'Trading Mode',
      value: props.status.tradingMode.toUpperCase(),
      color:
        props.status.tradingMode === 'live'
          ? 'error'
          : props.status.tradingMode === 'paper'
            ? 'warning'
            : 'info',
      dotClass:
        props.status.tradingMode === 'live'
          ? 'bx-status-dot--error'
          : props.status.tradingMode === 'paper'
            ? 'bx-status-dot--warning'
            : '',
    },
    {
      title: 'Watchlist Size',
      value: String(props.status.watchlistSize),
      color: 'primary',
      dotClass: '',
    },
    {
      title: 'Kill-Switch',
      value: props.status.killSwitchActive ? 'ACTIVE' : 'CLEAR',
      color: props.status.killSwitchActive ? 'error' : 'success',
      dotClass: props.status.killSwitchActive
        ? 'bx-status-dot--error'
        : 'bx-status-dot--live',
    },
    {
      title: 'Go-Live Ready',
      value: props.status.capabilities.goLiveEligible ? 'YES' : 'NO',
      color: props.status.capabilities.goLiveEligible ? 'success' : 'warning',
      dotClass: props.status.capabilities.goLiveEligible
        ? 'bx-status-dot--live'
        : 'bx-status-dot--warning',
    },
  ];
});
</script>

<template>
  <v-row>
    <v-col v-for="card in cards" :key="card.title" cols="12" sm="6" md="3">
      <v-card class="bx-status-card" :class="`bx-glow-${card.color === 'primary' ? 'primary' : card.color}`">
        <v-card-text class="pa-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="bx-metric-label">{{ card.title }}</span>
            <span v-if="card.dotClass" class="bx-status-dot" :class="card.dotClass" />
          </div>
          <div class="bx-metric-value" :style="{ color: `rgb(var(--v-theme-${card.color}))` }">
            {{ card.value }}
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.bx-status-card {
  position: relative;
  overflow: hidden;
}
.bx-status-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0.3;
}
</style>
