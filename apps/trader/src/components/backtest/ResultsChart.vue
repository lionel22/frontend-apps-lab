<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BacktestRunDetail, BacktestEquityPoint } from '~/types/trader';
import { formatCurrency, formatDateTime, formatPercent } from '~/utils/formatters';

const props = defineProps<{
  run: BacktestRunDetail;
}>();

// ── Chart ─────────────────────────────────────────────────────────────────────
const hoveredIndex = ref<number | null>(null);
const chartWidth = 800;
const chartHeight = 200;
const padLeft = 60;
const padRight = 16;
const padTop = 12;
const padBottom = 28;
const innerW = chartWidth - padLeft - padRight;
const innerH = chartHeight - padTop - padBottom;

const curve = computed(() => props.run.equityCurve);

const minVal = computed(() => Math.min(...curve.value.map((p) => p.value)));
const maxVal = computed(() => Math.max(...curve.value.map((p) => p.value)));
const range  = computed(() => Math.max(maxVal.value - minVal.value, 1));

function cx(i: number): number {
  return padLeft + (i / Math.max(curve.value.length - 1, 1)) * innerW;
}
function cy(v: number): number {
  return padTop + innerH - ((v - minVal.value) / range.value) * innerH;
}

const polylinePoints = computed(() =>
  curve.value.map((p, i) => `${cx(i)},${cy(p.value)}`).join(' '),
);

const areaPoints = computed(() => {
  if (!curve.value.length) return '';
  const first = cx(0);
  const last  = cx(curve.value.length - 1);
  const base  = padTop + innerH;
  return `${first},${base} ${polylinePoints.value} ${last},${base}`;
});

const yLabels = computed(() => {
  const steps = 4;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const v = minVal.value + (range.value * i) / steps;
    return { y: cy(v), label: formatCurrency(v, 'USD', 0) };
  }).reverse();
});

const xLabels = computed(() => {
  if (curve.value.length < 2) return [];
  const ticks = Math.min(4, curve.value.length - 1);
  return Array.from({ length: ticks + 1 }, (_, i) => {
    const idx = Math.round((i / ticks) * (curve.value.length - 1));
    const pt  = curve.value[idx] as BacktestEquityPoint;
    return {
      x: cx(idx),
      label: new Date(pt.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });
});

const tooltip = computed(() => {
  if (hoveredIndex.value === null) return null;
  const pt = curve.value[hoveredIndex.value];
  if (!pt) return null;
  return {
    x: cx(hoveredIndex.value),
    y: cy(pt.value),
    value: formatCurrency(pt.value),
    date: formatDateTime(pt.ts),
  };
});

function onMouseMove(event: MouseEvent) {
  if (!curve.value.length) return;
  const svg = (event.currentTarget as SVGElement).getBoundingClientRect();
  const relX = event.clientX - svg.left - padLeft;
  const idx = Math.round((relX / innerW) * (curve.value.length - 1));
  hoveredIndex.value = Math.max(0, Math.min(curve.value.length - 1, idx));
}

// ── Metrics ───────────────────────────────────────────────────────────────────
const m = computed(() => props.run.metrics as Record<string, number>);

function metricVal(key: string, decimals = 2): string {
  const v = m.value[key];
  return v !== undefined ? v.toFixed(decimals) : '—';
}

const startValue = computed(() => curve.value[0]?.value ?? null);
const endValue   = computed(() => curve.value[curve.value.length - 1]?.value ?? null);
const totalReturn = computed(() => {
  if (startValue.value === null || endValue.value === null || startValue.value === 0) return null;
  return ((endValue.value - startValue.value) / startValue.value) * 100;
});

const metricsGrid = computed(() => [
  { label: 'Total Return',   value: totalReturn.value !== null ? formatPercent(totalReturn.value) : '—', color: (totalReturn.value ?? 0) >= 0 ? 'success' : 'error' },
  { label: 'Sharpe Ratio',   value: metricVal('sharpeRatio'),   color: 'primary' },
  { label: 'Max Drawdown',   value: metricVal('maxDrawdown'),   color: 'error' },
  { label: 'Win Rate',       value: m.value.winRate !== undefined ? formatPercent(m.value.winRate * 100) : '—', color: 'info' },
  { label: 'Profit Factor',  value: metricVal('profitFactor'),  color: 'warning' },
  { label: 'Calmar Ratio',   value: metricVal('calmarRatio'),   color: 'secondary' },
  { label: 'Sortino Ratio',  value: metricVal('sortinoRatio'),  color: 'teal' },
  { label: 'Total Trades',   value: String(props.run.trades.length), color: 'surface-variant' },
]);

// ── Params ────────────────────────────────────────────────────────────────────
const params = computed(() => props.run.params);
const dateRange = computed(() => {
  const s = params.value.startDate ? formatDateTime(params.value.startDate) : null;
  const e = params.value.endDate   ? formatDateTime(params.value.endDate)   : null;
  if (s && e) return `${s} → ${e}`;
  if (params.value.days) return `Last ${params.value.days} days`;
  return '—';
});
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <!-- Header card -->
    <v-card>
      <v-card-title class="d-flex align-center ga-3 flex-wrap">
        <span>Backtest {{ run.id.slice(0, 8) }}</span>
        <v-chip
          :color="run.status === 'COMPLETED' ? 'success' : run.status === 'FAILED' ? 'error' : run.status === 'RUNNING' ? 'warning' : 'info'"
          variant="tonal"
          size="small"
        >
          {{ run.status }}
        </v-chip>
        <v-spacer />
        <v-btn variant="text" size="small" to="/backtest">← Back</v-btn>
      </v-card-title>

      <!-- Run parameters -->
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis">Symbols</div>
            <div class="text-body-2 font-weight-medium">{{ params.symbols?.join(', ') || '—' }}</div>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis">Period</div>
            <div class="text-body-2 font-weight-medium">{{ dateRange }}</div>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis">Timeframe</div>
            <div class="text-body-2 font-weight-medium">{{ params.timeframe || '—' }}</div>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis">Profile</div>
            <div class="text-body-2 font-weight-medium">{{ params.profileName || '—' }}</div>
          </v-col>
          <v-col v-if="run.startedAt || run.finishedAt" cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis">Ran</div>
            <div class="text-body-2 font-weight-medium">
              {{ run.startedAt ? formatDateTime(run.startedAt) : '—' }}
              <template v-if="run.finishedAt"> → {{ formatDateTime(run.finishedAt) }}</template>
            </div>
          </v-col>
        </v-row>

        <!-- Failed error message -->
        <v-alert
          v-if="run.status === 'FAILED' && run.failureReason"
          type="error"
          variant="tonal"
          class="mt-3"
          density="compact"
        >
          {{ run.failureReason }}
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Metrics grid -->
    <v-card>
      <v-card-title>Performance Metrics</v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col
            v-for="metric in metricsGrid"
            :key="metric.label"
            cols="6"
            sm="4"
            md="3"
          >
            <v-card variant="tonal" :color="metric.color" class="pa-3 text-center">
              <div class="text-caption text-medium-emphasis mb-1">{{ metric.label }}</div>
              <div class="text-h6 font-weight-bold">{{ metric.value }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Equity curve -->
    <v-card>
      <v-card-title>Equity Curve</v-card-title>
      <v-card-text>
        <div v-if="!curve.length" class="text-medium-emphasis py-8 text-center">
          No equity data for this run.
        </div>
        <div
          v-else
          class="bx-chart-wrapper"
          style="position: relative"
          @mouseleave="hoveredIndex = null"
        >
          <svg
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
            preserveAspectRatio="none"
            style="width: 100%; height: 220px; display: block"
            @mousemove="onMouseMove"
          >
            <defs>
              <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#00e5ff" stop-opacity="0" />
              </linearGradient>
            </defs>

            <!-- Y grid lines + labels -->
            <g v-for="yl in yLabels" :key="yl.y">
              <line :x1="padLeft" :x2="chartWidth - padRight" :y1="yl.y" :y2="yl.y"
                stroke="rgba(255,255,255,0.06)" stroke-width="1" />
              <text :x="padLeft - 6" :y="yl.y + 4" text-anchor="end"
                font-size="9" fill="rgba(226,232,240,0.4)">
                {{ yl.label }}
              </text>
            </g>

            <!-- X labels -->
            <g v-for="xl in xLabels" :key="xl.x">
              <text :x="xl.x" :y="padTop + innerH + 18" text-anchor="middle"
                font-size="9" fill="rgba(226,232,240,0.4)">
                {{ xl.label }}
              </text>
            </g>

            <!-- Area fill -->
            <polygon :points="areaPoints" fill="url(#eq-grad)" />

            <!-- Curve line -->
            <polyline
              :points="polylinePoints"
              fill="none"
              stroke="#00e5ff"
              stroke-width="1.5"
              stroke-linejoin="round"
            />

            <!-- Hover crosshair -->
            <template v-if="tooltip">
              <line
                :x1="tooltip.x" :x2="tooltip.x"
                :y1="padTop" :y2="padTop + innerH"
                stroke="rgba(226,232,240,0.3)" stroke-width="1" stroke-dasharray="3,3"
              />
              <circle :cx="tooltip.x" :cy="tooltip.y" r="4" fill="#00e5ff" />
            </template>
          </svg>

          <!-- Tooltip overlay -->
          <div
            v-if="tooltip"
            class="bx-chart-tooltip"
            :style="{ left: `calc(${((tooltip.x - padLeft) / innerW) * 100}% + 6px)` }"
          >
            <div class="text-caption text-medium-emphasis">{{ tooltip.date }}</div>
            <div class="font-weight-bold">{{ tooltip.value }}</div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Trade list -->
    <v-card>
      <v-card-title class="d-flex align-center">
        Trade Log
        <v-chip class="ml-2" size="small" variant="tonal">{{ run.trades.length }}</v-chip>
      </v-card-title>
      <v-card-text>
        <v-table density="compact" hover>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>PnL</th>
              <th>Fees</th>
              <th>Opened</th>
              <th>Closed</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!run.trades.length">
              <td colspan="9" class="text-center py-8 text-medium-emphasis">
                No replayed trades for this run.
              </td>
            </tr>
            <tr v-for="(trade, i) in run.trades" :key="`trade-${i}`">
              <td class="font-weight-medium">{{ trade.symbol }}</td>
              <td>
                <v-chip :color="trade.side === 'LONG' ? 'success' : 'error'" size="x-small" variant="tonal">
                  {{ trade.side }}
                </v-chip>
              </td>
              <td class="text-mono">{{ trade.quantity }}</td>
              <td class="text-mono">{{ formatCurrency(trade.entryPrice, 'USD', 4) }}</td>
              <td class="text-mono">{{ formatCurrency(trade.exitPrice, 'USD', 4) }}</td>
              <td>
                <v-chip
                  :color="trade.pnl >= 0 ? 'success' : 'error'"
                  size="x-small"
                  variant="tonal"
                >
                  {{ formatCurrency(trade.pnl) }}
                </v-chip>
              </td>
              <td class="text-mono text-medium-emphasis">{{ formatCurrency(trade.fees, 'USD', 4) }}</td>
              <td>{{ formatDateTime(trade.openedAt ?? null) }}</td>
              <td>{{ formatDateTime(trade.closedAt ?? null) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.text-mono {
  font-family: var(--bx-font-mono, monospace);
  font-size: 0.8rem;
}

.bx-chart-tooltip {
  position: absolute;
  top: 8px;
  background: rgba(10, 14, 23, 0.92);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 6px;
  padding: 6px 10px;
  pointer-events: none;
  white-space: nowrap;
  font-size: 0.78rem;
  transform: translateX(-50%);
}
</style>
