<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { AuditLogFilters } from '~/types/trader';
import { useTraderStore } from '~/stores/trader';

const trader = useTraderStore();
const lastFilter = ref<AuditLogFilters>({});

onMounted(async () => {
  await trader.fetchAuditLog(
    trader.auditLog.offset,
    trader.auditLog.limit,
    {},
    true,
  );
});

async function onFilter(payload: AuditLogFilters) {
  lastFilter.value = payload;
  await trader.fetchAuditLog(0, trader.auditLog.limit, payload, true);
}

async function onPageChange(offset: number, limit: number) {
  await trader.fetchAuditLog(
    offset,
    limit,
    lastFilter.value,
    true,
  );
}
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert :error="trader.errors.auditLog" title="Audit Log Endpoint Error" />

    <ConfigAuditLog
      :response="trader.auditLog"
      :loading="trader.loading.auditLog"
      @filter="onFilter"
      @page-change="onPageChange"
    />
  </div>
</template>
