<script setup lang="ts">
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts';

const keyboard = useKeyboardShortcuts();
</script>

<template>
  <v-dialog v-model="keyboard.helpOpen.value" max-width="560">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Keyboard Shortcuts</span>
        <v-btn variant="text" size="small" @click="keyboard.closeHelp()">
          Close
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-list density="comfortable">
          <v-list-item
            v-for="shortcut in keyboard.shortcuts.value"
            :key="shortcut.id"
          >
            <template #title>
              <div class="d-flex align-center justify-space-between ga-4">
                <span>{{ shortcut.description }}</span>
                <v-chip size="small" variant="tonal">{{ shortcut.label }}</v-chip>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>