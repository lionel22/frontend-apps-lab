<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    score: number | null;
    title?: string;
    caption?: string;
    dense?: boolean;
  }>(),
  {
    title: '',
    caption: '',
    dense: false,
  },
);

const normalizedScore = computed(() => {
  if (props.score === null || Number.isNaN(props.score)) {
    return null;
  }

  return Math.max(0, Math.min(100, props.score));
});

const tone = computed(() => {
  if (normalizedScore.value === null) {
    return 'grey';
  }
  if (normalizedScore.value >= 70) {
    return 'success';
  }
  if (normalizedScore.value >= 45) {
    return 'warning';
  }
  return 'error';
});

const label = computed(() => {
  if (normalizedScore.value === null) {
    return 'Pending';
  }
  if (normalizedScore.value >= 70) {
    return 'Go';
  }
  if (normalizedScore.value >= 45) {
    return 'Caution';
  }
  return 'No-Go';
});

const markerPosition = computed(() => {
  if (normalizedScore.value === null) {
    return '0%';
  }
  return `${normalizedScore.value}%`;
});

const valueLabel = computed(() => {
  if (normalizedScore.value === null) {
    return '--';
  }
  return `${Math.round(normalizedScore.value)}`;
});
</script>

<template>
  <div class="bx-readiness" :class="{ 'bx-readiness--dense': dense }">
    <div class="d-flex align-center justify-space-between ga-3 mb-2">
      <div v-if="title" class="bx-readiness-title">
        {{ title }}
      </div>
      <div class="d-flex align-center ga-2 ml-auto">
        <span class="bx-readiness-score">{{ valueLabel }}/100</span>
        <v-chip size="x-small" :color="tone" variant="tonal">
          {{ label }}
        </v-chip>
      </div>
    </div>

    <div class="bx-readiness-track" :class="{ 'bx-readiness-track--empty': normalizedScore === null }">
      <div
        class="bx-readiness-unused"
        :style="{ left: markerPosition }"
      />
      <div
        class="bx-readiness-marker"
        :class="`bx-readiness-marker--${tone}`"
        :style="{ left: markerPosition }"
      />
    </div>

    <div v-if="caption && !dense" class="bx-readiness-caption mt-2">
      {{ caption }}
    </div>
  </div>
</template>

<style scoped>
.bx-readiness {
  display: flex;
  flex-direction: column;
}

.bx-readiness--dense .bx-readiness-score {
  font-size: 0.74rem;
}

.bx-readiness--dense .bx-readiness-track {
  height: 10px;
}

.bx-readiness-title {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.68);
}

.bx-readiness-score {
  font-family: var(--bx-font-mono);
  font-size: 0.82rem;
  font-weight: 700;
  color: rgba(248, 250, 252, 0.92);
}

.bx-readiness-track {
  position: relative;
  height: 14px;
  border-radius: 999px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(255, 23, 68, 0.95) 0%, rgba(255, 171, 0, 0.95) 50%, rgba(0, 230, 118, 0.95) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 10px 24px rgba(8, 15, 28, 0.22);
}

.bx-readiness-track--empty {
  background: rgba(148, 163, 184, 0.18);
}

.bx-readiness-unused {
  position: absolute;
  inset: 0 0 0 auto;
  background: rgba(8, 15, 28, 0.72);
  border-left: 1px solid rgba(255, 255, 255, 0.12);
}

.bx-readiness-marker {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 5px rgba(15, 23, 42, 0.35);
}

.bx-readiness-marker--success {
  background: #00e676;
}

.bx-readiness-marker--warning {
  background: #ffb300;
}

.bx-readiness-marker--error {
  background: #ff1744;
}

.bx-readiness-marker--grey {
  background: #94a3b8;
}

.bx-readiness-caption {
  font-size: 0.78rem;
  line-height: 1.45;
  color: rgba(226, 232, 240, 0.68);
}
</style>
