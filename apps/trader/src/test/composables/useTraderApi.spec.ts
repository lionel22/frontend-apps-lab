import { createPinia, setActivePinia } from 'pinia';
import { useTraderContracts } from '~/composables/useTraderApi';
import { useUiStore } from '~/stores/ui';
import { fixtures } from '~/test/mocks/fixtures';
import { createFetchMock } from '~/test/mocks/handlers';

describe('useTraderApi', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('maps paginated trades contract to numeric fields', async () => {
    vi.stubGlobal(
      'fetch',
      createFetchMock({
        '/api/v1/trades': {
          body: fixtures.trades,
        },
      }),
    );

    const api = useTraderContracts();
    const trades = await api.fetchTrades(0, 50);

    expect(trades.total).toBe(1);
    expect(trades.items[0].realizedPnl).toBeCloseTo(92.4);
    expect(typeof trades.items[0].entryPrice).toBe('number');
  });

  it('surfaces rate-limit errors as UI alerts', async () => {
    vi.stubGlobal(
      'fetch',
      createFetchMock({
        '/api/v1/status': {
          status: 429,
          body: { message: 'Too many requests' },
        },
      }),
    );

    const api = useTraderContracts();
    const ui = useUiStore();

    await expect(api.fetchStatus()).rejects.toMatchObject({ status: 429 });
    expect(ui.alerts.length).toBeGreaterThan(0);
  });
});
