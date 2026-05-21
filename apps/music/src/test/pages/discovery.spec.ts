import { computed, defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AutocompleteSuggestionViewModel } from '~/types/music';

const staleAttemptedSearch = ref(true);
const resetSpy = vi.fn(() => {
  staleAttemptedSearch.value = false;
});
const clearBatchResultSpy = vi.fn();
const clearSelectionSpy = vi.fn();

vi.mock('~/composables/useSimilarDiscovery', () => ({
  useSimilarDiscovery: () => ({
    response: computed(() => null),
    items: computed(() => []),
    providerUsed: computed(() => null),
    searchId: computed(() => null),
    isLoading: computed(() => false),
    error: computed(() => null),
    errorKind: computed(() => null),
    lastInput: computed(() => null),
    hasAttemptedSearch: computed(() => staleAttemptedSearch.value),
    lastCompletedAt: computed(() => null),
    search: vi.fn(),
    retry: vi.fn(),
    setMode: vi.fn(),
    setReference: vi.fn(),
    clearResults: vi.fn(),
    reset: resetSpy,
  }),
}));

vi.mock('~/composables/useBatchIngestion', () => ({
  useBatchIngestion: () => ({
    lastResult: computed(() => null),
    isSubmitting: computed(() => false),
    error: computed(() => null),
    lastSubmittedAt: computed(() => null),
    submit: vi.fn(),
    clearResult: clearBatchResultSpy,
  }),
}));

vi.mock('~/composables/useSelection', () => ({
  useSelection: () => ({
    selectedReferences: computed(() => []),
    hasSelection: computed(() => false),
    clear: clearSelectionSpy,
  }),
}));

import DiscoveryPage from '~/pages/discovery.vue';

const selectedSuggestion: AutocompleteSuggestionViewModel = {
  title: 'around',
  artist: 'Daft Punk',
  sourceLabel: 'Last.fm',
  provider: 'lastfm',
  reference: {
    provider: 'lastfm',
    externalId: 'lastfm:seed',
    title: 'around',
    artist: 'Daft Punk',
    label: 'around',
  },
};

const TitleAutocompleteStub = defineComponent({
  emits: ['update:modelValue'],
  setup(_, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-testid': 'pick-suggestion',
          onClick: () => emit('update:modelValue', selectedSuggestion),
        },
        'Pick suggestion',
      );
  },
});

const SharedSectionHeaderStub = defineComponent({
  setup(_, { slots }) {
    return () =>
      h('div', [slots.default?.(), slots.actions ? slots.actions() : null]);
  },
});

const SharedEmptyStateStub = defineComponent({
  props: {
    title: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => h('div', { 'data-testid': 'empty-state' }, props.title);
  },
});

const SlotStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.());
  },
});

describe('discovery page', () => {
  beforeEach(() => {
    staleAttemptedSearch.value = true;
    resetSpy.mockClear();
    clearBatchResultSpy.mockClear();
    clearSelectionSpy.mockClear();
  });

  it('does not show the similar empty state when a new seed is selected before submit', async () => {
    const wrapper = mount(DiscoveryPage, {
      global: {
        stubs: {
          TitleAutocomplete: TitleAutocompleteStub,
          SimilarSearchForm: SlotStub,
          SelectionBar: SlotStub,
          SimilarResultsList: SlotStub,
          SharedSectionHeader: SharedSectionHeaderStub,
          SharedEmptyState: SharedEmptyStateStub,
          SharedLoadingSpinner: SlotStub,
          SharedErrorState: SlotStub,
          'v-row': SlotStub,
          'v-col': SlotStub,
          'v-chip': SlotStub,
          'v-card': SlotStub,
          'v-btn': SlotStub,
          'v-alert': SlotStub,
          'v-list': SlotStub,
          'v-list-item': SlotStub,
          'v-list-item-title': SlotStub,
          'v-list-item-subtitle': SlotStub,
        },
      },
    });

    expect(wrapper.text()).toContain('No discovery seed selected yet');

    await wrapper.get('[data-testid="pick-suggestion"]').trigger('click');
    await nextTick();

    expect(resetSpy).toHaveBeenCalledTimes(1);
    expect(clearBatchResultSpy).toHaveBeenCalledTimes(1);
    expect(clearSelectionSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).not.toContain('No discovery seed selected yet');
    expect(wrapper.text()).not.toContain('No similar tracks returned');
    expect(wrapper.findAll('[data-testid="empty-state"]')).toHaveLength(0);
  });
});
