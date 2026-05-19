import { createVuetify } from 'vuetify';
import {
  VAlert,
  VApp,
  VAppBar,
  VAvatar,
  VBadge,
  VBtn,
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
  VList,
  VListItem,
  VListItemTitle,
  VListSubheader,
  VMain,
  VMenu,
  VNavigationDrawer,
  VProgressCircular,
  VProgressLinear,
  VRow,
  VSelect,
  VSheet,
  VSnackbar,
  VSpacer,
  VTable,
  VTextField,
  VTextarea,
  VToolbarTitle,
  VTooltip,
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
      VAvatar,
      VBadge,
      VBtn,
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
      VList,
      VListItem,
      VListItemTitle,
      VListSubheader,
      VMain,
      VMenu,
      VNavigationDrawer,
      VProgressCircular,
      VProgressLinear,
      VRow,
      VSelect,
      VSheet,
      VSnackbar,
      VSpacer,
      VTable,
      VTextField,
      VTextarea,
      VToolbarTitle,
      VTooltip,
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
      VTextarea: {
        variant: 'outlined',
        color: 'primary',
      },
      VTable: {
        density: 'comfortable',
        hover: true,
      },
    },
    theme: {
      defaultTheme: 'operatorDark',
      themes: {
        operatorDark: {
          dark: true,
          colors: {
            primary: '#00e5ff',
            secondary: '#7c4dff',
            accent: '#00bfa5',
            info: '#448aff',
            success: '#00e676',
            warning: '#ffab00',
            error: '#ff1744',
            background: '#0a0e17',
            surface: '#111827',
            'surface-bright': '#1a2332',
            'surface-variant': '#151d2b',
            'on-background': '#e2e8f0',
            'on-surface': '#e2e8f0',
          },
        },
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});
