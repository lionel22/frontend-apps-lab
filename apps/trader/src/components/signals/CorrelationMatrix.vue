<script setup lang="ts">
import type { SignalCorrelationSummaryItem } from '~/types/trader';

defineProps<{
  rows: SignalCorrelationSummaryItem[];
}>();

function rowColor(correlation: number) {
  if (correlation >= 0.6) {
    return 'success';
  }
  if (correlation >= 0.3) {
    return 'warning';
  }
  return 'error';
}
</script>

<template>
  <v-card>
    <v-card-title>Signal Correlation Matrix</v-card-title>
    <v-card-text>
      <v-table density="comfortable" hover>
        <thead>
          <tr>
            <th>Signal</th>
            <th>Correlation</th>
            <th>Variance</th>
            <th>Trend</th>
            <th>Samples</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="5" class="text-center py-8 text-medium-emphasis">
              No correlation summary rows returned.
            </td>
          </tr>
          <tr v-for="row in rows" :key="row.signal">
            <td class="font-weight-medium">{{ row.signal }}</td>
            <td>
              <v-chip
                :color="rowColor(row.correlation)"
                size="small"
                variant="tonal"
              >
                {{ row.correlation.toFixed(2) }}
              </v-chip>
            </td>
            <td>{{ row.variance.toFixed(2) }}</td>
            <td>{{ row.trend }}</td>
            <td>
              {{ row.sampleSize }}
              <v-chip
                v-if="row.degraded"
                color="error"
                variant="outlined"
                size="x-small"
                class="ml-2"
              >
                degraded
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>