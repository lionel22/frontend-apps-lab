<script setup lang="ts">
import { onMounted } from 'vue';
import { useTraderStore } from '~/stores/trader';
import { formatDateTime } from '~/utils/formatters';

const trader = useTraderStore();

onMounted(async () => {
  await trader.fetchStatus(true);
});
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert :error="trader.errors.status" title="Status Endpoint Error" />

    <DashboardStatusCards :status="trader.status" />

    <v-card>
      <v-card-title>Capability Flags</v-card-title>
      <v-card-text>
        <v-list density="comfortable">
          <v-list-item>
            <v-list-item-title>Valid Backtests</v-list-item-title>
            <template #append>
              <v-chip
                :color="trader.status?.capabilities.hasValidBacktests ? 'success' : 'warning'"
                size="small"
                variant="tonal"
              >
                {{ trader.status?.capabilities.hasValidBacktests ? 'yes' : 'no' }}
              </v-chip>
            </template>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Paper Trading Evidence</v-list-item-title>
            <template #append>
              <v-chip
                :color="trader.status?.capabilities.hasPaperTradingEvidence ? 'success' : 'warning'"
                size="small"
                variant="tonal"
              >
                {{ trader.status?.capabilities.hasPaperTradingEvidence ? 'yes' : 'no' }}
              </v-chip>
            </template>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Go-Live Eligible</v-list-item-title>
            <template #append>
              <v-chip
                :color="trader.status?.capabilities.goLiveEligible ? 'success' : 'error'"
                size="small"
                variant="tonal"
              >
                {{ trader.status?.capabilities.goLiveEligible ? 'yes' : 'no' }}
              </v-chip>
            </template>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Last Updated</v-list-item-title>
            <template #append>
              {{ formatDateTime(trader.status?.timestamp || null) }}
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
</template>