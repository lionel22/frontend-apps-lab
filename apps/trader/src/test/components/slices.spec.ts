import { shallowMount, type MountingOptions } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import StatusCards from '~/components/dashboard/StatusCards.vue';
import WatchlistTable from '~/components/watchlist/WatchlistTable.vue';
import SignalDetail from '~/components/signals/SignalDetail.vue';
import ReadinessGauge from '~/components/signals/ReadinessGauge.vue';
import CorrelationMatrix from '~/components/signals/CorrelationMatrix.vue';
import HealthGauge from '~/components/positions/HealthGauge.vue';
import PositionsTable from '~/components/positions/PositionsTable.vue';
import ExportButton from '~/components/shell/ExportButton.vue';
import TradesTable from '~/components/trades/TradesTable.vue';
import ConfigForm from '~/components/config/ConfigForm.vue';
import BacktestLaunchModal from '~/components/backtest/BacktestLaunchModal.vue';
import ConfigAuditLog from '~/components/config/AuditLog.vue';

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
      type: [String, Number, Array],
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  methods: {
    onInput(event: Event) {
      const target = event.target as HTMLInputElement;
      const rawValue = target.value;
      if (Array.isArray(this.modelValue)) {
        this.$emit(
          'update:modelValue',
          rawValue
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        );
        return;
      }

      this.$emit('update:modelValue', rawValue);
    },
  },
  template:
    '<label><span>{{ label }}</span><input :value="Array.isArray(modelValue) ? modelValue.join(\',\') : modelValue" @input="onInput" /></label>',
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
  VDialog: PassThrough,
  VBtn: ButtonStub,
  VTextField: TextFieldStub,
  VSelect: TextFieldStub,
  VCombobox: TextFieldStub,
  VDivider: PassThrough,
  VSpacer: PassThrough,
  VAlert: PassThrough,
  VProgressLinear: PassThrough,
  VProgressCircular: PassThrough,
  SharedLoadingSpinner: PassThrough,
  TradesTradeExpander: PassThrough,
  SignalsSignalStalenessIndicator: PassThrough,
  SignalsSignalContributionChart: PassThrough,
  SignalsReadinessGauge: PassThrough,
  SignalsDimensionBreakdown: PassThrough,
  ConfigDiffViewer: PassThrough,
};

vi.stubGlobal('useCookie', () => ref<string | null>(null));
vi.stubGlobal('useRuntimeConfig', () => ({ public: {} }));

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
            selectionSource: 'auto',
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

  it('renders readiness gauge thresholds', () => {
    const wrapper = mountWithStubs(ReadinessGauge, {
      props: {
        score: 81,
        title: 'Entry Window',
      },
    });

    expect(wrapper.text()).toContain('Entry Window');
    expect(wrapper.text()).toContain('81/100');
    expect(wrapper.text()).toContain('Go');
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

  it('renders position health gauge content', () => {
    const wrapper = mountWithStubs(HealthGauge, {
      props: {
        health: {
          positionId: 'position-1',
          symbol: 'BTCUSDT',
          side: 'LONG',
          healthScore: 74,
          status: 'HOLD',
          exitPressureScore: 28,
          currentCompositeScore: 0.5,
          entryCompositeScore: 0.22,
          currentRegimeScore: 0.18,
          entryRegimeScore: 0.11,
          positionAgeHours: 8,
          averageTradeDurationHours: 22,
          syntheticStopPrice: 59000,
          dimensions: {
            pnlTrend: {
              label: 'PnL Trend',
              score: 80,
              weight: 0.25,
              contribution: 20,
              detail: 'Supportive',
            },
            signalEvolution: {
              label: 'Signal Evolution',
              score: 72,
              weight: 0.25,
              contribution: 18,
              detail: 'Stable',
            },
            duration: {
              label: 'Duration',
              score: 76,
              weight: 0.2,
              contribution: 15.2,
              detail: 'Normal',
            },
            stopProximity: {
              label: 'Stop Proximity',
              score: 70,
              weight: 0.15,
              contribution: 10.5,
              detail: 'Room left',
            },
            regimeCompatibility: {
              label: 'Regime Compatibility',
              score: 69,
              weight: 0.15,
              contribution: 10.35,
              detail: 'Aligned',
            },
          },
          updatedAt: '2026-05-18T20:00:00.000Z',
        },
      },
    });

    expect(wrapper.text()).toContain('HOLD');
    expect(wrapper.text()).toContain('Exit pressure 28/100');
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

  it('emits export start and cancel actions', async () => {
    const wrapper = mountWithStubs(ExportButton, {
      props: {
        loading: false,
        label: 'Export Trades CSV',
      },
    });

    const startButton = wrapper.find('button');
    await startButton.trigger('click');

    expect(wrapper.emitted('download')).toBeTruthy();

    await wrapper.setProps({ loading: true });

    const cancelButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Cancel'));
    expect(cancelButton).toBeTruthy();
    if (!cancelButton) {
      throw new Error('Expected Cancel button to exist in ExportButton test.');
    }

    await cancelButton.trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
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

  it('emits normalized payload from the backtest launch modal', async () => {
    const wrapper = mountWithStubs(BacktestLaunchModal, {
      props: {
        modelValue: true,
        loading: false,
        symbolOptions: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
      },
    });

    const dateInputs = wrapper.findAll('input');
    const startDateInput = dateInputs.find((input) => input.element.previousSibling?.textContent === 'Start Date');
    const endDateInput = dateInputs.find((input) => input.element.previousSibling?.textContent === 'End Date');

    expect(startDateInput).toBeTruthy();
    expect(endDateInput).toBeTruthy();
    if (!startDateInput || !endDateInput) {
      throw new Error('Expected start and end date inputs to exist.');
    }

    await startDateInput.setValue('2026-01-01');
    await endDateInput.setValue('2026-01-31');

    const launchButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Launch'));
    expect(launchButton).toBeTruthy();
    if (!launchButton) {
      throw new Error('Expected Launch button to exist in BacktestLaunchModal test.');
    }

    await launchButton.trigger('click');

    const emitted = wrapper.emitted('launch');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[0]).toEqual({
      symbols: ['BTC/USDT', 'ETH/USDT'],
      days: undefined,
      timeframe: '4h',
      profileName: 'spot-swing-default',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-31T23:59:59.999Z',
      marketScope: 'spot',
    });
  });

  it('emits normalized audit log filters with date boundaries', async () => {
    const wrapper = mountWithStubs(ConfigAuditLog, {
      props: {
        response: {
          items: [
            {
              id: 'audit-1',
              type: 'KILL_SWITCH_ENGAGED',
              severity: 'CRITICAL',
              message: 'Kill-switch engaged by operator',
              actor: 'operator',
              reason: 'manual',
              timestamp: '2026-05-17T11:00:00.000Z',
            },
          ],
          total: 1,
          offset: 0,
          limit: 50,
        },
        loading: false,
      },
    });

    const inputs = wrapper.findAll('input');
    const fromInput = inputs.find((input) => input.element.previousSibling?.textContent === 'From');
    const toInput = inputs.find((input) => input.element.previousSibling?.textContent === 'To');

    expect(fromInput).toBeTruthy();
    expect(toInput).toBeTruthy();
    if (!fromInput || !toInput) {
      throw new Error('Expected audit date inputs to exist.');
    }

    await fromInput.setValue('2026-05-01');
    await toInput.setValue('2026-05-31');

    const applyButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Apply Filters'));
    expect(applyButton).toBeTruthy();
    if (!applyButton) {
      throw new Error('Expected Apply Filters button to exist in ConfigAuditLog test.');
    }

    await applyButton.trigger('click');

    expect(wrapper.emitted('filter')?.[0]?.[0]).toEqual({
      actor: undefined,
      type: undefined,
      severity: undefined,
      from: '2026-05-01T00:00:00.000Z',
      to: '2026-05-31T23:59:59.999Z',
    });
  });
});
