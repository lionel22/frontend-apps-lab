<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, computed, watch } from 'vue';
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts';
import type { SearchResultGroup, SearchResultItem } from '~/types/trader';
import { useTraderContracts } from '~/composables/useTraderApi';

const contracts = useTraderContracts();
const keyboard = useKeyboardShortcuts();

const query = ref('');
const loading = ref(false);
const menuOpen = ref(false);
const groups = ref<SearchResultGroup[]>([]);
const inputRef = ref<{ focus?: () => void; $el?: HTMLElement } | null>(null);
let debounceHandle: ReturnType<typeof setTimeout> | null = null;

const hasResults = computed(() => groups.value.some((group) => group.items.length));

function resolveRoute(item: SearchResultItem): string {
  switch (item.resource) {
    case 'backtest':
      return `/backtest/results-${item.id}`;
    case 'position':
      return '/positions';
    case 'holding':
      return '/holdings';
    case 'watchlist':
      return '/watchlist';
    case 'auditLog':
      return '/audit-log';
    case 'trade':
    default:
      return '/trades';
  }
}

function focusSearch() {
  menuOpen.value = true;
  void nextTick(() => {
    if (typeof inputRef.value?.focus === 'function') {
      inputRef.value.focus();
      return;
    }

    inputRef.value?.$el?.querySelector('input')?.focus();
  });
}

function clearSearch() {
  query.value = '';
  groups.value = [];
  menuOpen.value = false;
}

async function openResult(item: SearchResultItem) {
  const target = resolveRoute(item);
  clearSearch();
  await navigateTo(target);
}

async function runSearch(nextQuery: string) {
  const normalized = nextQuery.trim();

  if (normalized.length < 2) {
    groups.value = [];
    loading.value = false;
    return;
  }

  loading.value = true;
  menuOpen.value = true;

  try {
    const response = await contracts.searchGlobal(normalized, 5);
    groups.value = response.groups;
  } catch {
    groups.value = [];
  } finally {
    loading.value = false;
  }
}

keyboard.useShortcut({
  id: 'shell-global-search',
  key: 'k',
  label: 'Ctrl/Cmd + K',
  description: 'Focus global search',
  system: true,
  handler: focusSearch,
});

watch(query, (value) => {
  if (debounceHandle) {
    clearTimeout(debounceHandle);
  }

  if (!value.trim().length) {
    groups.value = [];
    menuOpen.value = false;
    return;
  }

  debounceHandle = setTimeout(() => {
    void runSearch(value);
  }, 300);
});

onBeforeUnmount(() => {
  if (debounceHandle) {
    clearTimeout(debounceHandle);
  }
});
</script>

<template>
  <div class="bx-global-search">
    <v-menu
      v-model="menuOpen"
      :close-on-content-click="false"
      location="bottom"
      offset="8"
      max-width="420"
    >
      <template #activator="{ props }">
        <v-text-field
          ref="inputRef"
          v-model="query"
          v-bind="props"
          density="compact"
          hide-details
          clearable
          placeholder="Search symbols, trades, backtests, audit…"
          prepend-inner-icon="mdi-magnify"
          class="bx-search-input"
          @focus="menuOpen = true"
        />
      </template>

      <v-card min-width="420">
        <v-progress-linear v-if="loading" indeterminate color="primary" />
        <v-card-text class="pa-0">
          <div v-if="query.trim().length < 2" class="pa-4 bx-search-empty">
            Type at least 2 characters. Press Ctrl+K or Cmd+K to focus search.
          </div>
          <div v-else-if="!hasResults && !loading" class="pa-4 bx-search-empty">
            No matches found.
          </div>
          <template v-else>
            <div
              v-for="group in groups"
              :key="group.resource"
              class="bx-search-group"
            >
              <div class="bx-search-group-label">{{ group.label }}</div>
              <v-list density="compact" class="py-0">
                <v-list-item
                  v-for="item in group.items"
                  :key="`${group.resource}-${item.id}`"
                  @click="openResult(item)"
                >
                  <template #title>
                    {{ item.title }}
                  </template>
                  <template #subtitle>
                    {{ item.subtitle }}
                  </template>
                  <template #append>
                    <v-chip v-if="item.badge" size="x-small" variant="tonal">
                      {{ item.badge }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </template>
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
</template>

<style scoped>
.bx-global-search {
  width: min(420px, 45vw);
}

.bx-search-empty {
  color: rgba(226, 232, 240, 0.7);
  font-size: 0.82rem;
}

.bx-search-group + .bx-search-group {
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.bx-search-group-label {
  padding: 10px 16px 6px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(0, 229, 255, 0.72);
}
</style>
