import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSession } from '~/composables/useSession';

const validateOperatorSessionMock = vi.fn();

vi.mock('~/composables/useMusicApi', () => ({
  useMusicApi: () => ({
    validateOperatorSession: validateOperatorSessionMock,
  }),
}));

import LoginPage from '~/pages/login.vue';

const SlotStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const VTextFieldStub = defineComponent({
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'text',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        'data-testid': props.label === 'Bearer token' ? 'bearer-token' : 'operator-label',
        value: props.modelValue,
        type: props.type,
        onInput: (event: Event) => {
          emit('update:modelValue', (event.target as HTMLInputElement).value);
        },
      });
  },
});

const VBtnStub = defineComponent({
  props: {
    type: {
      type: String,
      default: 'button',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
  setup(props, { emit, slots }) {
    return () =>
      h(
        'button',
        {
          type: props.type,
          disabled: props.disabled,
          onClick: () => emit('click'),
        },
        slots.default?.(),
      );
  },
});

describe('login page', () => {
  beforeEach(() => {
    validateOperatorSessionMock.mockReset();
    globalThis.useRuntimeConfig = (() => ({
      public: {
        musicApiBaseUrl: 'http://localhost:4000',
        musicPollingIntervalDefault: 15000,
        musicRequireAuth: true,
        musicAuthStorageKey: 'music.operator.session',
      },
    })) as typeof globalThis.useRuntimeConfig;
    globalThis.useRoute = (() => ({
      query: {},
    })) as typeof globalThis.useRoute;
  });

  it('does not open the app when the bearer token is rejected', async () => {
    validateOperatorSessionMock.mockRejectedValueOnce(
      new Error('Invalid operator token'),
    );

    const wrapper = mount(LoginPage, {
      global: {
        stubs: {
          'v-card': SlotStub,
          'v-card-title': SlotStub,
          'v-card-text': SlotStub,
          'v-alert': SlotStub,
          'v-text-field': VTextFieldStub,
          'v-btn': VBtnStub,
        },
      },
    });

    await wrapper.get('[data-testid="bearer-token"]').setValue('bad-token');
    await wrapper.get('form').trigger('submit.prevent');

    const session = useSession();

    expect(validateOperatorSessionMock).toHaveBeenCalledWith('bad-token');
    expect(globalThis.navigateTo).not.toHaveBeenCalled();
    expect(session.isAuthenticated.value).toBe(false);
    expect(wrapper.text()).toContain('Invalid operator token');
  });

  it('persists the session only after the bearer token is accepted', async () => {
    validateOperatorSessionMock.mockResolvedValueOnce(undefined);

    const wrapper = mount(LoginPage, {
      global: {
        stubs: {
          'v-card': SlotStub,
          'v-card-title': SlotStub,
          'v-card-text': SlotStub,
          'v-alert': SlotStub,
          'v-text-field': VTextFieldStub,
          'v-btn': VBtnStub,
        },
      },
    });

    await wrapper.get('[data-testid="bearer-token"]').setValue('good-token');
    await wrapper.get('form').trigger('submit.prevent');

    const session = useSession();

    expect(validateOperatorSessionMock).toHaveBeenCalledWith('good-token');
    expect(session.isAuthenticated.value).toBe(true);
    expect(session.token.value).toBe('good-token');
    expect(globalThis.navigateTo).toHaveBeenCalledWith('/');
  });
});
