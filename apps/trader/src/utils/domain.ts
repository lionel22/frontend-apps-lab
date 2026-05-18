import type { AuditSeverity, BacktestTimeframe } from '~/types/trader';

export const DEFAULT_BACKTEST_PROFILE_NAME = 'spot-swing-default';

export const BACKTEST_TIMEFRAME_OPTIONS: Array<{
  title: string;
  value: BacktestTimeframe;
}> = [
  { title: '4 hours', value: '4h' },
  { title: '1 day', value: '1d' },
];

export const AUDIT_SEVERITY_OPTIONS: Array<{
  title: string;
  value: AuditSeverity;
}> = [
  { title: 'Info', value: 'INFO' },
  { title: 'Warning', value: 'WARNING' },
  { title: 'Critical', value: 'CRITICAL' },
];
