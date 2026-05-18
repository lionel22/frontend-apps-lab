import { computed } from 'vue';
import { useSession } from '~/composables/useSession';

type Permission =
  | 'execute_kill_switch'
  | 'resume_trading'
  | 'update_config'
  | 'launch_backtest'
  | 'view_audit_log';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  viewer: ['view_audit_log'],
  operator: [
    'execute_kill_switch',
    'resume_trading',
    'update_config',
    'launch_backtest',
    'view_audit_log',
  ],
  admin: [
    'execute_kill_switch',
    'resume_trading',
    'update_config',
    'launch_backtest',
    'view_audit_log',
  ],
};

export function usePermissions() {
  const session = useSession();

  const currentPermissions = computed(() => {
    return ROLE_PERMISSIONS[session.role.value] ?? [];
  });

  function can(permission: Permission): boolean {
    return currentPermissions.value.includes(permission);
  }

  return {
    can,
    permissions: currentPermissions,
  };
}
