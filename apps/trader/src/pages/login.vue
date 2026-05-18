<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ApiError } from '~/types/api';
import { useSession } from '~/composables/useSession';
import { createApiClient } from '~/utils/api-client';

definePageMeta({
  layout: 'blank',
});

interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  actor: string;
  role: 'operator' | 'viewer' | 'admin';
}

const route = useRoute();
const runtimeConfig = useRuntimeConfig();
const session = useSession();

const username = ref('');
const password = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

const apiBaseUrl = computed(() => {
  const configured = runtimeConfig.public.traderApiBaseUrl;
  return typeof configured === 'string' ? configured.trim() : '';
});

const redirectTarget = computed(() => {
  const redirect = route.query.redirect;
  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect;
  }

  return '/';
});

const canSubmit = computed(
  () =>
    apiBaseUrl.value.length > 0 &&
    username.value.trim().length > 0 &&
    password.value.length > 0 &&
    !isSubmitting.value,
);

const client = createApiClient({
  baseUrl: apiBaseUrl.value,
});

async function submit() {
  if (!canSubmit.value) {
    return;
  }

  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    const response = await client.request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: {
        username: username.value.trim(),
        password: password.value,
      },
    });

    session.setActor(response.actor);
    session.setRole(response.role);
    session.setToken(response.accessToken);

    await navigateTo(redirectTarget.value);
  } catch (error) {
    const apiError = error as Partial<ApiError>;
    errorMessage.value =
      typeof apiError.message === 'string'
        ? apiError.message
        : 'Unable to sign in with these credentials.';
    password.value = '';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <v-card width="480">
    <v-card-title class="text-h5">Operator Sign In</v-card-title>
    <v-card-text>
      <p class="text-body-1 mb-4">
        Sign in with the operator credentials configured in the trader backend.
      </p>

      <v-alert
        v-if="session.expired.value"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        Your previous session expired or is no longer valid.
      </v-alert>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ errorMessage }}
      </v-alert>

      <v-alert
        v-if="!apiBaseUrl"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        Trader API URL is not configured in runtime env.
      </v-alert>

      <form @submit.prevent="submit">
        <v-text-field
          v-model="username"
          label="Username"
          autocomplete="username"
          variant="outlined"
          class="mb-3"
        />

        <v-text-field
          v-model="password"
          label="Password"
          type="password"
          autocomplete="current-password"
          variant="outlined"
          class="mb-4"
        />

        <v-btn
          type="submit"
          color="primary"
          block
          :loading="isSubmitting"
          :disabled="!canSubmit"
        >
          Sign In
        </v-btn>
      </form>
    </v-card-text>
  </v-card>
</template>
