import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

export interface KeyboardShortcutDefinition {
  id: string;
  key: string;
  label: string;
  description: string;
  system?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  allowInInput?: boolean;
  isEnabled?: () => boolean;
  handler: () => void | Promise<void>;
}

const shortcutRegistry = new Map<string, KeyboardShortcutDefinition>();
const shortcutVersion = ref(0);
let listenerAttached = false;
let consumerCount = 0;

function bumpShortcutVersion() {
  shortcutVersion.value += 1;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    target.isContentEditable ||
    Boolean(target.closest('[contenteditable="true"]'))
  );
}

function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcutDefinition) {
  const normalizedKey = event.key.toLowerCase();
  if (normalizedKey !== shortcut.key.toLowerCase()) {
    return false;
  }

  if (shortcut.system) {
    if (!(event.ctrlKey || event.metaKey)) {
      return false;
    }
  } else {
    if ((shortcut.ctrl ?? false) !== event.ctrlKey) {
      return false;
    }

    if ((shortcut.meta ?? false) !== event.metaKey) {
      return false;
    }
  }

  if ((shortcut.shift ?? false) !== event.shiftKey) {
    return false;
  }

  if ((shortcut.alt ?? false) !== event.altKey) {
    return false;
  }

  if (!shortcut.allowInInput && isTypingTarget(event.target)) {
    return false;
  }

  if (shortcut.isEnabled && !shortcut.isEnabled()) {
    return false;
  }

  return true;
}

function handleShortcutKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented) {
    return;
  }

  if (
    event.key === '?' &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !isTypingTarget(event.target)
  ) {
    const helpOpen = useState<boolean>('trader.shortcuts.help-open', () => false);
    helpOpen.value = !helpOpen.value;
    event.preventDefault();
    return;
  }

  for (const shortcut of shortcutRegistry.values()) {
    if (!matchesShortcut(event, shortcut)) {
      continue;
    }

    event.preventDefault();
    void shortcut.handler();
    return;
  }
}

function attachListener() {
  if (!import.meta.client || listenerAttached) {
    return;
  }

  window.addEventListener('keydown', handleShortcutKeydown);
  listenerAttached = true;
}

function detachListener() {
  if (!import.meta.client || !listenerAttached) {
    return;
  }

  window.removeEventListener('keydown', handleShortcutKeydown);
  listenerAttached = false;
}

export function useKeyboardShortcuts() {
  const helpOpen = useState<boolean>('trader.shortcuts.help-open', () => false);

  const shortcuts = computed(() => {
    shortcutVersion.value;

    return [
      {
        id: 'shortcut-help',
        label: '?',
        description: 'Toggle the keyboard shortcuts overlay',
      },
      ...Array.from(shortcutRegistry.values()).map((shortcut) => ({
        id: shortcut.id,
        label: shortcut.label,
        description: shortcut.description,
      })),
    ];
  });

  function registerShortcut(shortcut: KeyboardShortcutDefinition) {
    shortcutRegistry.set(shortcut.id, shortcut);
    bumpShortcutVersion();

    return () => {
      if (shortcutRegistry.delete(shortcut.id)) {
        bumpShortcutVersion();
      }
    };
  }

  function useShortcut(shortcut: KeyboardShortcutDefinition) {
    let unregister: (() => void) | null = null;

    onMounted(() => {
      consumerCount += 1;
      attachListener();
      unregister = registerShortcut(shortcut);
    });

    onBeforeUnmount(() => {
      unregister?.();
      unregister = null;
      consumerCount = Math.max(0, consumerCount - 1);
      if (consumerCount === 0) {
        detachListener();
      }
    });
  }

  return {
    shortcuts,
    helpOpen,
    openHelp: () => {
      helpOpen.value = true;
    },
    closeHelp: () => {
      helpOpen.value = false;
    },
    toggleHelp: () => {
      helpOpen.value = !helpOpen.value;
    },
    registerShortcut,
    useShortcut,
  };
}
