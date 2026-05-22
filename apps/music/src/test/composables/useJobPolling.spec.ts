import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { defineComponent, nextTick } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useJobPolling } from '~/composables/useJobPolling';

describe('useJobPolling', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal('fetch', vi.fn());
    globalThis.useRuntimeConfig = (() => ({
      public: {
        musicApiBaseUrl: 'http://localhost:4000',
        musicPollingIntervalDefault: 15000,
        musicRequireAuth: true,
        musicAuthStorageKey: 'music.operator.session',
      },
    })) as typeof globalThis.useRuntimeConfig;
  });

  it('does not request ingestion jobs when auth is required and no bearer token is present', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    let polling: ReturnType<typeof useJobPolling> | undefined;

    mount(
      defineComponent({
        setup() {
          polling = useJobPolling();
          return () => null;
        },
      }),
    );

    await nextTick();

    await polling?.refresh({ manual: true });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
