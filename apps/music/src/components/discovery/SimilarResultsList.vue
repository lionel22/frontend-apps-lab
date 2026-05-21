<script setup lang="ts">
import SimilarResultCard from '~/components/discovery/SimilarResultCard.vue';
import { useSelection } from '~/composables/useSelection';
import type { SimilarResultViewModel } from '~/types/music';

defineProps<{
  results: SimilarResultViewModel[];
}>();

const selection = useSelection();
</script>

<template>
  <v-row>
    <v-col
      v-for="result in results"
      :key="selection.buildKey(result.reference)"
      cols="12"
      md="6"
      xl="4"
    >
      <SimilarResultCard
        :result="result"
        :selected="selection.isSelected(result.reference)"
        @toggle="selection.toggle(result.reference)"
      />
    </v-col>
  </v-row>
</template>
