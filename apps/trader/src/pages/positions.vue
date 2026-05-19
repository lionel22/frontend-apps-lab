<script setup lang="ts">
import { computed, onMounted } from 'vue';
import type { PositionHealth } from '~/types/trader';
import { usePositionsStore } from '~/stores/usePositionsStore';
import { useTraderStore } from '~/stores/trader';
import { usePolling } from '~/composables/usePolling';

const trader = useTraderStore();
const positions = usePositionsStore();

async function refresh(force = false) {
  await Promise.all([trader.fetchStatus(force), positions.refreshSnapshot(force)]);
}

onMounted(async () => {
  await refresh(true);
});

usePolling(async () => {
  await refresh(true);
}, { interval: trader.pollingIntervals.positions, immediate: false });

const cards = computed(() => positions.positionsWithHealth);
const isInitialLoading = computed(
  () =>
    (positions.loading.positions || positions.loading.positionHealth) &&
    cards.value.length === 0,
);

function resolveAgeTone(positionHealth: PositionHealth | null) {
  if (!positionHealth) {
    return 'info';
  }

  const ratio =
    positionHealth.positionAgeHours /
    Math.max(positionHealth.averageTradeDurationHours, 0.01);

  if (ratio >= 1.75) {
    return 'error';
  }
  if (ratio >= 1) {
    return 'warning';
  }
  return 'success';
}
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <SharedApiErrorAlert :error="positions.errors.positions" title="Positions Endpoint Error" />
    <SharedApiErrorAlert :error="positions.errors.positionHealth" title="Position Health Endpoint Error" />

    <template v-if="isInitialLoading">
      <v-skeleton-loader type="card" />
      <v-row>
        <v-col cols="12" xl="6"><v-skeleton-loader type="card" /></v-col>
        <v-col cols="12" xl="6"><v-skeleton-loader type="card" /></v-col>
      </v-row>
    </template>
    <template v-else>
      <v-row>
        <v-col cols="12">
          <PositionsRiskIndicator :positions="positions.positions" />
        </v-col>
      </v-row>

      <v-row v-if="cards.length">
        <v-col v-for="card in cards" :key="card.position.id" cols="12" xl="6">
          <v-card class="bx-position-card">
            <v-card-title class="d-flex flex-wrap align-center justify-space-between ga-3">
              <div class="d-flex flex-wrap align-center ga-2">
                <span>{{ card.position.symbol }}</span>
                <v-chip
                  :color="card.position.side === 'LONG' ? 'success' : 'warning'"
                  variant="tonal"
                  size="small"
                >
                  {{ card.position.side }}
                </v-chip>
              </div>
              <v-chip
                :color="resolveAgeTone(card.health)"
                variant="outlined"
                size="small"
              >
                {{ card.health ? `${Math.round(card.health.positionAgeHours)}h live` : 'Age pending' }}
              </v-chip>
            </v-card-title>
            <v-card-text class="d-flex flex-column ga-4">
              <div class="d-flex flex-wrap ga-3">
                <v-chip size="small" variant="outlined">Qty {{ card.position.quantity.toFixed(4) }}</v-chip>
                <v-chip size="small" variant="outlined">Entry {{ card.position.entryPrice.toFixed(2) }}</v-chip>
                <v-chip size="small" variant="outlined">Mark {{ card.position.markPrice.toFixed(2) }}</v-chip>
                <v-chip
                  size="small"
                  :color="card.position.unrealizedPnl >= 0 ? 'success' : 'error'"
                  variant="tonal"
                >
                  UPNL {{ card.position.unrealizedPnl.toFixed(2) }}
                </v-chip>
              </div>

              <PositionsHealthGauge :health="card.health" />
              <PositionsExitPressureIndicator :pressure="card.health?.exitPressureScore ?? null" />
              <PositionsRiskRewardBar :position="card.position" :health="card.health" />

              <div v-if="card.health" class="d-flex flex-column ga-2">
                <div
                  v-for="dimension in Object.values(card.health.dimensions)"
                  :key="dimension.label"
                  class="bx-dimension-row"
                >
                  <div class="d-flex justify-space-between align-center ga-3">
                    <span class="bx-dimension-label">{{ dimension.label }}</span>
                    <span class="bx-dimension-score">{{ Math.round(dimension.score) }}/100</span>
                  </div>
                  <div class="bx-dimension-detail">{{ dimension.detail }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card v-else>
        <v-card-text class="text-center py-8 text-medium-emphasis">
          No open positions.
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.bx-position-card {
  min-height: 100%;
}

.bx-dimension-row {
  border-radius: 14px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.44);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.bx-dimension-label {
  font-size: 0.76rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.62);
}

.bx-dimension-score {
  font-family: var(--bx-font-mono);
  font-size: 0.82rem;
  font-weight: 700;
  color: rgba(248, 250, 252, 0.92);
}

.bx-dimension-detail {
  margin-top: 8px;
  font-size: 0.78rem;
  line-height: 1.45;
  color: rgba(226, 232, 240, 0.68);
}
</style>
