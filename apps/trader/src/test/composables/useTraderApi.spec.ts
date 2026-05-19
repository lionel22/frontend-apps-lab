import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useTraderContracts } from '~/composables/useTraderApi';
import { useUiStore } from '~/stores/ui';
import { fixtures } from '~/test/mocks/fixtures';
import { createFetchMock } from '~/test/mocks/handlers';

vi.stubGlobal('useCookie', () => ref<string | null>(null));
vi.stubGlobal('useRuntimeConfig', () => ({ public: {} }));
vi.stubGlobal('useState', (_key: string, init: () => unknown) => ref(init()));

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
    const trades = await api.fetchTrades({ offset: 0, limit: 50 });

    expect(trades.total).toBe(1);
    expect(trades.items[0].realizedPnl).toBeCloseTo(92.4);
    expect(typeof trades.items[0].entryPrice).toBe('number');
  });

  it('downloads trade export blobs with filename from response headers', async () => {
    const fetchMock = vi.fn(async () =>
      new Response('id\ntrade-1\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="trades-2026-05-18.csv"',
        },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const api = useTraderContracts();
    const result = await api.downloadTradesExport({ symbol: 'BTCUSDT' });

    expect(result.fileName).toBe('trades-2026-05-18.csv');
    expect(await result.blob.text()).toContain('trade-1');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      '/api/v1/export/trades?symbol=BTCUSDT',
    );
  });

  it('maps grouped global search results', async () => {
    vi.stubGlobal(
      'fetch',
      createFetchMock({
        '/api/v1/search': {
          body: fixtures.search,
        },
      }),
    );

    const api = useTraderContracts();
    const result = await api.searchGlobal('btc', 5);

    expect(result.total).toBe(2);
    expect(result.groups[0]?.resource).toBe('trade');
    expect(result.groups[1]?.items[0]?.badge).toBe('CRITICAL');
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
