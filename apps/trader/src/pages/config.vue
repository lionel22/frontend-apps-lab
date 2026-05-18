<script setup lang="ts">
import { onMounted } from 'vue';
import type { WeightProfileUpdatePayload } from '~/types/trader';
import { useTraderStore } from '~/stores/trader';

const trader = useTraderStore();

async function refresh(force = false) {
  await Promise.all([
    trader.fetchConfig(force),
    trader.fetchAuditLog(0, trader.auditLog.limit, undefined, undefined, force),
  ]);
}

onMounted(async () => {
  await refresh(true);
});

async function onSubmit(payload: WeightProfileUpdatePayload) {
  await trader.updateConfig(payload);
  await refresh(true);
}

async function onAuditPageChange(offset: number, limit: number) {
  await trader.fetchAuditLog(offset, limit, undefined, undefined, true);
}

async function onAuditFilter(payload: { actor?: string; type?: string }) {
  await trader.fetchAuditLog(0, trader.auditLog.limit, payload.actor, payload.type, true);
}
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert :error="trader.errors.config" title="Config Endpoint Error" />

    <ConfigForm
      :profile="trader.config"
      :loading="trader.loading.config"
      @submit="onSubmit"
    />

    <ConfigAuditLog
      :response="trader.auditLog"
      :loading="trader.loading.auditLog"
      @page-change="onAuditPageChange"
      @filter="onAuditFilter"
    />
  </div>
</template>