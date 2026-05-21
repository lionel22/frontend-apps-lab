import { computed } from 'vue';
import { useUiStore } from '~/stores/ui';
import { MUSIC_NOTIFICATION_LIMIT } from '~/utils/constants';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  source: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: string;
  acknowledgedAt: string | null;
}

function createNotificationId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useNotifications() {
  const ui = useUiStore();
  const items = useState<NotificationItem[]>('music.notifications.items', () => []);

  const unreadCount = computed(
    () => items.value.filter((item) => !item.acknowledgedAt).length,
  );

  function pushNotification(input: {
    source: string;
    title: string;
    message: string;
    severity: NotificationSeverity;
    createdAt?: string;
    pushAlert?: boolean;
  }) {
    items.value = [
      {
        id: createNotificationId(),
        source: input.source,
        title: input.title,
        message: input.message,
        severity: input.severity,
        createdAt: input.createdAt ?? new Date().toISOString(),
        acknowledgedAt: null,
      },
      ...items.value,
    ].slice(0, MUSIC_NOTIFICATION_LIMIT);

    if (input.pushAlert !== false) {
      ui.addAlert({
        type: input.severity,
        message: `${input.title}: ${input.message}`,
      });
    }
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
    const acknowledgedAt = new Date().toISOString();
    items.value = items.value.map((item) => ({
      ...item,
      acknowledgedAt: item.acknowledgedAt ?? acknowledgedAt,
    }));
  }

  return {
    items,
    unreadCount,
    pushNotification,
    acknowledge,
    acknowledgeAll,
  };
}
