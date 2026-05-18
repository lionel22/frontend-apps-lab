import type { TraderResourceKey } from '~/types/trader';
import { useCacheStore } from '~/stores/cache';

export function useCacheInvalidation() {
  const cache = useCacheStore();

  function invalidate(resource: TraderResourceKey) {
    cache.invalidate(resource);
  }

  function touch(resource: TraderResourceKey) {
    cache.touch(resource);
  }

  function isStale(resource: TraderResourceKey, maxAge: number): boolean {
    return cache.isStale(resource, maxAge);
  }

  function invalidatePattern(pattern: string) {
    cache.invalidatePattern(pattern);
  }

  return {
    invalidate,
    touch,
    isStale,
    invalidatePattern,
  };
}
