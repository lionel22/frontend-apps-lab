import type {
  BacktestLaunchPayload,
  WeightProfile,
  WeightProfileUpdatePayload,
} from '~/types/trader';

export type FormErrors = Record<string, string>;

export interface ConfigDiffItem {
  key: string;
  before: number | string | null;
  after: number | string | null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function validateBacktestLaunch(
  payload: BacktestLaunchPayload,
): FormErrors {
  const errors: FormErrors = {};

  if (!payload.symbols.length) {
    errors.symbols = 'At least one symbol is required.';
  }

  if (payload.days !== undefined && payload.days < 1) {
    errors.days = 'Days must be greater than or equal to 1.';
  }

  if (
    payload.timeframe !== undefined &&
    !['4h', '1d'].includes(payload.timeframe)
  ) {
    errors.timeframe = 'Timeframe must be 4h or 1d.';
  }

  if (payload.marketScope !== undefined && payload.marketScope !== 'spot') {
    errors.marketScope = 'Market scope must be spot.';
  }

  if (payload.startDate && Number.isNaN(Date.parse(payload.startDate))) {
    errors.startDate = 'Start date must be a valid ISO date.';
  }

  if (payload.endDate && Number.isNaN(Date.parse(payload.endDate))) {
    errors.endDate = 'End date must be a valid ISO date.';
  }

  if (
    payload.startDate &&
    payload.endDate &&
    !Number.isNaN(Date.parse(payload.startDate)) &&
    !Number.isNaN(Date.parse(payload.endDate)) &&
    Date.parse(payload.startDate) > Date.parse(payload.endDate)
  ) {
    errors.dateRange = 'Start date must be before end date.';
  }

  return errors;
}

export function validateControlAction(
  actor: string,
  reason: string,
): FormErrors {
  const errors: FormErrors = {};

  if (!actor.trim()) {
    errors.actor = 'Actor is required.';
  } else if (actor.length > 80) {
    errors.actor = 'Actor must be at most 80 characters.';
  }

  if (!reason.trim()) {
    errors.reason = 'Reason is required.';
  } else if (reason.length > 120) {
    errors.reason = 'Reason must be at most 120 characters.';
  }

  return errors;
}

export function validateWeightProfileUpdate(
  payload: WeightProfileUpdatePayload,
): FormErrors {
  const errors: FormErrors = validateControlAction(
    payload.actor,
    payload.reason ?? 'provided',
  );

  const weightEntries = Object.entries(payload.weights);
  if (!weightEntries.length) {
    errors.weights = 'At least one weight is required.';
  }

  let weightTotal = 0;
  for (const [key, value] of weightEntries) {
    if (!isFiniteNumber(value)) {
      errors[`weights.${key}`] = 'Weight must be numeric.';
      continue;
    }
    if (value < 0 || value > 1) {
      errors[`weights.${key}`] = 'Weight must be between 0 and 1.';
    }
    weightTotal += value;
  }

  if (Math.abs(weightTotal - 1) > 0.0001) {
    errors.weights = 'Sum of all weights must equal 1.0.';
  }

  for (const [key, value] of Object.entries(payload.thresholds)) {
    if (!isFiniteNumber(value)) {
      errors[`thresholds.${key}`] = 'Threshold must be numeric.';
    }
  }

  if (payload.reason && payload.reason.length > 256) {
    errors.reason = 'Reason must be at most 256 characters.';
  }

  return errors;
}

export function buildConfigDiff(
  before: WeightProfile | null,
  after: WeightProfileUpdatePayload,
): ConfigDiffItem[] {
  const diff: ConfigDiffItem[] = [];
  const beforeWeights = before?.weights ?? {};
  const beforeThresholds = before?.thresholds ?? {};

  const weightKeys = new Set([
    ...Object.keys(beforeWeights),
    ...Object.keys(after.weights),
  ]);
  for (const key of weightKeys) {
    const prev = beforeWeights[key] ?? null;
    const next = after.weights[key] ?? null;
    if (prev !== next) {
      diff.push({ key: `weights.${key}`, before: prev, after: next });
    }
  }

  const thresholdKeys = new Set([
    ...Object.keys(beforeThresholds),
    ...Object.keys(after.thresholds),
  ]);
  for (const key of thresholdKeys) {
    const prev = beforeThresholds[key] ?? null;
    const next = after.thresholds[key] ?? null;
    if (prev !== next) {
      diff.push({ key: `thresholds.${key}`, before: prev, after: next });
    }
  }

  return diff;
}
