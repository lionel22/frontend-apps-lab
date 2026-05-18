import { computed, ref, type Ref } from 'vue';

interface PaginationOptions {
  itemsPerPage?: number;
}

export function usePagination<T>(
  items: Ref<T[]>,
  options: PaginationOptions = {},
) {
  const itemsPerPage = ref(Math.max(options.itemsPerPage ?? 50, 1));
  const currentPage = ref(1);

  const totalItems = computed(() => items.value.length);
  const totalPages = computed(() =>
    Math.max(Math.ceil(totalItems.value / itemsPerPage.value), 1),
  );

  const pageItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    return items.value.slice(start, start + itemsPerPage.value);
  });

  function next() {
    currentPage.value = Math.min(currentPage.value + 1, totalPages.value);
  }

  function prev() {
    currentPage.value = Math.max(currentPage.value - 1, 1);
  }

  function setPage(page: number) {
    currentPage.value = Math.min(Math.max(page, 1), totalPages.value);
  }

  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    pageItems,
    next,
    prev,
    setPage,
  };
}
