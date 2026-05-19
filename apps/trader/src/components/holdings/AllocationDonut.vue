<script setup lang="ts">
import { computed } from 'vue';
import type { PortfolioAllocation } from '~/types/trader';
import { formatCurrency, formatPercent } from '~/utils/formatters';

const props = defineProps<{
  allocations: PortfolioAllocation[];
  totalValue: number;
}>();

const palette = ['#00e5ff', '#00e676', '#ffab00', '#ff5252', '#7c4dff', '#40c4ff'];

const chartRows = computed(() => {
  const leading = props.allocations.slice(0, 5);
  const trailing = props.allocations.slice(5);
  const remainder = trailing.reduce(
    (sum, row) => sum + row.allocationPct,
    0,
  );

  const baseRows = leading.map((row, index) => ({
    ...row,
    color: palette[index % palette.length],
  }));

  if (remainder > 0) {
    baseRows.push({
      symbol: 'Other',
      quantity: 0,
      value: trailing.reduce((sum, row) => sum + row.value, 0),
      allocationPct: remainder,
      color: 'rgba(148, 163, 184, 0.65)',
    });
  }

  return baseRows;
});

const donutStyle = computed(() => {
  if (!chartRows.value.length) {
    return {
      background: 'conic-gradient(rgba(148, 163, 184, 0.25) 0deg 360deg)',
    };
  }

  let currentAngle = 0;
  const segments: string[] = [];

  for (const row of chartRows.value) {
    const nextAngle = currentAngle + row.allocationPct * 360;
    segments.push(`${row.color} ${currentAngle}deg ${nextAngle}deg`);
    currentAngle = nextAngle;
  }

  return {
    background: `conic-gradient(${segments.join(', ')})`,
  };
});
</script>

<template>
  <v-card class="bx-donut-card" height="100%">
    <v-card-title>Allocation Snapshot</v-card-title>
    <v-card-text>
      <div class="bx-donut-layout">
        <div class="bx-donut-shell" :style="donutStyle">
          <div class="bx-donut-core">
            <div class="bx-metric-label">Marked Value</div>
            <div class="bx-mono bx-donut-value">{{ formatCurrency(totalValue) }}</div>
          </div>
        </div>

        <div class="d-flex flex-column ga-2 flex-grow-1">
          <div
            v-for="row in chartRows"
            :key="row.symbol"
            class="bx-donut-legend-row"
          >
            <div class="d-flex align-center ga-2">
              <span class="bx-donut-swatch" :style="{ background: row.color }" />
              <span class="bx-mono" style="font-size: 0.82rem">{{ row.symbol }}</span>
            </div>
            <div class="d-flex align-center ga-3">
              <span class="bx-mono" style="font-size: 0.8rem; color: rgba(226,232,240,0.68)">
                {{ formatCurrency(row.value) }}
              </span>
              <strong class="bx-mono">{{ formatPercent(row.allocationPct) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.bx-donut-card {
  background:
    radial-gradient(circle at top, rgba(255, 171, 0, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.88));
}

.bx-donut-layout {
  display: flex;
  align-items: center;
  gap: 24px;
}

.bx-donut-shell {
  width: 210px;
  height: 210px;
  border-radius: 999px;
  padding: 18px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.bx-donut-core {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: rgba(8, 15, 28, 0.96);
  border: 1px solid rgba(0, 229, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
}

.bx-donut-value {
  margin-top: 8px;
  font-size: 1rem;
  font-weight: 800;
  color: #00e5ff;
}

.bx-donut-legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(0, 229, 255, 0.08);
}

.bx-donut-swatch {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

@media (max-width: 1264px) {
  .bx-donut-layout {
    flex-direction: column;
  }
}
</style>
