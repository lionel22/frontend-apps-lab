import { shallowMount, type MountingOptions } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import StatusCards from '~/components/dashboard/StatusCards.vue';
import WatchlistTable from '~/components/watchlist/WatchlistTable.vue';
import SignalDetail from '~/components/signals/SignalDetail.vue';
import CorrelationMatrix from '~/components/signals/CorrelationMatrix.vue';
import PositionsTable from '~/components/positions/PositionsTable.vue';
import TradesTable from '~/components/trades/TradesTable.vue';
import ConfigForm from '~/components/config/ConfigForm.vue';

const PassThrough = {
  template: '<div><slot /></div>',
};

const ButtonStub = {
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
  template:
    '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
};

const TextFieldStub = {
  props: {
    modelValue: {
      type: [String, Number],
      default: '',
    },
  },
  emits: ['update:modelValue'],
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};

const globalStubs = {
  VRow: PassThrough,
  VCol: PassThrough,
  VCard: PassThrough,
  VCardTitle: PassThrough,
  VCardSubtitle: PassThrough,
  VCardText: PassThrough,
  VCardActions: PassThrough,
  VTable: PassThrough,
  VChip: PassThrough,
  VBtn: ButtonStub,
  VTextField: TextFieldStub,
  VDivider: PassThrough,
  VSpacer: PassThrough,
  VAlert: PassThrough,
  SharedLoadingSpinner: PassThrough,
  TradesTradeExpander: PassThrough,
  SignalsSignalStalenessIndicator: PassThrough,
  SignalsSignalContributionChart: PassThrough,
  ConfigDiffViewer: PassThrough,
};

function mountWithStubs<T>(
  component: T,
  options: MountingOptions<unknown> = {},
) {
  return shallowMount(component as never, {
    ...options,
    global: {
      stubs: globalStubs,
      ...(options.global ?? {}),
    },
  });
}

describe('component slices', () => {
  it('renders dashboard status cards', () => {
    const wrapper = mountWithStubs(StatusCards, {
      props: {
        status: {
          marketScope: 'spot',
          tradingMode: 'paper',
          capabilities: {
            hasValidBacktests: true,
            hasPaperTradingEvidence: true,
            goLiveEligible: false,
          },
          watchlistSize: 12,
          holdingsCount: 2,
          killSwitchActive: false,
          timestamp: '2026-05-17T12:00:00.000Z',
        },
      },
    });

    expect(wrapper.text()).toContain('Trading Mode');
    expect(wrapper.text()).toContain('PAPER');
    expect(wrapper.text()).toContain('Watchlist Size');
    expect(wrapper.text()).toContain('12');
  });

  it('renders watchlist rows and empty state', () => {
    const emptyWrapper = mountWithStubs(WatchlistTable, {
      props: {
        assets: [],
      },
    });

    expect(emptyWrapper.text()).toContain('No eligible assets match current filters.');

    const filledWrapper = mountWithStubs(WatchlistTable, {
      props: {
        assets: [
          {
            id: 'asset-1',
            symbol: 'BTCUSDT',
            marketScope: 'spot',
            rankScore: 0.91,
            sectorBucket: 'L1',
            liquidityTier: 'tier-1',
            filterResults: {},
            scoringMetadata: {},
            updatedAt: '2026-05-17T12:00:00.000Z',
            createdAt: '2026-05-17T10:00:00.000Z',
          },
        ],
      },
    });

    expect(filledWrapper.text()).toContain('BTCUSDT');
    expect(filledWrapper.text()).toContain('tier-1');
  });

  it('renders signal detail empty and selected states', () => {
    const emptyWrapper = mountWithStubs(SignalDetail, {
      props: {
        signal: null,
      },
    });

    expect(emptyWrapper.text()).toContain(
      'Select a symbol to inspect signal contributions and staleness.',
    );

    const filledWrapper = mountWithStubs(SignalDetail, {
      props: {
        signal: {
          symbol: 'ETHUSDT',
          timeframe: '4h',
          compositeScore: 0.81,
          confidence: 0.67,
          contributions: {
            momentum: 0.4,
          },
          missingRequiredSignals: [],
          staleSignals: ['funding'],
          timestamp: Date.now(),
        },
      },
    });

    expect(filledWrapper.text()).toContain('ETHUSDT');
    expect(filledWrapper.text()).toContain('Score 0.81');
    expect(filledWrapper.text()).toContain('Confidence 0.67');
  });

  it('renders correlation matrix with degraded marker', () => {
    const wrapper = mountWithStubs(CorrelationMatrix, {
      props: {
        rows: [
          {
            signal: 'momentum_4h',
            correlation: 0.46,
            variance: 0.12,
            trend: 'up',
            sampleSize: 80,
            degraded: false,
          },
          {
            signal: 'funding_pressure',
            correlation: 0.22,
            variance: 0.58,
            trend: 'down',
            sampleSize: 80,
            degraded: true,
          },
        ],
      },
    });

    expect(wrapper.text()).toContain('momentum_4h');
    expect(wrapper.text()).toContain('funding_pressure');
    expect(wrapper.text()).toContain('degraded');
  });

  it('renders positions slice content', () => {
    const wrapper = mountWithStubs(PositionsTable, {
      props: {
        positions: [
          {
            id: 'position-1',
            symbol: 'BTCUSDT',
            side: 'LONG',
            quantity: 0.25,
            entryPrice: 61000,
            markPrice: 61400,
            unrealizedPnl: 85,
            realizedPnl: 10,
            isOpen: true,
            openedAt: '2026-05-17T10:00:00.000Z',
            updatedAt: '2026-05-17T10:30:00.000Z',
            leverage: 1,
            riskPct: 0.8,
          },
        ],
      },
    });

    expect(wrapper.text()).toContain('BTCUSDT');
    expect(wrapper.text()).toContain('LONG');
    expect(wrapper.text()).not.toContain('No open positions.');
  });

  it('emits trades pagination changes', async () => {
    const wrapper = mountWithStubs(TradesTable, {
      props: {
        loading: false,
        pagedTrades: {
          items: [
            {
              id: 'trade-1',
              orderExecutionId: 'order-1',
              positionId: 'position-1',
              symbol: 'BTCUSDT',
              marketScope: 'spot',
              side: 'LONG',
              entryPrice: 61000,
              exitPrice: 61400,
              quantity: 0.25,
              fees: 4.25,
              funding: 0,
              realizedPnl: 92.4,
              openedAt: '2026-05-17T08:00:00.000Z',
              closedAt: '2026-05-17T10:00:00.000Z',
              createdAt: '2026-05-17T10:00:00.000Z',
            },
          ],
          total: 120,
          offset: 0,
          limit: 50,
        },
      },
    });

    const nextButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Next'));
    expect(nextButton).toBeTruthy();
    if (!nextButton) {
      throw new Error('Expected Next button to exist in TradesTable test.');
    }

    await nextButton.trigger('click');

    const emitted = wrapper.emitted('page-change');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual([50, 50]);
  });

  it('emits config submit when form is valid', async () => {
    const wrapper = mountWithStubs(ConfigForm, {
      props: {
        loading: false,
        profile: {
          id: 'profile-1',
          marketScope: 'spot',
          version: 3,
          isActive: true,
          weights: {
            'signal.momentum': 1,
          },
          thresholds: {
            'entry.minScore': 0.55,
          },
          createdAt: '2026-05-17T08:00:00.000Z',
          updatedAt: '2026-05-17T10:00:00.000Z',
        },
      },
    });

    await nextTick();

    const submitButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Save Profile'));
    expect(submitButton).toBeTruthy();
    if (!submitButton) {
      throw new Error('Expected Save Profile button to exist in ConfigForm test.');
    }

    await submitButton.trigger('click');

    const emitted = wrapper.emitted('submit');
    expect(emitted).toBeTruthy();

    const payload = emitted?.[0]?.[0] as {
      actor: string;
      weights: Record<string, number>;
      thresholds: Record<string, number>;
    };
    expect(payload.actor.length).toBeGreaterThan(0);
    expect(payload.weights['signal.momentum']).toBe(1);
    expect(payload.thresholds['entry.minScore']).toBe(0.55);
  });
});
