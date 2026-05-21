import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSimilarDiscovery } from '~/composables/useSimilarDiscovery';

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('useSimilarDiscovery', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal('fetch', vi.fn());
    globalThis.useRuntimeConfig = (() => ({
      public: {
        musicApiBaseUrl: 'http://localhost:4000',
        musicPollingIntervalDefault: 15000,
        musicRequireAuth: false,
        musicAuthStorageKey: 'music.operator.session',
      },
    })) as typeof globalThis.useRuntimeConfig;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores normalized similar search results and provider provenance', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        searchId: 'search-42',
        providerUsed: 'lastfm',
        results: [
          {
            title: 'Digital Love',
            artist: 'Daft Punk',
            confidence: 0.82,
            reference: {
              provider: 'lastfm',
              externalId: 'digital-love',
              title: 'Digital Love',
              artist: 'Daft Punk',
              label: 'Digital Love - Daft Punk',
            },
          },
        ],
      }),
    );

    const discovery = useSimilarDiscovery();
    await discovery.search({
      mode: 'catalog',
      reference: {
        provider: 'catalog',
        externalId: 'seed-1',
        title: 'One More Time',
        artist: 'Daft Punk',
        label: 'One More Time - Daft Punk',
      },
    });

    expect(discovery.providerUsed.value).toBe('lastfm');
    expect(discovery.searchId.value).toBe('search-42');
    expect(discovery.items.value[0]?.reference.externalId).toBe('digital-love');
    expect(discovery.error.value).toBeNull();
  });

  it('maps provider failures into a controlled provider-unavailable state without changing mode', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        message: 'Catalog provider unavailable right now.',
      }, 503),
    );

    const discovery = useSimilarDiscovery();

    await expect(
      discovery.search({
        mode: 'catalog',
        reference: {
          provider: 'catalog',
          externalId: 'seed-2',
          title: 'Aerodynamic',
          artist: 'Daft Punk',
          label: 'Aerodynamic - Daft Punk',
        },
      }),
    ).rejects.toMatchObject({ status: 503 });

    expect(discovery.errorKind.value).toBe('provider-unavailable');
    expect(discovery.error.value).toBe('Catalog provider unavailable right now.');
    expect(discovery.lastInput.value?.mode).toBe('catalog');
    expect(discovery.response.value).toBeNull();
  });
});
