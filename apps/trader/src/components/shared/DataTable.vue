<script setup lang="ts" generic="T extends Record<string, unknown>">
export interface DataTableHeader {
  key: string;
  title: string;
  align?: 'start' | 'center' | 'end';
}

withDefaults(
  defineProps<{
    headers: DataTableHeader[];
    items: T[];
    emptyMessage?: string;
  }>(),
  {
    emptyMessage: 'No records available.',
  },
);
</script>

<template>
  <v-table density="comfortable" fixed-header hover>
    <thead>
      <tr>
        <th
          v-for="header in headers"
          :key="header.key"
          :class="`text-${header.align || 'start'}`"
        >
          {{ header.title }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="!items.length">
        <td :colspan="headers.length" class="text-center text-medium-emphasis py-6">
          {{ emptyMessage }}
        </td>
      </tr>
      <tr
        v-for="(item, index) in items"
        v-else
        :key="String(item.id ?? item.symbol ?? index)"
      >
        <slot name="row" :item="item" :index="index">
          <td v-for="header in headers" :key="header.key">
            {{ item[header.key] }}
          </td>
        </slot>
      </tr>
    </tbody>
  </v-table>
</template>