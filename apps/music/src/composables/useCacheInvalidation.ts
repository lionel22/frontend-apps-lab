import { computed } from 'vue';
import { useMusicStore } from '~/stores/music';

export function useCacheInvalidation() {
  const music = useMusicStore();

  function invalidate(resource: string) {
    music.invalidateResource(resource);
  }

  function getVersion(resource: string): number {
    return music.cacheVersions[resource] ?? 0;
  }

  function hasChangedSince(resource: string, version: number): boolean {
    return getVersion(resource) > version;
  }

  return {
    cacheVersions: computed(() => music.cacheVersions),
    invalidate,
    getVersion,
    hasChangedSince,
  };
}
