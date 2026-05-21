<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts';
import { useNotifications } from '~/composables/useNotifications';
import { NAV_ITEMS } from '~/utils/constants';
import { useSSE } from '~/composables/useSSE';
import { useSession } from '~/composables/useSession';
import { useUiStore } from '~/stores/ui';
import { useTraderStore } from '~/stores/trader';

const drawer = ref(true);
const route = useRoute();
useSSE();
const display = useDisplay();
const session = useSession();
const keyboard = useKeyboardShortcuts();
const notifications = useNotifications();
const ui = useUiStore();
const trader = useTraderStore();

const isDesktop = computed(() => display.mdAndUp.value);

const tradingModeBadge = computed(() => {
  const mode = trader.status?.tradingMode;
  if (!mode) return null;
  const map: Record<string, { label: string; color: string }> = {
    live: { label: 'LIVE', color: 'error' },
    paper: { label: 'PAPER', color: 'warning' },
    backtest: { label: 'BACKTEST', color: 'info' },
  };
  return map[mode] ?? { label: mode.toUpperCase(), color: 'secondary' };
});

const sessionBanner = computed(() => {
  if (session.expired.value) {
    return 'Session expired. Refresh credentials to continue protected actions.';
  }
  if (!session.isAuthenticated.value && session.requireAuth.value) {
    return 'Authentication is required for this environment.';
  }
  return '';
});

async function navigateRelative(offset: -1 | 1) {
  const currentIndex = NAV_ITEMS.findIndex((item) => item.to === route.path);
  if (currentIndex === -1) {
    return;
  }

  const target = NAV_ITEMS[currentIndex + offset];
  if (!target) {
    return;
  }

  await navigateTo(target.to);
}

const currentTime = ref('');
function updateClock() {
  currentTime.value = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
updateClock();
if (import.meta.client) {
  setInterval(updateClock, 1000);
}

function toggleNavigation() {
  drawer.value = !drawer.value;
}

watch(
  () => ({
    requireAuth: session.requireAuth.value,
    isAuthenticated: session.isAuthenticated.value,
    expired: session.expired.value,
    currentPath: route.path,
  }),
  ({ requireAuth, isAuthenticated, expired, currentPath }) => {
    if (!requireAuth || currentPath === '/login') {
      return;
    }

    if (!isAuthenticated || expired) {
      void navigateTo({
        path: '/login',
        query: { redirect: currentPath },
      });
    }
  },
  { immediate: true },
);

watch(
  () => ({
    isExpiringSoon: session.isExpiringSoon.value,
    expiryWarningShown: session.expiryWarningShown.value,
    expiresAt: session.expiresAt.value,
  }),
  ({ isExpiringSoon, expiryWarningShown, expiresAt }) => {
    if (!isExpiringSoon || expiryWarningShown) {
      return;
    }

    ui.addAlert({
      type: 'warning',
      message: 'Session expires in less than 5 minutes. Reauthenticate soon.',
      duration: 0,
    });
    notifications.pushNotification({
      source: 'session:expiry-warning',
      title: 'Session expiring soon',
      message: expiresAt
        ? `Current token expires at ${expiresAt}.`
        : 'Current token expires in less than 5 minutes.',
      severity: 'warning',
      requiresAck: true,
      signature: `session-expiry:${expiresAt ?? 'unknown'}`,
    });
    session.markExpiryWarningShown();
  },
  { immediate: true },
);

keyboard.useShortcut({
  id: 'shell-navigate-previous',
  key: 'arrowleft',
  label: 'Left Arrow',
  description: 'Navigate to the previous console page',
  handler: () => navigateRelative(-1),
});

keyboard.useShortcut({
  id: 'shell-navigate-next',
  key: 'arrowright',
  label: 'Right Arrow',
  description: 'Navigate to the next console page',
  handler: () => navigateRelative(1),
});

watch(
  isDesktop,
  (desktop) => {
    if (desktop) {
      drawer.value = true;
      return;
    }

    drawer.value = false;
  },
  { immediate: true },
);
</script>

<template>
  <v-app class="bx-grid-bg">
    <v-navigation-drawer
      v-model="drawer"
      mobile-breakpoint="md"
      :temporary="!isDesktop"
      width="240"
    >
      <div class="pa-4 pb-2">
        <div class="d-flex align-center ga-2 mb-1">
          <div class="bx-logo-mark">BX</div>
          <div>
            <div style="font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; color: #00e5ff">
              BREEXIO
            </div>
            <div style="font-size: 0.58rem; font-weight: 500; letter-spacing: 0.12em; color: rgba(226,232,240,0.35); text-transform: uppercase">
              Trader Console
            </div>
          </div>
        </div>
        <div class="bx-divider mt-3" />
      </div>

      <v-list density="compact" nav class="px-2">
        <v-list-subheader class="mt-1">Navigation</v-list-subheader>
        <v-list-item
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          :title="item.title"
          :active="route.path === item.to"
          rounded="lg"
        />
      </v-list>

      <template #append>
        <div class="pa-4">
          <div class="bx-divider mb-3" />
          <div class="d-flex align-center ga-2">
            <ShellSSEStatusDot />
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar flat height="56">
      <template #prepend>
        <v-btn variant="text" size="small" @click="toggleNavigation">
          ☰
        </v-btn>
      </template>

      <v-toolbar-title class="bx-toolbar-title">Operator Console</v-toolbar-title>

      <template #append>
        <div class="d-flex align-center ga-2 flex-nowrap">
          <v-chip
            v-if="isDesktop && tradingModeBadge"
            :color="tradingModeBadge.color"
            variant="tonal"
            size="small"
            label
            class="font-weight-bold bx-mode-chip"
          >
            {{ tradingModeBadge.label }}
          </v-chip>
          <ShellGlobalSearch v-if="isDesktop" />
          <ShellNotificationCenter />
          <ShellKillSwitchButton :compact="!isDesktop" />
          <div v-if="isDesktop" class="bx-clock">{{ currentTime }}</div>
          <ShellUserMenu :compact="!isDesktop" />
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <v-container class="py-6 px-6" fluid>
        <ShellConnectionBanner class="mb-5" />
        <ShellKillSwitchBanner class="mb-5" />
        <ShellKeyboardShortcuts />
        <v-alert v-if="sessionBanner" type="warning" variant="tonal" class="mb-5">
          {{ sessionBanner }}
        </v-alert>
        <slot />
      </v-container>
    </v-main>

    <SharedToast />
  </v-app>
</template>

<style scoped>
.bx-logo-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #00e5ff 0%, #7c4dff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  color: #0a0e17;
}

.bx-mode-chip {
  font-family: var(--bx-font-mono);
  letter-spacing: 0.08em;
  font-size: 0.65rem;
}

.bx-toolbar-title {
  min-width: 0;
}

.bx-clock {
  font-family: var(--bx-font-mono);
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(0, 229, 255, 0.7);
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(0, 229, 255, 0.06);
  border: 1px solid rgba(0, 229, 255, 0.1);
}
</style>
