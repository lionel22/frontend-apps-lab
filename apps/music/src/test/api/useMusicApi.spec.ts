import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useMusicApi } from '~/composables/useMusicApi';
import { useSession } from '~/composables/useSession';
import { useUiStore } from '~/stores/ui';

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('useMusicApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.useRuntimeConfig = (() => ({
      public: {
        musicApiBaseUrl: 'http://localhost:4000',
        musicPollingIntervalDefault: 15000,
        musicRequireAuth: false,
        musicAuthStorageKey: 'music.operator.session',
      },
    })) as typeof globalThis.useRuntimeConfig;
  });

  it('normalizes URL ingestion submissions', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        jobId: 'job-1',
        createdJobs: [
          {
            id: 'job-1',
            sourceLabel: 'https://example.com/track',
            status: 'queued',
            updatedAt: '2026-05-20T09:00:00.000Z',
          },
        ],
      }),
    );

    const api = useMusicApi();
    const result = await api.submitUrlIngestion({
      url: 'https://example.com/track',
      label: 'Seed label',
    });

    const [, requestInit] = fetchMock.mock.calls[0] ?? [];
    expect(requestInit?.body).toBe(
      JSON.stringify({
        sourceUrl: 'https://example.com/track',
        sourceLabel: 'Seed label',
      }),
    );

    expect(result.createdJobIds).toEqual(['job-1']);
    expect(result.createdJobs[0]?.status).toBe('queued');
  });

  it('sends upload requests as form data and normalizes the response', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        jobIds: ['upload-1'],
        acceptedCount: 1,
      }),
    );

    const api = useMusicApi();
    const file = new File(['music'], 'demo.mp3', { type: 'audio/mpeg' });
    const result = await api.uploadIngestion({ files: [file], sourceLabel: 'Seed batch' });

    const [, requestInit] = fetchMock.mock.calls[0] ?? [];
    expect(requestInit?.body).toBeInstanceOf(FormData);
    expect(result.acceptedCount).toBe(1);
    expect(result.createdJobIds).toEqual(['upload-1']);
  });

  it('normalizes the canonical jobs list and summary counts', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        jobs: [
          {
            jobId: 'job-1',
            source: 'https://example.com/one',
            status: 'running',
            lastUpdatedAt: '2026-05-20T10:00:00.000Z',
          },
          {
            id: 'job-2',
            sourceLabel: 'upload://track',
            status: 'failed',
            updatedAt: '2026-05-20T10:05:00.000Z',
            error: 'Bad file',
          },
        ],
        summary: {
          queued: 0,
          processing: 1,
          success: 0,
          failed: 1,
          active: 1,
          recentFailures: 1,
        },
      }),
    );

    const api = useMusicApi();
    const result = await api.fetchIngestions();

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.status).toBe('processing');
    expect(result.items[1]?.errorMessage).toBe('Bad file');
    expect(result.summaryCounts.active).toBe(1);
  });

  it('normalizes a single ingestion record', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        jobId: 'job-9',
        sourceLabel: 'Manual import',
        status: 'completed',
        updatedAt: '2026-05-20T10:10:00.000Z',
      }),
    );

    const api = useMusicApi();
    const result = await api.fetchIngestion('job-9');

    expect(result.id).toBe('job-9');
    expect(result.status).toBe('success');
  });

  it('normalizes autocomplete suggestions into stable references', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        items: [
          {
            title: 'Around the World',
            artist: 'Daft Punk',
            id: 'track-1',
            sourceLabel: 'Last.fm',
            suggestionRef: 'lastfm:123',
            resolvedUrl: 'https://www.youtube.com/watch?v=aroundworld123',
          },
        ],
      }),
    );

    const api = useMusicApi();
    const result = await api.fetchTitleAutocomplete({ query: 'around' });
    const [requestUrl] = fetchMock.mock.calls[0] ?? [];

    expect(requestUrl).toContain('q=around');
    expect(result[0]?.reference.externalId).toBe('lastfm:123');
    expect(result[0]?.reference.provider).toBe('lastfm');
    expect(result[0]?.reference.label).toBe('Around the World - Daft Punk');
    expect(result[0]?.reference.resolvedUrl).toBe(
      'https://www.youtube.com/watch?v=aroundworld123',
    );
  });

  it('normalizes similar search responses and provider provenance', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        searchQueryId: 'search-1',
        providerUsed: 'lastfm',
        items: [
          {
            id: 'result-1',
            providerResultId: 'lastfm-1',
            title: 'Digital Love',
            artist: 'Daft Punk',
            score: 0.81,
            ingestibleUrl: 'https://www.youtube.com/watch?v=digitallove1',
          },
        ],
      }),
    );

    const api = useMusicApi();
    const result = await api.searchSimilar({
      mode: 'catalog',
      reference: {
        provider: 'catalog',
        externalId: 'seed',
        title: 'One More Time',
        artist: 'Daft Punk',
        label: 'One More Time - Daft Punk',
      },
    });
    const [, requestInit] = fetchMock.mock.calls[0] ?? [];

    expect(result.searchId).toBe('search-1');
    expect(result.providerUsed).toBe('lastfm');
    expect(result.items[0]?.confidence).toBe(0.81);
    expect(result.items[0]?.reference.externalId).toBe('result-1');
    expect(JSON.parse(String(requestInit?.body))).toMatchObject({
      mode: 'catalog',
      reference: 'One More Time',
      suggestionRef: 'seed',
    });
  });

  it('normalizes batch ingestion outcomes', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        searchQueryId: 'search-1',
        jobs: [
          {
            id: 'batch-1',
            sourceLabel: 'Track One - Artist One',
            status: 'PENDING',
            updatedAt: '2026-05-20T10:10:00.000Z',
          },
          {
            id: 'batch-2',
            sourceLabel: 'Track Two - Artist Two',
            status: 'PENDING',
            updatedAt: '2026-05-20T10:11:00.000Z',
          },
        ],
        failures: [
          {
            reason: 'Provider rejected the URL',
          },
        ],
      }),
    );

    const api = useMusicApi();
    const references = [
      {
        provider: 'catalog',
        externalId: 'one',
        title: 'Track One',
        artist: 'Artist One',
        label: 'Track One - Artist One',
      },
      {
        provider: 'catalog',
        externalId: 'two',
        title: 'Track Two',
        artist: 'Artist Two',
        label: 'Track Two - Artist Two',
      },
    ];
    const result = await api.submitBatchFromSearch({
      searchId: 'search-1',
      references,
    });
    const [, requestInit] = fetchMock.mock.calls[0] ?? [];

    expect(result.createdJobIds).toEqual(['batch-1', 'batch-2']);
    expect(result.failedReferences[0]?.reference.externalId).toBe('one');
    expect(result.failedReferences[0]?.reason).toBe('Provider rejected the URL');
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      searchQueryId: 'search-1',
      resultIds: ['one', 'two'],
    });
  });

  it('normalizes dry-run and apply organization responses', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          summary: {
            plannedMoveCount: 2,
            conflictCount: 1,
            ignoredCount: 1,
          },
          plannedMoves: [
            {
              fromPath: '/incoming/one.mp3',
              toPath: '/library/Artist/Album/one.mp3',
            },
          ],
          skippedConflicts: [
            {
              path: '/library/conflict.mp3',
              reason: 'Existing destination',
            },
          ],
          ignoredItems: [
            {
              path: '/incoming/readme.txt',
              reason: 'Not an audio file',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          organizationRunId: 'org-1',
          summary: {
            plannedMoveCount: 1,
            appliedMoveCount: 1,
            conflictCount: 0,
            ignoredCount: 0,
            errorCount: 0,
          },
          appliedMoves: [
            {
              fromPath: '/incoming/two.mp3',
              toPath: '/library/Artist/Album/two.mp3',
            },
          ],
          skippedConflicts: [],
          ignoredItems: [],
          itemErrors: [],
        }),
      );

    const api = useMusicApi();
    const dryRun = await api.organize({ dryRun: true, rules: { mode: 'artist-album' } });
    const apply = await api.organize({ dryRun: false, rules: { mode: 'artist-album' } });

    expect(dryRun.summary.conflictCount).toBe(1);
    expect(apply.organizationRunId).toBe('org-1');
    expect(apply.appliedMoves).toHaveLength(1);
  });

  it('attaches the shared token and clears the session on 401', async () => {
    globalThis.useRuntimeConfig = (() => ({
      public: {
        musicApiBaseUrl: 'http://localhost:4000',
        musicPollingIntervalDefault: 15000,
        musicRequireAuth: true,
        musicAuthStorageKey: 'music.operator.session',
      },
    })) as typeof globalThis.useRuntimeConfig;

    const session = useSession();
    const ui = useUiStore();
    session.setSession({ token: 'shared-token', actor: 'operator' });

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(createJsonResponse({ message: 'Unauthorized' }, 401));

    const api = useMusicApi();
    await expect(api.fetchIngestions()).rejects.toMatchObject({ status: 401 });

    const [requestUrl, requestInit] = fetchMock.mock.calls[0] ?? [];
    expect(requestUrl).toBe('http://localhost:4000/api/v1/music/ingestions');
    expect(requestInit?.headers).toMatchObject({
      Authorization: 'Bearer shared-token',
    });
    expect(session.isAuthenticated.value).toBe(false);
    expect(ui.alerts[0]?.message).toContain('Shared operator token rejected');
  });
});
