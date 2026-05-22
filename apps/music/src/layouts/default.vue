<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useNotifications } from '~/composables/useNotifications';
import { useSession } from '~/composables/useSession';
import { MUSIC_NAV_ITEMS } from '~/utils/constants';
import { formatDateTime } from '~/utils/formatters';

const drawer = ref(true);
const route = useRoute();
const display = useDisplay();
const session = useSession();
const notifications = useNotifications();
const sessionExpiredDialog = ref(false);

const isDesktop = computed(() => display.mdAndUp.value);
const authEnabled = computed(() => session.requireAuth.value);
const sessionBanner = computed(() => {
  if (!session.requireAuth.value) {
    return '';
  }

  if (session.expired.value) {
    return 'Shared operator token expired or was rejected. Re-enter it before protected music actions continue.';
  }

  if (!session.isAuthenticated.value) {
    return 'This environment requires the shared operator bearer token before music API calls can run.';
  }

  return '';
});
const sessionLabel = computed(() => {
  if (!session.requireAuth.value) {
    return 'Open shell';
  }

  if (session.isAuthenticated.value) {
    return `Token active${session.lastAuthenticatedAt.value ? ` • ${formatDateTime(session.lastAuthenticatedAt.value)}` : ''}`;
  }

  return 'Token required';
});
const currentTime = ref('');

let clockTimer: ReturnType<typeof setInterval> | null = null;

function syncClock() {
  currentTime.value = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toggleNavigation() {
  drawer.value = !drawer.value;
}

async function openLogin() {
  await navigateTo({
    path: '/login',
    query: { redirect: route.fullPath },
  });
}

async function toggleSession() {
  if (session.isAuthenticated.value) {
    session.clearSession();
    await openLogin();
    return;
  }

  await openLogin();
}

async function openSessionRefresh() {
  sessionExpiredDialog.value = false;
  await openLogin();
}

async function resetTokenFromDialog() {
  session.clearSession();
  sessionExpiredDialog.value = false;
  await openLogin();
}

watch(
  isDesktop,
  (desktop) => {
    drawer.value = desktop;
  },
  { immediate: true },
);

watch(
  () => route.path,
  () => {
    if (!isDesktop.value) {
      drawer.value = false;
    }
  },
);

watch(
  [
    () => session.requireAuth.value,
    () => session.isAuthenticated.value,
    () => session.expired.value,
    () => route.fullPath,
  ],
  ([requireAuth, isAuthenticated, expired, fullPath]) => {
    if (import.meta.server || !requireAuth || route.path === '/login') {
      sessionExpiredDialog.value = false;
      return;
    }

    if (expired) {
      sessionExpiredDialog.value = true;
      return;
    }

    if (isAuthenticated) {
      return;
    }

    const redirect = typeof fullPath === 'string' && fullPath.startsWith('/')
      ? fullPath
      : '/';

    void navigateTo({
      path: '/login',
      query: { redirect },
    });
  },
);

watch(
  () => route.path,
  (path) => {
    if (path === '/login') {
      sessionExpiredDialog.value = false;
    }
  },
);

onMounted(() => {
  syncClock();
  clockTimer = setInterval(syncClock, 1000);
});

onUnmounted(() => {
  if (clockTimer) {
    clearInterval(clockTimer);
  }
});
</script>

<template>
  <v-app class="music-grid">
    <v-navigation-drawer
      v-model="drawer"
      :temporary="!isDesktop"
      width="244"
    >
      <div class="pa-4 pb-2">
        <div class="d-flex align-center ga-3 mb-3">
          <div class="music-logo">
            MC
          </div>
          <div>
            <div class="music-kicker">
              Navidrome Flow
            </div>
            <div class="text-h6 font-weight-bold">
              Music Control Center
            </div>
          </div>
        </div>
        <div class="music-copy-muted text-body-2">
          Polling-first operator shell for ingestion, discovery, and organization.
        </div>
      </div>

      <v-divider class="mx-4 my-3" />

      <v-list
        density="compact"
        nav
        class="px-2"
      >
        <v-list-subheader>Navigation</v-list-subheader>
        <v-list-item
          v-for="item in MUSIC_NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          :title="item.title"
          :active="route.path === item.to"
          rounded="lg"
        />
      </v-list>

      <template #append>
        <div class="pa-4 pt-0">
          <v-divider class="mb-3" />
          <v-chip
            class="music-shell-chip"
            color="secondary"
            variant="tonal"
            size="small"
          >
            Polling MVP
          </v-chip>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar
      flat
      height="60"
    >
      <template #prepend>
        <v-btn
          variant="text"
          size="small"
          @click="toggleNavigation"
        >
          ☰
        </v-btn>
      </template>

      <v-toolbar-title>Music Library Control Center</v-toolbar-title>

      <template #append>
        <div class="d-flex align-center ga-2 pr-4">
          <v-chip
            class="music-shell-chip"
            :color="authEnabled ? 'warning' : 'success'"
            variant="tonal"
            size="small"
          >
            {{ sessionLabel }}
          </v-chip>
          <v-chip
            class="music-shell-chip"
            color="primary"
            variant="tonal"
            size="small"
          >
            {{ notifications.unreadCount.value }} notifications
          </v-chip>
          <v-btn
            variant="text"
            size="small"
            @click="toggleSession"
          >
            {{ session.isAuthenticated.value ? 'Reset token' : 'Sign in' }}
          </v-btn>
          <div class="music-mono text-caption">
            {{ currentTime }}
          </div>
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <v-container
        class="py-6 px-6"
        fluid
      >
        <v-alert
          v-if="sessionBanner"
          type="warning"
          variant="tonal"
          class="mb-5"
        >
          {{ sessionBanner }}
        </v-alert>
        <slot />
      </v-container>
    </v-main>

    <v-dialog
      v-model="sessionExpiredDialog"
      persistent
      max-width="560"
    >
      <v-card>
        <v-card-title class="text-h6">Shared token expired</v-card-title>
        <v-card-text>
          <p class="text-body-1 mb-4">
            The shared operator token expired or was rejected. Refresh it before protected music API actions continue.
          </p>
          <v-alert type="warning" variant="tonal" class="mb-4">
            Background requests will remain unauthorized until you save a fresh bearer token.
          </v-alert>
          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" @click="resetTokenFromDialog">
              Reset token
            </v-btn>
            <v-btn color="primary" variant="flat" @click="openSessionRefresh">
              Refresh token
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <SharedToast />
  </v-app>
</template>

<style scoped>
.music-logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #08111a;
  font-family: var(--music-mono);
  font-weight: 700;
  letter-spacing: 0.08em;
  background: linear-gradient(135deg, #61dafb 0%, #ffc857 100%);
}
</style>
