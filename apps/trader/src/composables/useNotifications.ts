import { computed } from 'vue';
import { useUiStore } from '~/stores/ui';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  source: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: string;
  requiresAck: boolean;
  acknowledgedAt: string | null;
  signature?: string;
}

export interface KillSwitchNotificationState {
  active: boolean;
  actor: string | null;
  reason: string | null;
  timestamp: string | null;
  impactedPositions: number | null;
}

function createNotificationId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createKillSwitchState(): KillSwitchNotificationState {
  return {
    active: false,
    actor: null,
    reason: null,
    timestamp: null,
    impactedPositions: null,
  };
}

export function useNotifications() {
  const ui = useUiStore();
  const items = useState<NotificationItem[]>('trader.notifications.items', () => []);
  const killSwitchState = useState<KillSwitchNotificationState>(
    'trader.notifications.killswitch',
    createKillSwitchState,
  );

  const unreadCount = computed(
    () => items.value.filter((item) => !item.acknowledgedAt).length,
  );

  function pushNotification(input: {
    source: string;
    title: string;
    message: string;
    severity: NotificationSeverity;
    requiresAck?: boolean;
    createdAt?: string;
    signature?: string;
  }) {
    if (input.signature && items.value[0]?.signature === input.signature) {
      return;
    }

    items.value = [
      {
        id: createNotificationId(),
        source: input.source,
        title: input.title,
        message: input.message,
        severity: input.severity,
        createdAt: input.createdAt ?? new Date().toISOString(),
        requiresAck: input.requiresAck ?? false,
        acknowledgedAt: null,
        signature: input.signature,
      },
      ...items.value,
    ].slice(0, 50);
  }

  function acknowledge(id: string) {
    items.value = items.value.map((item) =>
      item.id === id
        ? {
            ...item,
            acknowledgedAt: item.acknowledgedAt ?? new Date().toISOString(),
          }
        : item,
    );
  }

  function acknowledgeAll() {
    const timestamp = new Date().toISOString();
    items.value = items.value.map((item) => ({
      ...item,
      acknowledgedAt: item.acknowledgedAt ?? timestamp,
    }));
  }

  function recordKillSwitchChange(input: {
    active: boolean;
    actor?: string | null;
    reason?: string | null;
    timestamp?: string | null;
    impactedPositions?: number | null;
  }) {
    const timestamp = input.timestamp ?? new Date().toISOString();
    const actor = input.actor?.trim() || null;
    const reason = input.reason?.trim() || null;

    killSwitchState.value = input.active
      ? {
          active: true,
          actor,
          reason,
          timestamp,
          impactedPositions: input.impactedPositions ?? null,
        }
      : createKillSwitchState();

    pushNotification({
      source: 'killswitch:changed',
      title: input.active ? 'Kill-switch activated' : 'Trading resumed',
      message: input.active
        ? `${actor ?? 'Unknown actor'} • ${reason ?? 'No reason supplied'}`
        : `${actor ?? 'Unknown actor'} • ${reason ?? 'Desk resumed trading'}`,
      severity: input.active ? 'error' : 'success',
      requiresAck: input.active,
      createdAt: timestamp,
      signature: `killswitch:${input.active}:${actor ?? ''}:${reason ?? ''}`,
    });

    if (input.active) {
      ui.addAlert({
        type: 'error',
        message: 'Kill-switch activated. Acknowledge the event in the notification center.',
        duration: 0,
      });
    }
  }

  function recordEvent(eventType: string, data?: unknown) {
    const normalizedType = eventType.toLowerCase();
    const payload =
      data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

    if (normalizedType.includes('killswitch')) {
      recordKillSwitchChange({
        active: Boolean(payload.active),
        actor: typeof payload.actor === 'string' ? payload.actor : null,
        reason: typeof payload.reason === 'string' ? payload.reason : null,
        timestamp:
          typeof payload.timestamp === 'string' ? payload.timestamp : null,
      });
      return;
    }

    if (normalizedType.startsWith('backtest:')) {
      pushNotification({
        source: eventType,
        title: 'Backtest update',
        message: `Received ${eventType} from the backend.`,
        severity: 'info',
      });
      return;
    }

    if (normalizedType.includes('signal') && normalizedType.includes('stale')) {
      pushNotification({
        source: eventType,
        title: 'Signal staleness alert',
        message: 'Signal freshness degraded. Review readiness before acting.',
        severity: 'warning',
      });
    }
  }

  return {
    items,
    unreadCount,
    killSwitchState,
    pushNotification,
    acknowledge,
    acknowledgeAll,
    recordKillSwitchChange,
    recordEvent,
  };
}
