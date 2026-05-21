import { computed } from 'vue';
import {
  buildSuggestionReferenceKey,
  type SuggestionReference,
} from '~/types/music';
import { useMusicStore } from '~/stores/music';

export function useSelection() {
  const music = useMusicStore();

  function isSelected(reference: SuggestionReference): boolean {
    return music.selectedReferenceKeys.includes(
      buildSuggestionReferenceKey(reference),
    );
  }

  function toggle(reference: SuggestionReference) {
    music.toggleSelectedReference(reference);
  }

  function clear() {
    music.clearSelection();
  }

  function selectMany(references: SuggestionReference[]) {
    music.replaceSelection(references);
  }

  return {
    selectedKeys: computed(() => music.selectedReferenceKeys),
    selectedReferences: computed(() => music.selectedReferences),
    hasSelection: computed(() => music.hasSelection),
    buildKey: buildSuggestionReferenceKey,
    isSelected,
    toggle,
    clear,
    selectMany,
  };
}
