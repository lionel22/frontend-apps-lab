<script setup lang="ts">
import type { Trade } from '~/types/trader';

defineProps<{
  trade: Trade;
}>();
</script>

<template>
  <div class="bx-expander">
    <div class="bx-metric-label mb-2">Signal Snapshot</div>
    <pre class="bx-code-block">{{ JSON.stringify(trade.signalSnapshot || {}, null, 2) }}</pre>
    <div class="mt-3 d-flex align-center ga-2">
      <span class="bx-metric-label">Regime Context</span>
      <span class="bx-mono" style="font-size: 0.78rem; color: rgba(226,232,240,0.7)">{{ trade.regimeContext || 'N/A' }}</span>
    </div>
  </div>
</template>

<style scoped>
.bx-expander {
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(0, 229, 255, 0.03);
  border: 1px solid rgba(0, 229, 255, 0.06);
}
.bx-code-block {
  font-family: var(--bx-font-mono);
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.65);
  white-space: pre-wrap;
  word-break: break-all;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 229, 255, 0.04);
}
</style>
