import { createVuetify } from 'vuetify';
import {
  VAlert,
  VApp,
  VAppBar,
  VBtn,
  VBtnToggle,
  VCard,
  VCardActions,
  VCardSubtitle,
  VCardText,
  VCardTitle,
  VChip,
  VCol,
  VContainer,
  VDialog,
  VDivider,
  VFileInput,
  VForm,
  VList,
  VListItem,
  VListItemSubtitle,
  VListItemTitle,
  VListSubheader,
  VMain,
  VNavigationDrawer,
  VProgressCircular,
  VRow,
  VSelect,
  VSheet,
  VSnackbar,
  VSpacer,
  VSwitch,
  VTextField,
  VToolbarTitle,
} from 'vuetify/components';
import * as directives from 'vuetify/directives';

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    type IdleScheduler = typeof globalThis & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout?: number },
      ) => number;
    };

    const scheduler = globalThis as IdleScheduler;
    const loadMdiStyles = () => {
      void import('@mdi/font/css/materialdesignicons.css');
    };

    if (typeof scheduler.requestIdleCallback === 'function') {
      scheduler.requestIdleCallback(loadMdiStyles, { timeout: 2000 });
    } else {
      globalThis.setTimeout(loadMdiStyles, 0);
    }
  }

  const vuetify = createVuetify({
    components: {
      VAlert,
      VApp,
      VAppBar,
      VBtn,
      VBtnToggle,
      VCard,
      VCardActions,
      VCardSubtitle,
      VCardText,
      VCardTitle,
      VChip,
      VCol,
      VContainer,
      VDialog,
      VDivider,
      VFileInput,
      VForm,
      VList,
      VListItem,
      VListItemSubtitle,
      VListItemTitle,
      VListSubheader,
      VMain,
      VNavigationDrawer,
      VProgressCircular,
      VRow,
      VSelect,
      VSheet,
      VSnackbar,
      VSpacer,
      VSwitch,
      VTextField,
      VToolbarTitle,
    },
    directives,
    defaults: {
      VCard: {
        rounded: 'lg',
        elevation: 0,
      },
      VBtn: {
        rounded: 'lg',
      },
      VChip: {
        rounded: 'lg',
      },
      VTextField: {
        variant: 'outlined',
        density: 'compact',
        color: 'primary',
      },
      VSelect: {
        variant: 'outlined',
        density: 'compact',
        color: 'primary',
      },
    },
    theme: {
      defaultTheme: 'musicOperator',
      themes: {
        musicOperator: {
          dark: true,
          colors: {
            primary: '#61dafb',
            secondary: '#ffc857',
            accent: '#8be9fd',
            info: '#84d2f6',
            success: '#4dd599',
            warning: '#ffc857',
            error: '#ff6b6b',
            background: '#08111a',
            surface: '#0f1b28',
            'surface-bright': '#162635',
            'surface-variant': '#1d2f40',
            'on-background': '#edf6fb',
            'on-surface': '#edf6fb',
          },
        },
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});
