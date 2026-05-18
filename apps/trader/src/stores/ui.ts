import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { TraderFilters } from '~/types/trader';

export interface UiAlert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
}

type ModalName = 'backtestLaunch' | 'controlConfirm';

function createDefaultFilters(): TraderFilters {
  return {
    watchlistSector: null,
    watchlistLiquidityTier: null,
    tradesOffset: 0,
    tradesLimit: 50,
    auditOffset: 0,
    auditLimit: 50,
  };
}

function createAlertId() {
  return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useUiStore = defineStore('ui', () => {
  const modals = ref<Record<ModalName, boolean>>({
    backtestLaunch: false,
    controlConfirm: false,
  });

  const alerts = ref<UiAlert[]>([]);
  const filters = ref<TraderFilters>(createDefaultFilters());
  const selectedRows = ref<{
    tradeId: string | null;
    backtestId: string | null;
  }>({
    tradeId: null,
    backtestId: null,
  });

  function openModal(name: ModalName) {
    modals.value[name] = true;
  }

  function closeModal(name: ModalName) {
    modals.value[name] = false;
  }

  function addAlert(payload: {
    type: UiAlert['type'];
    message: string;
    duration?: number;
  }) {
    const alert: UiAlert = {
      id: createAlertId(),
      type: payload.type,
      message: payload.message,
      duration: payload.duration ?? 4000,
    };

    alerts.value.push(alert);
    if (alert.duration > 0) {
      setTimeout(() => {
        removeAlert(alert.id);
      }, alert.duration);
    }
  }

  function removeAlert(id: string) {
    alerts.value = alerts.value.filter((alert) => alert.id !== id);
  }

  function clearAlerts() {
    alerts.value = [];
  }

  function updateFilter<K extends keyof TraderFilters>(
    key: K,
    value: TraderFilters[K],
  ) {
    filters.value[key] = value;
  }

  function selectTrade(tradeId: string | null) {
    selectedRows.value.tradeId = tradeId;
  }

  function selectBacktest(backtestId: string | null) {
    selectedRows.value.backtestId = backtestId;
  }

  const hasAlerts = computed(() => alerts.value.length > 0);

  return {
    modals,
    alerts,
    filters,
    selectedRows,
    hasAlerts,
    openModal,
    closeModal,
    addAlert,
    removeAlert,
    clearAlerts,
    updateFilter,
    selectTrade,
    selectBacktest,
  };
});
