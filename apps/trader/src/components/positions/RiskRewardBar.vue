<script setup lang="ts">
import { computed } from 'vue';
import type { Position, PositionHealth } from '~/types/trader';
import { formatCurrency } from '~/utils/formatters';

const props = defineProps<{
  position: Position;
  health: PositionHealth | null;
}>();

const stopPrice = computed(() => props.health?.syntheticStopPrice ?? null);

const targetPrice = computed(() => {
  if (stopPrice.value === null) {
    return null;
  }

  const riskDistance = Math.abs(props.position.entryPrice - stopPrice.value);
  return props.position.side === 'SHORT'
    ? props.position.entryPrice - riskDistance * 2
    : props.position.entryPrice + riskDistance * 2;
});

const range = computed(() => {
  const values = [props.position.entryPrice, props.position.markPrice];
  if (stopPrice.value !== null) {
    values.push(stopPrice.value);
  }
  if (targetPrice.value !== null) {
    values.push(targetPrice.value);
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
});

function percentFor(value: number | null) {
  if (value === null) {
    return '0%';
  }

  const spread = Math.max(range.value.max - range.value.min, 0.0001);
  return `${((value - range.value.min) / spread) * 100}%`;
}
</script>

<template>
  <div class="bx-risk-reward">
    <div class="d-flex justify-space-between align-center ga-3 mb-3">
      <span class="bx-metric-label">Risk / Reward</span>
      <span class="bx-metric-caption">Synthetic 1R stop to 2R target</span>
    </div>

    <div class="bx-risk-reward-track">
      <div
        v-if="stopPrice !== null"
        class="bx-risk-reward-zone bx-risk-reward-zone--risk"
        :style="{ left: percentFor(stopPrice), width: `calc(${percentFor(position.entryPrice)} - ${percentFor(stopPrice)})` }"
      />
      <div
        v-if="targetPrice !== null"
        class="bx-risk-reward-zone bx-risk-reward-zone--reward"
        :style="{ left: percentFor(position.entryPrice), width: `calc(${percentFor(targetPrice)} - ${percentFor(position.entryPrice)})` }"
      />

      <div v-if="stopPrice !== null" class="bx-risk-marker bx-risk-marker--stop" :style="{ left: percentFor(stopPrice) }">
        <span>Stop</span>
      </div>
      <div class="bx-risk-marker bx-risk-marker--entry" :style="{ left: percentFor(position.entryPrice) }">
        <span>Entry</span>
      </div>
      <div class="bx-risk-marker bx-risk-marker--mark" :style="{ left: percentFor(position.markPrice) }">
        <span>Now</span>
      </div>
      <div v-if="targetPrice !== null" class="bx-risk-marker bx-risk-marker--target" :style="{ left: percentFor(targetPrice) }">
        <span>Target</span>
      </div>
    </div>

    <div class="d-flex flex-wrap justify-space-between ga-3 mt-3 bx-metric-caption">
      <span v-if="stopPrice !== null">{{ formatCurrency(stopPrice) }}</span>
      <span>{{ formatCurrency(position.entryPrice) }}</span>
      <span>{{ formatCurrency(position.markPrice) }}</span>
      <span v-if="targetPrice !== null">{{ formatCurrency(targetPrice) }}</span>
    </div>
  </div>
</template>

<style scoped>
.bx-risk-reward {
  border-radius: 16px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.52);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.bx-risk-reward-track {
  position: relative;
  height: 18px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  overflow: hidden;
}

.bx-risk-reward-zone {
  position: absolute;
  top: 0;
  bottom: 0;
}

.bx-risk-reward-zone--risk {
  background: linear-gradient(90deg, rgba(255, 23, 68, 0.42), rgba(255, 82, 82, 0.2));
}

.bx-risk-reward-zone--reward {
  background: linear-gradient(90deg, rgba(0, 230, 118, 0.24), rgba(0, 230, 118, 0.42));
}

.bx-risk-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.85);
}

.bx-risk-marker span {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.68);
}

.bx-risk-marker--stop {
  background: #ff5252;
}

.bx-risk-marker--entry {
  background: #90caf9;
}

.bx-risk-marker--mark {
  background: #00e5ff;
}

.bx-risk-marker--target {
  background: #00e676;
}

.bx-metric-label {
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.58);
}

.bx-metric-caption {
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.62);
}
</style>
