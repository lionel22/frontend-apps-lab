import { ref, watch } from 'vue';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const state = ref<T>(initialValue);

  if (process.client) {
    const existing = localStorage.getItem(key);
    if (existing !== null) {
      try {
        state.value = JSON.parse(existing) as T;
      } catch {
        state.value = initialValue;
      }
    }

    watch(
      state,
      (value) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      { deep: true },
    );
  }

  return state;
}
