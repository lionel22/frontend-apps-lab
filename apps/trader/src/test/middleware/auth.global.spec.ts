import { ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = {
  requireAuth: ref(false),
  isAuthenticated: ref(true),
  hydratedOnClient: ref(true),
};

vi.mock('~/composables/useSession', () => ({
  useSession: () => session,
}));

import middleware from '~/middleware/auth.global';

describe('auth.global middleware', () => {
  beforeEach(() => {
    session.requireAuth.value = false;
    session.isAuthenticated.value = true;
    session.hydratedOnClient.value = true;
    vi.mocked(globalThis.navigateTo).mockClear();
  });

  it('redirects unauthenticated protected routes to login', async () => {
    session.requireAuth.value = true;
    session.isAuthenticated.value = false;

    await middleware({
      path: '/status',
      fullPath: '/status',
      query: {},
    } as never);

    expect(globalThis.navigateTo).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/status' },
    });
  });

  it('redirects during server-side evaluation when route is protected', async () => {
    session.requireAuth.value = true;
    session.isAuthenticated.value = false;

    const originalProcess = globalThis.process;
    Object.defineProperty(globalThis, 'process', {
      value: { ...originalProcess, server: true, client: false },
      configurable: true,
    });

    try {
      await middleware({
        path: '/status',
        fullPath: '/status',
        query: {},
      } as never);

      expect(globalThis.navigateTo).toHaveBeenCalledWith({
        path: '/login',
        query: { redirect: '/status' },
      });
    } finally {
      Object.defineProperty(globalThis, 'process', {
        value: originalProcess,
        configurable: true,
      });
    }
  });

  it('allows the login route for unauthenticated sessions', async () => {
    session.requireAuth.value = true;
    session.isAuthenticated.value = false;

    const result = await middleware({
      path: '/login',
      fullPath: '/login',
      query: {},
    } as never);

    expect(result).toBeUndefined();
    expect(globalThis.navigateTo).not.toHaveBeenCalled();
  });

  it('redirects authenticated users away from login', async () => {
    session.requireAuth.value = true;
    session.isAuthenticated.value = true;

    await middleware({
      path: '/login',
      fullPath: '/login?redirect=/config',
      query: { redirect: '/config' },
    } as never);

    expect(globalThis.navigateTo).toHaveBeenCalledWith('/config');
  });
});
