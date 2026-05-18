<script setup lang="ts">
import { computed, reactive } from 'vue';
import type { AuditLogFilters, AuditLogResponse } from '~/types/trader';
import { formatDateTime } from '~/utils/formatters';
import { AUDIT_SEVERITY_OPTIONS } from '~/utils/domain';
import {
  toUtcEndOfDayIso,
  toUtcStartOfDayIso,
} from '~/utils/date-boundaries';

const props = defineProps<{
  response: AuditLogResponse;
  loading?: boolean;
}>();

const emit = defineEmits<{
  filter: [payload: AuditLogFilters];
  'page-change': [offset: number, limit: number];
}>();

const filters = reactive({
  actor: '',
  type: '',
  severity: undefined as AuditLogFilters['severity'],
  fromDate: '',
  toDate: '',
});
const localError = computed(() => {
  if (!filters.fromDate || !filters.toDate) {
    return '';
  }

  return filters.fromDate > filters.toDate
    ? 'From date must be before or equal to To date.'
    : '';
});

const typeOptions = computed(() => {
  const set = new Set(props.response.items.map((entry) => entry.type));
  return Array.from(set).sort();
});

function applyFilters() {
  if (localError.value) {
    return;
  }

  emit('filter', {
    actor: filters.actor || undefined,
    type: filters.type || undefined,
    severity: filters.severity,
    from: filters.fromDate ? toUtcStartOfDayIso(filters.fromDate) : undefined,
    to: filters.toDate ? toUtcEndOfDayIso(filters.toDate) : undefined,
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
            clearable
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-combobox
            v-model="filters.type"
            :items="typeOptions"
            label="Event Type"
            density="compact"
            variant="outlined"
            clearable
            hint="Pick a known event type or type one manually."
            persistent-hint
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.severity"
            :items="AUDIT_SEVERITY_OPTIONS"
            label="Severity"
            density="compact"
            variant="outlined"
            item-title="title"
            item-value="value"
            clearable
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.fromDate"
            label="From"
            type="date"
            density="compact"
            variant="outlined"
            clearable
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.toDate"
            label="To"
            type="date"
            density="compact"
            variant="outlined"
            clearable
          />
        </v-col>
        <v-col cols="12" md="2" class="d-flex align-center">
          <v-btn color="primary" variant="tonal" @click="applyFilters">Apply Filters</v-btn>
        </v-col>
      </v-row>

      <v-alert v-if="localError" type="warning" variant="tonal" class="mb-4">
        {{ localError }}
      </v-alert>

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
              <v-chip
                size="small"
                variant="tonal"
                :color="entry.severity === 'CRITICAL' ? 'error' : entry.severity === 'WARNING' ? 'warning' : 'info'"
              >
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
