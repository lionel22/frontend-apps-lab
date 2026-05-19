<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatDateTime } from '~/utils/formatters';
import { useNotifications } from '~/composables/useNotifications';

const notifications = useNotifications();
const menuOpen = ref(false);

const recentItems = computed(() => notifications.items.value.slice(0, 12));
</script>

<template>
  <v-menu
    v-model="menuOpen"
    class="bx-menu-root"
    attach="body"
    location="bottom"
    offset="8"
    :close-on-content-click="false"
  >
    <template #activator="{ props }">
      <v-badge
        :content="notifications.unreadCount.value"
        :model-value="notifications.unreadCount.value > 0"
        color="error"
      >
        <v-btn v-bind="props" icon="mdi-bell-outline" variant="text" size="small" />
      </v-badge>
    </template>

    <v-card min-width="420">
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Notification Center</span>
        <v-btn variant="text" size="small" @click="notifications.acknowledgeAll">
          Acknowledge all
        </v-btn>
      </v-card-title>
      <v-card-text class="pa-0">
        <div v-if="!recentItems.length" class="pa-4" style="color: rgba(226,232,240,0.7)">
          No recent operational events.
        </div>

        <v-list v-else density="comfortable">
          <v-list-item
            v-for="item in recentItems"
            :key="item.id"
            :subtitle="item.message"
          >
            <template #title>
              <div class="d-flex align-center justify-space-between ga-3">
                <span>{{ item.title }}</span>
                <v-chip size="x-small" variant="tonal" :color="item.severity">
                  {{ item.severity.toUpperCase() }}
                </v-chip>
              </div>
            </template>

            <template #append>
              <div class="d-flex flex-column align-end ga-2">
                <span style="font-size: 0.72rem; color: rgba(226,232,240,0.6)">
                  {{ formatDateTime(item.createdAt) }}
                </span>
                <v-btn
                  v-if="!item.acknowledgedAt"
                  size="x-small"
                  variant="text"
                  @click="notifications.acknowledge(item.id)"
                >
                  Acknowledge
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<style scoped>
.bx-menu-root {
  display: contents;
}
</style>
