<script setup lang="ts">
import { reactive } from 'vue';
import type { AuditLogResponse } from '~/types/trader';
import { formatDateTime } from '~/utils/formatters';

const props = defineProps<{
  response: AuditLogResponse;
  loading?: boolean;
}>();

const emit = defineEmits<{
  filter: [payload: { actor?: string; type?: string }];
  'page-change': [offset: number, limit: number];
}>();

const filters = reactive({
  actor: '',
  type: '',
});

function applyFilters() {
  emit('filter', {
    actor: filters.actor || undefined,
    type: filters.type || undefined,
  });
}

function prevPage() {
  const nextOffset = Math.max(props.response.offset - props.response.limit, 0);
  emit('page-change', nextOffset, props.response.limit);
}

function nextPage() {
  const nextOffset = props.response.offset + props.response.limit;
  if (nextOffset >= props.response.total) {
    return;
  }
  emit('page-change', nextOffset, props.response.limit);
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Audit Log</span>
      <div class="d-flex ga-2">
        <v-btn size="small" variant="text" :disabled="response.offset === 0" @click="prevPage">
          Previous
        </v-btn>
        <v-btn
          size="small"
          variant="text"
          :disabled="response.offset + response.limit >= response.total"
          @click="nextPage"
        >
          Next
        </v-btn>
      </div>
    </v-card-title>
    <v-card-text>
      <v-row class="mb-2">
        <v-col cols="12" md="4">
          <v-text-field
            v-model="filters.actor"
            label="Actor"
            density="compact"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="filters.type"
            label="Event Type"
            density="compact"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="4" class="d-flex align-center">
          <v-btn color="primary" variant="tonal" @click="applyFilters">Apply Filters</v-btn>
        </v-col>
      </v-row>

      <SharedLoadingSpinner v-if="loading" inline label="Refreshing audit entries..." />

      <v-table v-else density="comfortable" hover>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Type</th>
            <th>Severity</th>
            <th>Actor</th>
            <th>Reason</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!response.items.length">
            <td colspan="6" class="text-center py-8 text-medium-emphasis">
              No audit entries for this view.
            </td>
          </tr>
          <tr v-for="entry in response.items" :key="entry.id">
            <td>{{ formatDateTime(entry.timestamp) }}</td>
            <td>{{ entry.type }}</td>
            <td>
              <v-chip size="small" variant="tonal" :color="entry.severity === 'ERROR' ? 'error' : 'info'">
                {{ entry.severity }}
              </v-chip>
            </td>
            <td>{{ entry.actor || 'n/a' }}</td>
            <td>{{ entry.reason || 'n/a' }}</td>
            <td>{{ entry.message }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>