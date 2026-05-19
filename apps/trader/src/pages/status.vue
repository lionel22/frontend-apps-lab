<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTraderStore } from '~/stores/trader';
import { useTraderContracts } from '~/composables/useTraderApi';
import { formatDateTime } from '~/utils/formatters';

const trader = useTraderStore();
const api = useTraderContracts();

const isInitialLoading = computed(() => trader.loading.status && !trader.status);

interface ServiceCheck {
  status: string;
  latencyMs?: number;
  detail?: string;
}

const health = ref<{
  status: string;
  uptime: number;
  timestamp: string;
  services: Record<string, ServiceCheck>;
} | null>(null);
const healthLoading = ref(false);
const healthError = ref<string | null>(null);

async function fetchHealth() {
  healthLoading.value = true;
  healthError.value = null;
  try {
    health.value = await api.fetchHealth();
  } catch (e) {
    healthError.value = e instanceof Error ? e.message : 'Health check failed';
  } finally {
    healthLoading.value = false;
  }
}

onMounted(async () => {
  await Promise.all([trader.fetchStatus(true), fetchHealth()]);
});

function serviceColor(status: string): string {
  if (status === 'ok') return 'success';
  if (status === 'degraded') return 'warning';
  return 'error';
}

function serviceIcon(status: string): string {
  if (status === 'ok') return 'mdi-check-circle';
  if (status === 'degraded') return 'mdi-alert-circle';
  return 'mdi-close-circle';
}

const uptimeFormatted = computed(() => {
  if (!health.value) return '—';
  const s = health.value.uptime;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
});

const serviceEntries = computed(() =>
  Object.entries(health.value?.services ?? {}).map(([name, check]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    ...check,
  })),
);
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert :error="trader.errors.status" title="Status Endpoint Error" />

    <template v-if="isInitialLoading">
      <v-skeleton-loader type="card" />
      <v-skeleton-loader type="table" />
    </template>
    <template v-else>
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

      <!-- Service Health Panel -->
      <v-card>
        <v-card-title class="d-flex align-center ga-2">
          Services Health
          <v-chip
            v-if="health"
            :color="serviceColor(health.status)"
            size="small"
            variant="tonal"
          >
            {{ health.status.toUpperCase() }}
          </v-chip>
          <v-btn
            size="x-small"
            variant="text"
            :loading="healthLoading"
            class="ml-auto"
            @click="fetchHealth"
          >
            Refresh
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-alert v-if="healthError" type="error" variant="tonal" density="compact" class="mb-3">
            {{ healthError }}
          </v-alert>

          <v-skeleton-loader v-if="healthLoading && !health" type="list-item-three-line" />

          <v-list v-else-if="health" density="comfortable">
            <v-list-item
              v-for="svc in serviceEntries"
              :key="svc.name"
            >
              <template #prepend>
                <v-icon :color="serviceColor(svc.status)" size="small">
                  {{ serviceIcon(svc.status) }}
                </v-icon>
              </template>
              <v-list-item-title>{{ svc.name }}</v-list-item-title>
              <v-list-item-subtitle v-if="svc.detail" class="text-error">
                {{ svc.detail }}
              </v-list-item-subtitle>
              <template #append>
                <div class="d-flex align-center ga-2">
                  <span v-if="svc.latencyMs !== undefined" class="text-caption text-medium-emphasis">
                    {{ svc.latencyMs }}ms
                  </span>
                  <v-chip :color="serviceColor(svc.status)" size="x-small" variant="tonal">
                    {{ svc.status }}
                  </v-chip>
                </div>
              </template>
            </v-list-item>

            <v-divider class="my-2" />

            <v-list-item>
              <v-list-item-title>API Uptime</v-list-item-title>
              <template #append>
                <span class="text-body-2 font-weight-medium">{{ uptimeFormatted }}</span>
              </template>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Last Check</v-list-item-title>
              <template #append>
                {{ formatDateTime(health.timestamp) }}
              </template>
            </v-list-item>
          </v-list>

          <div v-else-if="!healthLoading" class="text-medium-emphasis py-4 text-center">
            Health data unavailable.
          </div>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
