<script setup lang="ts">
import type { ConfigDiffItem } from '~/utils/validators';

defineProps<{
  diff: ConfigDiffItem[];
}>();
</script>

<template>
  <v-card>
    <v-card-title>Before/After Diff</v-card-title>
    <v-card-text>
      <v-table density="compact">
        <thead>
          <tr>
            <th>Field</th>
            <th>Before</th>
            <th>After</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!diff.length">
            <td colspan="3" class="text-center py-6 text-medium-emphasis">
              No changes detected.
            </td>
          </tr>
          <tr v-for="entry in diff" :key="entry.key">
            <td class="font-weight-medium">{{ entry.key }}</td>
            <td>{{ entry.before ?? 'null' }}</td>
            <td>{{ entry.after ?? 'null' }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>