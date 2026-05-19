import { vi } from 'vitest';

function normalizePath(url: string): string {
  const parsed = new URL(url, 'http://localhost');
  return parsed.pathname;
}

export function createFetchMock(
  routes: Record<
    string,
    {
      status?: number;
      body: unknown;
      headers?: Record<string, string>;
    }
  >,
) {
  return vi.fn(async (input: string | URL | Request) => {
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const path = normalizePath(rawUrl);
    const route = routes[path];

    if (!route) {
      return new Response(JSON.stringify({ message: `No test route for ${path}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isTextResponse = typeof route.body === 'string';

    return new Response(isTextResponse ? route.body : JSON.stringify(route.body), {
      status: route.status ?? 200,
      headers: {
        'Content-Type': isTextResponse ? 'text/plain' : 'application/json',
        ...(route.headers ?? {}),
      },
    });
  });
}
