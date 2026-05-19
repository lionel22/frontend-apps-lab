import { useSseStore } from '~/stores/sse';

describe('useSseStore', () => {
  it('detects per-event sequence gaps and ignores stale frames', () => {
    const sse = useSseStore();

    expect(sse.registerEvent('holdings:updated', 1)).toBe('ok');
    expect(sse.registerEvent('holdings:updated', 3)).toBe('gap');
    expect(sse.registerEvent('holdings:updated', 2)).toBe('stale');
    expect(sse.lastSeqByType['holdings:updated']).toBe(3);
  });

  it('backs off reconnect attempts and resets after reconnecting', () => {
    const sse = useSseStore();

    expect(sse.nextReconnectDelay()).toBe(1000);
    expect(sse.nextReconnectDelay()).toBe(2000);
    expect(sse.nextReconnectDelay()).toBe(4000);

    sse.markConnected();

    expect(sse.nextReconnectDelay()).toBe(1000);
  });
});
