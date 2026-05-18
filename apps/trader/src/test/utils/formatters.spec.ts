import {
  formatDateTime,
  parseBoolean,
  parseNumber,
} from '~/utils/formatters';

describe('formatters', () => {
  it('parses numeric strings safely', () => {
    expect(parseNumber('42.5')).toBe(42.5);
    expect(parseNumber('oops', 10)).toBe(10);
  });

  it('parses booleans from strings', () => {
    expect(parseBoolean('true')).toBe(true);
    expect(parseBoolean('false')).toBe(false);
    expect(parseBoolean('unknown', true)).toBe(true);
  });

  it('formats ISO timestamps to readable datetime', () => {
    const formatted = formatDateTime('2026-05-17T10:00:00.000Z');
    expect(formatted).toContain('2026');
  });
});
