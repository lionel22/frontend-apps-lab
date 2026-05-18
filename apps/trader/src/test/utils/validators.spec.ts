import {
  validateBacktestLaunch,
  validateControlAction,
  validateWeightProfileUpdate,
} from '~/utils/validators';

describe('validators', () => {
  it('rejects backtest payloads without symbols', () => {
    const errors = validateBacktestLaunch({
      symbols: [],
      timeframe: '4h',
      marketScope: 'spot',
    });

    expect(errors.symbols).toBeTruthy();
  });

  it('requires actor and reason for control actions', () => {
    const errors = validateControlAction('', '');
    expect(errors.actor).toBeTruthy();
    expect(errors.reason).toBeTruthy();
  });

  it('enforces sum-to-one for weight updates', () => {
    const errors = validateWeightProfileUpdate({
      actor: 'operator-ui',
      reason: 'test',
      weights: {
        a: 0.4,
        b: 0.4,
      },
      thresholds: {
        trigger: 0.6,
      },
    });

    expect(errors.weights).toContain('Sum of all weights must equal 1.0.');
  });
});
