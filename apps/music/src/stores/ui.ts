import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

export interface UiAlert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
}

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmColor: string;
}

function createAlertId() {
  return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultConfirmDialogState(): ConfirmDialogState {
  return {
    open: false,
    title: 'Confirm Action',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'primary',
  };
}

export const useUiStore = defineStore('music-ui', () => {
  const alerts = ref<UiAlert[]>([]);
  const confirmDialog = ref<ConfirmDialogState>(
    createDefaultConfirmDialogState(),
  );

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

  function openConfirmDialog(payload: {
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
  }) {
    confirmDialog.value = {
      open: true,
      title: payload.title ?? 'Confirm Action',
      message: payload.message,
      confirmText: payload.confirmText ?? 'Confirm',
      cancelText: payload.cancelText ?? 'Cancel',
      confirmColor: payload.confirmColor ?? 'primary',
    };
  }

  function closeConfirmDialog() {
    confirmDialog.value = createDefaultConfirmDialogState();
  }

  const hasAlerts = computed(() => alerts.value.length > 0);

  return {
    alerts,
    confirmDialog,
    hasAlerts,
    addAlert,
    removeAlert,
    clearAlerts,
    openConfirmDialog,
    closeConfirmDialog,
  };
});
