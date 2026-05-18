<script setup lang="ts">
import { onMounted } from 'vue';
import type { AuditLogFilters, WeightProfileUpdatePayload } from '~/types/trader';
import { useTraderStore } from '~/stores/trader';

const trader = useTraderStore();
let lastAuditFilters: AuditLogFilters = {};

async function refresh(force = false) {
  await Promise.all([
    trader.fetchConfig(force),
    trader.fetchAuditLog(0, trader.auditLog.limit, lastAuditFilters, force),
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
  await trader.fetchAuditLog(offset, limit, lastAuditFilters, true);
}

async function onAuditFilter(payload: AuditLogFilters) {
  lastAuditFilters = payload;
  await trader.fetchAuditLog(0, trader.auditLog.limit, payload, true);
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
