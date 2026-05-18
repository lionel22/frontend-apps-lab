<script setup lang="ts">
import { computed, ref } from 'vue';
import { NAV_ITEMS } from '~/utils/constants';
import { useSession } from '~/composables/useSession';
import { useUiStore } from '~/stores/ui';

const drawer = ref(true);
const route = useRoute();
const session = useSession();
const ui = useUiStore();

const actorInput = computed({
  get: () => session.actor.value,
  set: (value: string) => session.setActor(value),
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

function clearAlerts() {
  ui.clearAlerts();
}

async function openLogin() {
  await navigateTo('/login');
}

async function logout() {
  session.setToken(null);
  await navigateTo('/login');
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
</script>

<template>
  <v-app class="bx-grid-bg">
    <v-navigation-drawer v-model="drawer" :rail="false" width="240">
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
            <span class="bx-status-dot bx-status-dot--live" />
            <span style="font-size: 0.7rem; color: rgba(226,232,240,0.5); font-weight: 500">System Online</span>
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar flat height="56">
      <template #prepend>
        <v-btn variant="text" size="small" @click="drawer = !drawer">
          ☰
        </v-btn>
      </template>

      <v-toolbar-title>Operator Console</v-toolbar-title>

      <template #append>
        <div class="d-flex align-center ga-3">
          <div class="bx-clock">{{ currentTime }}</div>
          <v-text-field
            v-model="actorInput"
            label="Actor ID"
            hide-details
            style="width: 200px"
          />
          <v-btn
            v-if="session.requireAuth.value || session.token.value"
            variant="text"
            size="small"
            @click="session.isAuthenticated.value ? logout() : openLogin()"
          >
            {{ session.isAuthenticated.value ? 'Logout' : 'Login' }}
          </v-btn>
          <v-btn
            v-if="ui.alerts.length"
            variant="tonal"
            color="warning"
            size="small"
            @click="clearAlerts"
          >
            {{ ui.alerts.length }} Alert{{ ui.alerts.length > 1 ? 's' : '' }}
          </v-btn>
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <v-container class="py-6 px-6" fluid>
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
