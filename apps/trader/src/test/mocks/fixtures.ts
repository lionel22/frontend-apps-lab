export const fixtures = {
  status: {
    marketScope: 'spot',
    tradingMode: 'paper',
    capabilities: {
      hasValidBacktests: true,
      hasPaperTradingEvidence: true,
      goLiveEligible: false,
    },
    watchlistSize: 12,
    holdingsCount: 3,
    killSwitchActive: false,
    timestamp: '2026-05-17T12:00:00.000Z',
  },
  trades: {
    items: [
      {
        id: 'trade-1',
        orderExecutionId: 'order-1',
        positionId: 'position-1',
        symbol: 'BTCUSDT',
        marketScope: 'spot',
        side: 'LONG',
        entryPrice: '61000.12',
        exitPrice: '61400.52',
        quantity: '0.25',
        fees: '4.25',
        funding: '0.00',
        realizedPnl: '92.40',
        openedAt: '2026-05-17T08:00:00.000Z',
        closedAt: '2026-05-17T10:00:00.000Z',
        createdAt: '2026-05-17T10:00:00.000Z',
      },
    ],
    total: 1,
    offset: 0,
    limit: 50,
  },
  backtestList: {
    items: [
      {
        id: 'run-1',
        status: 'COMPLETED',
        marketScope: 'spot',
        params: {
          symbols: ['BTCUSDT', 'ETHUSDT'],
          days: 90,
          timeframe: '4h',
        },
        metrics: {
          sharpeRatio: 1.12,
          maxDrawdown: 0.21,
        },
        startedAt: '2026-05-17T00:00:00.000Z',
        finishedAt: '2026-05-17T02:00:00.000Z',
        createdAt: '2026-05-17T00:00:00.000Z',
      },
    ],
    total: 1,
    offset: 0,
    limit: 20,
  },
  backtestDetail: {
    id: 'run-1',
    status: 'COMPLETED',
    marketScope: 'spot',
    params: {
      symbols: ['BTCUSDT', 'ETHUSDT'],
      days: 90,
      timeframe: '4h',
    },
    metrics: {
      sharpeRatio: 1.12,
      maxDrawdown: 0.21,
      profitFactor: 1.7,
      calmarRatio: 1.2,
    },
    equityCurve: [
      { ts: '2026-05-16T00:00:00.000Z', value: 10000 },
      { ts: '2026-05-17T00:00:00.000Z', value: 10350 },
    ],
    trades: [
      {
        symbol: 'BTCUSDT',
        side: 'LONG',
        entryPrice: 61000,
        exitPrice: 61400,
        quantity: 0.2,
        pnl: 80,
        fees: 4,
        funding: 0,
      },
    ],
    startedAt: '2026-05-17T00:00:00.000Z',
    finishedAt: '2026-05-17T02:00:00.000Z',
    createdAt: '2026-05-17T00:00:00.000Z',
  },
  auditLog: {
    items: [
      {
        id: 'audit-1',
        type: 'config.weight_profile.updated',
        severity: 'INFO',
        message: 'Weight profile updated by operator-ui',
        actor: 'operator-ui',
        reason: 'Tune threshold after drawdown event',
        timestamp: '2026-05-17T11:00:00.000Z',
      },
    ],
    total: 1,
    offset: 0,
    limit: 50,
  },
  correlation: {
    state: 'ready',
    sampleSize: 80,
    minSamples: 30,
    generatedAt: '2026-05-17T09:00:00.000Z',
    summary: [
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
    windows: [
      {
        periodStart: '2026-05-01T00:00:00.000Z',
        periodEnd: '2026-05-08T00:00:00.000Z',
        sampleSize: 40,
        rows: [
          {
            signal: 'momentum_4h',
            correlation: 0.39,
            variance: 0.21,
            trend: 'up',
            sampleSize: 40,
            degraded: false,
          },
        ],
      },
    ],
  },
  search: {
    query: 'btc',
    total: 2,
    groups: [
      {
        resource: 'trade',
        label: 'Trades',
        items: [
          {
            resource: 'trade',
            id: 'trade-1',
            title: 'BTCUSDT',
            subtitle: 'LONG • Trade trade-1 • PnL 92.4',
            badge: 'LONG',
          },
        ],
      },
      {
        resource: 'auditLog',
        label: 'Audit Log',
        items: [
          {
            resource: 'auditLog',
            id: 'audit-1',
            title: 'RISK_HALT',
            subtitle: 'Risk halt for BTCUSDT',
            badge: 'CRITICAL',
          },
        ],
      },
    ],
  },
};
