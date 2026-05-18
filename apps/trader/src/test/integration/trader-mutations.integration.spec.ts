import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTraderStore } from '~/stores/trader';
import { useCacheStore } from '~/stores/cache';
import { useUiStore } from '~/stores/ui';
import { fixtures } from '~/test/mocks/fixtures';

interface MockRequest {
  method: string;
  path: string;
  body: unknown;
}

interface MockResponse {
  status?: number;
  body: unknown;
}

function createRouteAwareFetchMock(
  handler: (request: MockRequest) => MockResponse,
) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const method = (init?.method || 'GET').toUpperCase();
    const parsed = new URL(rawUrl, 'http://localhost');
    const bodyText = typeof init?.body === 'string' ? init.body : null;
    const body = bodyText ? (JSON.parse(bodyText) as unknown) : undefined;

    const response = handler({
      method,
      path: parsed.pathname,
      body,
    });

    return new Response(JSON.stringify(response.body), {
      status: response.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

describe('trader integration mutation flows', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('launches backtest then tracks run-status transitions', async () => {
    const store = useTraderStore();
    const cache = useCacheStore();
    const ui = useUiStore();

    cache.touch('backtests');
    cache.touch('backtestDetail');

    const launchPayload = {
      symbols: ['BTCUSDT', 'ETHUSDT'],
      days: 30,
      timeframe: '4h' as const,
      marketScope: 'spot' as const,
    };

    let launchRequestBody: unknown;
    let detailCallCount = 0;

    vi.stubGlobal(
      'fetch',
      createRouteAwareFetchMock((request) => {
        if (
          request.path === '/api/v1/backtest/launch' &&
          request.method === 'POST'
        ) {
          launchRequestBody = request.body;
          return { body: { runId: 'run-2' } };
        }

        if (request.path === '/api/v1/backtest/run-2' && request.method === 'GET') {
          detailCallCount += 1;
          return {
            body: {
              ...fixtures.backtestDetail,
              id: 'run-2',
              status: detailCallCount === 1 ? 'RUNNING' : 'COMPLETED',
            },
          };
        }

        return {
          status: 404,
          body: { message: `No test route for ${request.method} ${request.path}` },
        };
      }),
    );

    const launchResult = await store.launchBacktest(launchPayload);
    expect(launchResult).toEqual({ runId: 'run-2' });
    expect(launchRequestBody).toMatchObject(launchPayload);
    expect(cache.resources.backtests.lastFetchTime).toBeNull();
    expect(cache.resources.backtestDetail.lastFetchTime).toBeNull();

    const first = await store.fetchBacktestDetail('run-2', true);
    const second = await store.fetchBacktestDetail('run-2', true);

    expect(first?.status).toBe('RUNNING');
    expect(second?.status).toBe('COMPLETED');
    expect(detailCallCount).toBe(2);
    expect(store.backtestDetail?.status).toBe('COMPLETED');
    expect(
      ui.alerts.some((alert) => alert.message.includes('queued successfully')),
    ).toBe(true);
  });

  it('sends required actor and reason for kill-switch and resume', async () => {
    const store = useTraderStore();
    const cache = useCacheStore();
    const ui = useUiStore();

    cache.touch('status');
    cache.touch('positions');

    const receivedPayloads: Array<{ path: string; body: unknown }> = [];

    vi.stubGlobal(
      'fetch',
      createRouteAwareFetchMock((request) => {
        if (
          request.path === '/api/v1/control/kill-switch' &&
          request.method === 'POST'
        ) {
          receivedPayloads.push({ path: request.path, body: request.body });
          return { body: { ok: true } };
        }

        if (request.path === '/api/v1/control/resume' && request.method === 'POST') {
          receivedPayloads.push({ path: request.path, body: request.body });
          return { body: { ok: true } };
        }

        return {
          status: 404,
          body: { message: `No test route for ${request.method} ${request.path}` },
        };
      }),
    );

    const killPayload = {
      actor: 'operator-ui',
      reason: 'Risk threshold breached.',
    };
    const resumePayload = {
      actor: 'operator-ui',
      reason: 'Manual checks complete.',
    };

    await expect(store.executeKillSwitch(killPayload)).resolves.toEqual({ ok: true });
    await expect(store.resumeTrading(resumePayload)).resolves.toEqual({ ok: true });

    expect(receivedPayloads[0]).toMatchObject({
      path: '/api/v1/control/kill-switch',
      body: killPayload,
    });
    expect(receivedPayloads[1]).toMatchObject({
      path: '/api/v1/control/resume',
      body: resumePayload,
    });
    expect(cache.resources.status.lastFetchTime).toBeNull();
    expect(cache.resources.positions.lastFetchTime).toBeNull();

    const messages = ui.alerts.map((entry) => entry.message);
    expect(messages).toContain('Kill-switch activated successfully.');
    expect(messages).toContain('Trading resumed successfully.');
  });

  it('rebuilds and edits the watchlist through mutation actions', async () => {
    const store = useTraderStore();
    const cache = useCacheStore();
    const ui = useUiStore();

    const currentWatchlist: Array<Record<string, unknown>> = [
      {
        id: 'asset-btc',
        symbol: 'BTC/USDT',
        marketScope: 'spot',
        rankScore: 0.95,
        sectorBucket: 'L1',
        liquidityTier: 'tier-1',
        filterResults: {},
        scoringMetadata: {},
        updatedAt: '2026-05-17T12:00:00.000Z',
        createdAt: '2026-05-17T10:00:00.000Z',
      },
    ];

    const receivedRequests: Array<{ path: string; body: unknown }> = [];

    vi.stubGlobal(
      'fetch',
      createRouteAwareFetchMock((request) => {
        if (request.path === '/api/v1/watchlist/rebuild' && request.method === 'POST') {
          receivedRequests.push({ path: request.path, body: request.body });
          currentWatchlist.splice(0, currentWatchlist.length, ...[
            {
              id: 'asset-btc',
              symbol: 'BTC/USDT',
              marketScope: 'spot',
              rankScore: 0.95,
              sectorBucket: 'L1',
              liquidityTier: 'tier-1',
              filterResults: {},
              scoringMetadata: {},
              updatedAt: '2026-05-17T12:00:00.000Z',
              createdAt: '2026-05-17T10:00:00.000Z',
            },
            {
              id: 'asset-eth',
              symbol: 'ETH/USDT',
              marketScope: 'spot',
              rankScore: 0.88,
              sectorBucket: 'L1',
              liquidityTier: 'tier-1',
              filterResults: {},
              scoringMetadata: {},
              updatedAt: '2026-05-17T12:00:00.000Z',
              createdAt: '2026-05-17T10:00:00.000Z',
            },
          ]);
          return { body: { ok: true, selectedCount: 2 } };
        }

        if (request.path === '/api/v1/watchlist/assets' && request.method === 'POST') {
          receivedRequests.push({ path: request.path, body: request.body });
          currentWatchlist.push({
            id: 'asset-sol',
            symbol: 'SOL/USDT',
            marketScope: 'spot',
            rankScore: 0,
            sectorBucket: null,
            liquidityTier: 'unknown',
            filterResults: { manualSelectionMode: 'manual_include' },
            scoringMetadata: {},
            updatedAt: '2026-05-17T12:00:00.000Z',
            createdAt: '2026-05-17T10:00:00.000Z',
          });
          return { body: currentWatchlist[currentWatchlist.length - 1] };
        }

        if (
          request.path === '/api/v1/watchlist/assets/remove' &&
          request.method === 'POST'
        ) {
          receivedRequests.push({ path: request.path, body: request.body });
          const row = request.body as { symbol: string };
          const next = currentWatchlist.filter((asset) => asset.symbol !== row.symbol);
          currentWatchlist.splice(0, currentWatchlist.length, ...next);
          return { body: { ok: true } };
        }

        if (request.path === '/api/v1/watchlist' && request.method === 'GET') {
          return { body: currentWatchlist };
        }

        if (request.path === '/api/v1/status' && request.method === 'GET') {
          return {
            body: {
              ...fixtures.status,
              watchlistSize: currentWatchlist.length,
            },
          };
        }

        return {
          status: 404,
          body: { message: `No test route for ${request.method} ${request.path}` },
        };
      }),
    );

    await expect(store.rebuildWatchlist()).resolves.toEqual({
      ok: true,
      selectedCount: 2,
    });
    await expect(store.addWatchlistAsset('SOL/USDT')).resolves.toMatchObject({
      symbol: 'SOL/USDT',
      selectionSource: 'manual',
    });
    await expect(store.removeWatchlistAsset('BTC/USDT')).resolves.toEqual({
      ok: true,
    });

    expect(receivedRequests).toEqual([
      { path: '/api/v1/watchlist/rebuild', body: undefined },
      {
        path: '/api/v1/watchlist/assets',
        body: { symbol: 'SOL/USDT' },
      },
      {
        path: '/api/v1/watchlist/assets/remove',
        body: { symbol: 'BTC/USDT' },
      },
    ]);
    expect(store.watchlist.map((asset) => asset.symbol)).toEqual([
      'ETH/USDT',
      'SOL/USDT',
    ]);
    expect(store.watchlist.find((asset) => asset.symbol === 'SOL/USDT')?.selectionSource).toBe(
      'manual',
    );
    expect(store.status?.watchlistSize).toBe(2);
    expect(cache.resources.watchlist.lastFetchTime).not.toBeNull();
    expect(cache.resources.status.lastFetchTime).not.toBeNull();

    const messages = ui.alerts.map((entry) => entry.message);
    expect(messages).toContain('Watchlist rebuilt successfully (2 assets).');
    expect(messages).toContain('SOL/USDT added to the watchlist.');
    expect(messages).toContain('BTC/USDT removed from the watchlist.');
  });

  it('updates config and exposes entry through audit-log fetch', async () => {
    const store = useTraderStore();
    const cache = useCacheStore();

    cache.touch('config');
    cache.touch('correlation');
    cache.touch('auditLog');

    let latestConfigPayload: {
      actor: string;
      reason?: string;
      weights: Record<string, number>;
      thresholds: Record<string, number>;
    } | null = null;

    vi.stubGlobal(
      'fetch',
      createRouteAwareFetchMock((request) => {
        if (request.path === '/api/v1/config/weights' && request.method === 'PUT') {
          latestConfigPayload = request.body as {
            actor: string;
            reason?: string;
            weights: Record<string, number>;
            thresholds: Record<string, number>;
          };

          return {
            body: {
              id: 'profile-2',
              marketScope: 'spot',
              version: 4,
              isActive: true,
              weights: latestConfigPayload.weights,
              thresholds: latestConfigPayload.thresholds,
              createdAt: '2026-05-17T08:00:00.000Z',
              updatedAt: '2026-05-17T12:30:00.000Z',
            },
          };
        }

        if (request.path === '/api/v1/audit-log' && request.method === 'GET') {
          return {
            body: {
              items: [
                {
                  id: 'audit-2',
                  type: 'config.weight_profile.updated',
                  severity: 'INFO',
                  message: `Weight profile updated by ${latestConfigPayload?.actor ?? 'unknown'}`,
                  actor: latestConfigPayload?.actor ?? null,
                  reason: latestConfigPayload?.reason ?? null,
                  timestamp: '2026-05-17T12:31:00.000Z',
                },
              ],
              total: 1,
              offset: 0,
              limit: 50,
            },
          };
        }

        return {
          status: 404,
          body: { message: `No test route for ${request.method} ${request.path}` },
        };
      }),
    );

    const updatePayload = {
      actor: 'operator-ui',
      reason: 'Tune weights after low-sample drift.',
      weights: {
        'signal.momentum': 0.4,
        'signal.meanReversion': 0.6,
      },
      thresholds: {
        'entry.minScore': 0.58,
      },
    };

    const updated = await store.updateConfig(updatePayload);
    expect(updated?.version).toBe(4);
    expect(latestConfigPayload).toMatchObject(updatePayload);
    expect(cache.resources.config.lastFetchTime).toBeNull();
    expect(cache.resources.correlation.lastFetchTime).toBeNull();
    expect(cache.resources.auditLog.lastFetchTime).toBeNull();

    const audit = await store.fetchAuditLog(
      0,
      50,
      {
        actor: updatePayload.actor,
        type: 'config.weight_profile.updated',
      },
      true,
    );

    expect(audit?.items).toHaveLength(1);
    expect(audit?.items[0].type).toBe('config.weight_profile.updated');
    expect(audit?.items[0].actor).toBe(updatePayload.actor);
    expect(audit?.items[0].reason).toBe(updatePayload.reason);
  });
});
