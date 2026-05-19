<script setup lang="ts">
import { computed } from 'vue';
import type { Position, SignalView, StatusSnapshot } from '~/types/trader';

interface GaugeCard {
  title: string;
  subtitle: string;
  score: number;
  label: string;
  tone: 'success' | 'warning' | 'error';
  reasons: string[];
}

const props = defineProps<{
  status: StatusSnapshot | null;
  signals: SignalView[];
  positions: Position[];
  backtestCount: number;
}>();

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveTone(score: number): GaugeCard['tone'] {
  if (score >= 70) {
    return 'success';
  }
  if (score >= 45) {
    return 'warning';
  }
  return 'error';
}

const totalPortfolioRisk = computed(() =>
  props.positions.reduce((accumulator, position) => accumulator + position.riskPct, 0),
);

const actionableSignals = computed(() =>
  props.signals.filter(
    (signal) =>
      signal.missingRequiredSignals.length === 0 &&
      signal.staleSignals.length === 0,
  ),
);

const bestEntrySignal = computed(() => {
  return actionableSignals.value
    .filter((signal) => signal.compositeScore > 0)
    .sort(
      (left, right) =>
        right.compositeScore * right.confidence -
        left.compositeScore * left.confidence,
    )[0] ?? null;
});

const heldSignalViews = computed(() => {
  return props.positions
    .map((position) => ({
      position,
      signal:
        props.signals.find(
          (signal) =>
            signal.symbol === position.symbol && signal.timeframe === '4h',
        ) ?? props.signals.find((signal) => signal.symbol === position.symbol),
    }))
    .filter((entry) => entry.signal);
});

const averageHeldPnl = computed(() => {
  if (props.positions.length === 0) {
    return 0;
  }

  return (
    props.positions.reduce(
      (accumulator, position) => accumulator + position.unrealizedPnl,
      0,
    ) / props.positions.length
  );
});

const gauges = computed<GaugeCard[]>(() => {
  const status = props.status;
  const positioningReasons: string[] = [];
  let positioningScore = 15;

  if (status?.killSwitchActive) {
    positioningReasons.push('Kill-switch active: new exposure should stay blocked.');
    positioningScore -= 35;
  } else {
    positioningReasons.push('Kill-switch clear: desk can still deploy risk deliberately.');
    positioningScore += 15;
  }

  if (status?.capabilities.goLiveEligible) {
    positioningReasons.push('Go-live gate is green, so the platform baseline is intact.');
    positioningScore += 30;
  } else {
    positioningReasons.push('Go-live gate is not fully green yet.');
    positioningScore -= 10;
  }

  if (status?.capabilities.hasValidBacktests) {
    positioningScore += 20;
  } else {
    positioningReasons.push('Validated backtests are still missing for this desk state.');
  }

  if (status?.capabilities.hasPaperTradingEvidence) {
    positioningScore += 10;
  } else {
    positioningReasons.push('Paper-trading evidence is still thin.');
  }

  positioningScore += Math.min((status?.watchlistSize ?? 0) * 2, 15);
  positioningScore -= Math.min(totalPortfolioRisk.value, 35);

  const finalPositioningScore = clampScore(positioningScore);

  const entryReasons: string[] = [];
  let entryScore = 10;
  if (status?.killSwitchActive) {
    entryReasons.push('Kill-switch active: entry execution is a hard no-go.');
    entryScore = 0;
  } else if (bestEntrySignal.value) {
    entryScore = clampScore(
      ((bestEntrySignal.value.compositeScore + 1) / 2) * 65 +
        bestEntrySignal.value.confidence * 35,
    );
    entryReasons.push(
      `Best clean setup: ${bestEntrySignal.value.symbol} (${bestEntrySignal.value.compositeScore.toFixed(2)} score, ${bestEntrySignal.value.confidence.toFixed(2)} confidence).`,
    );
  } else {
    entryReasons.push('No clean long-biased signal is currently standing out.');
  }

  if (props.signals.some((signal) => signal.staleSignals.length > 0)) {
    entryScore = clampScore(entryScore - 10);
    entryReasons.push('Some incoming signal stacks are stale and need fresh confirmation.');
  }

  if (props.signals.some((signal) => signal.missingRequiredSignals.length > 0)) {
    entryScore = clampScore(entryScore - 10);
    entryReasons.push('Several symbols still miss required signal inputs.');
  }

  const negativeHeldSignals = heldSignalViews.value.filter(
    (entry) => (entry.signal?.compositeScore ?? 0) < 0,
  ).length;
  const exitReasons: string[] = [];
  let exitScore = props.positions.length === 0 ? 10 : 20;

  if (props.positions.length === 0) {
    exitReasons.push('Flat book: no active position needs an exit decision right now.');
  } else {
    exitScore += Math.min(totalPortfolioRisk.value, 45);
    exitScore += Math.round(
      (negativeHeldSignals / Math.max(props.positions.length, 1)) * 30,
    );

    if (averageHeldPnl.value < 0) {
      exitScore += 15;
      exitReasons.push('Average unrealized PnL is slipping below zero.');
    }

    if (negativeHeldSignals > 0) {
      exitReasons.push(
        `${negativeHeldSignals} held position(s) now lean against the latest signal stack.`,
      );
    }

    if (status?.killSwitchActive) {
      exitScore += 20;
      exitReasons.push('Kill-switch pressure makes de-risking the book more urgent.');
    }
  }

  const finalExitScore = clampScore(exitScore);

  return [
    {
      title: 'Positioning Window',
      subtitle: 'Can the desk safely add fresh exposure?',
      score: finalPositioningScore,
      label:
        finalPositioningScore >= 70
          ? 'Go'
          : finalPositioningScore >= 45
            ? 'Caution'
            : 'No-Go',
      tone: resolveTone(finalPositioningScore),
      reasons: positioningReasons.slice(0, 3),
    },
    {
      title: 'Entry Window',
      subtitle: 'Are current setups clean enough to press entries?',
      score: entryScore,
      label:
        entryScore >= 70 ? 'Go' : entryScore >= 45 ? 'Caution' : 'No-Go',
      tone: resolveTone(entryScore),
      reasons: entryReasons.slice(0, 3),
    },
    {
      title: 'Exit Window',
      subtitle: 'Is it time to trim or close open risk?',
      score: finalExitScore,
      label:
        props.positions.length === 0
          ? 'Flat Book'
          : finalExitScore >= 70
            ? 'Go'
            : finalExitScore >= 45
              ? 'Monitor'
              : 'Hold',
      tone: resolveTone(finalExitScore),
      reasons: exitReasons.slice(0, 3),
    },
  ];
});
</script>

<template>
  <v-row>
    <v-col
      v-for="gauge in gauges"
      :key="gauge.title"
      cols="12"
      md="4"
    >
      <v-card
        class="bx-gauge-card"
        :class="`bx-glow-${gauge.tone}`"
      >
        <v-card-text class="pa-4 d-flex flex-column ga-4">
          <div class="d-flex align-start justify-space-between ga-3">
            <div>
              <div class="bx-metric-label mb-2">
                {{ gauge.title }}
              </div>
              <div class="bx-gauge-subtitle">
                {{ gauge.subtitle }}
              </div>
            </div>
            <v-chip
              :color="gauge.tone"
              variant="tonal"
              size="small"
            >
              {{ gauge.label }}
            </v-chip>
          </div>

          <div>
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="bx-metric-label">Readiness Score</span>
              <span class="bx-gauge-score">{{ gauge.score }}/100</span>
            </div>
            <v-progress-linear
              :model-value="gauge.score"
              :color="gauge.tone"
              bg-color="rgba(255,255,255,0.08)"
              height="14"
              rounded
            />
          </div>

          <div class="d-flex flex-column ga-2">
            <div
              v-for="reason in gauge.reasons"
              :key="reason"
              class="bx-gauge-reason"
            >
              {{ reason }}
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.bx-gauge-card {
  position: relative;
  overflow: hidden;
  min-height: 100%;
}

.bx-gauge-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(0, 229, 255, 0.08), transparent 40%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(10, 14, 23, 0));
  pointer-events: none;
}

.bx-gauge-subtitle {
  color: rgba(226, 232, 240, 0.6);
  font-size: 0.82rem;
  line-height: 1.4;
}

.bx-gauge-score {
  font-family: var(--bx-font-mono);
  font-size: 0.88rem;
  font-weight: 700;
  color: rgba(226, 232, 240, 0.88);
}

.bx-gauge-reason {
  font-size: 0.8rem;
  line-height: 1.45;
  color: rgba(226, 232, 240, 0.78);
  padding-left: 12px;
  position: relative;
}

.bx-gauge-reason::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(0, 229, 255, 0.8);
}
</style>
