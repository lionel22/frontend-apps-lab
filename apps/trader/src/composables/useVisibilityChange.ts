import { onMounted, onUnmounted, ref } from 'vue';

export function useVisibilityChange() {
  const isVisible = ref(true);

  function updateVisibility() {
    if (!process.client) {
      return;
    }
    isVisible.value = document.visibilityState === 'visible';
  }

  onMounted(() => {
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', updateVisibility);
  });

  return { isVisible };
}
