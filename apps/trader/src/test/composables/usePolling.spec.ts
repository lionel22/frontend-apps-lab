import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { usePolling } from '~/composables/usePolling';

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs immediately and repeats on interval', async () => {
    const calls = ref(0);

    mount({
      template: '<div />',
      setup() {
        usePolling(async () => {
          calls.value += 1;
        }, { interval: 1000 });

        return {};
      },
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(calls.value).toBe(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(calls.value).toBe(2);
  });

  it('backs off interval after 429 responses', async () => {
    let firstCall = true;
    let pollingInstance: ReturnType<typeof usePolling> | null = null;

    mount({
      template: '<div />',
      setup() {
        pollingInstance = usePolling(async () => {
          if (firstCall) {
            firstCall = false;
            throw { status: 429 };
          }
        }, { interval: 1000 });

        return {};
      },
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(pollingInstance?.interval.value).toBeGreaterThan(1000);
  });
});
