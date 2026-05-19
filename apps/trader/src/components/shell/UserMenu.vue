<script setup lang="ts">
import { computed } from 'vue';
import { useSession } from '~/composables/useSession';
import { formatDateTime } from '~/utils/formatters';

const session = useSession();

const actorInput = computed({
  get: () => session.actor.value,
  set: (value: string) => session.setActor(value),
});

const roleLabel = computed(() => session.role.value.toUpperCase());
const lastLoginLabel = computed(() => {
  if (!session.lastLoginAt.value) {
    return 'Unknown';
  }

  return formatDateTime(session.lastLoginAt.value);
});

const expiryLabel = computed(() => {
  if (!session.expiresAt.value) {
    return 'No expiry metadata';
  }

  return formatDateTime(session.expiresAt.value);
});

const identityInitials = computed(() => session.actor.value.slice(0, 2).toUpperCase());

async function openLogin() {
  await navigateTo('/login');
}

async function logout() {
  session.setToken(null);
  await navigateTo('/login');
}
</script>

<template>
  <v-menu location="bottom" offset="8">
    <template #activator="{ props }">
      <v-btn v-bind="props" variant="text" class="px-2">
        <v-avatar size="28" color="primary" class="mr-2">
          <span style="font-size: 0.72rem; font-weight: 700">{{ identityInitials }}</span>
        </v-avatar>
        <div class="d-flex flex-column align-start text-left">
          <span style="font-size: 0.8rem; font-weight: 600">{{ session.actor.value }}</span>
          <span style="font-size: 0.68rem; color: rgba(226,232,240,0.6)">
            Last login {{ lastLoginLabel }}
          </span>
        </div>
      </v-btn>
    </template>

    <v-card min-width="320">
      <v-card-text>
        <div class="d-flex align-center justify-space-between ga-3 mb-3">
          <div>
            <div class="font-weight-bold">{{ session.actor.value }}</div>
            <div style="font-size: 0.78rem; color: rgba(226,232,240,0.68)">
              Last login {{ lastLoginLabel }}
            </div>
            <div style="font-size: 0.78rem; color: rgba(226,232,240,0.68)">
              Session expiry {{ expiryLabel }}
            </div>
          </div>
          <v-chip size="small" variant="tonal" color="primary">{{ roleLabel }}</v-chip>
        </div>

        <v-text-field
          v-model="actorInput"
          label="Actor ID"
          density="compact"
          hide-details
          class="mb-3"
        />

        <div class="d-flex justify-end ga-2">
          <v-btn
            v-if="session.requireAuth.value || session.token.value"
            variant="tonal"
            size="small"
            @click="session.isAuthenticated.value ? logout() : openLogin()"
          >
            {{ session.isAuthenticated.value ? 'Logout' : 'Login' }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>
