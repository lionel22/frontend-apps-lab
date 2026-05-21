<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSession } from '~/composables/useSession';

definePageMeta({
  layout: 'blank',
});

const route = useRoute();
const session = useSession();

const actor = ref(session.actor.value);
const token = ref(session.token.value ?? '');
const isSubmitting = ref(false);

const redirectTarget = computed(() => {
  const redirect = route.query.redirect;
  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect;
  }

  return '/';
});

const canSubmit = computed(
  () => !session.requireAuth.value || token.value.trim().length > 0,
);

async function submit() {
  if (!canSubmit.value || isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;

  try {
    if (session.requireAuth.value) {
      session.setSession({
        actor: actor.value.trim() || 'music-operator',
        token: token.value.trim(),
      });
    }

    await navigateTo(redirectTarget.value);
  } finally {
    isSubmitting.value = false;
  }
}

function clearToken() {
  session.clearSession();
  token.value = '';
}
</script>

<template>
  <v-card width="520">
    <v-card-title>Shared Operator Session</v-card-title>
    <v-card-text>
      <p class="text-body-1 mb-4">
        Capture the shared bearer token once when this environment requires auth. The value is persisted in a lightweight frontend session and attached to all music API calls.
      </p>

      <v-alert
        v-if="session.expired.value"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        Your previous token was rejected or expired.
      </v-alert>

      <v-alert
        v-if="!session.requireAuth.value"
        type="info"
        variant="tonal"
        class="mb-4"
      >
        This environment does not require auth. Continue directly to the shell.
      </v-alert>

      <form @submit.prevent="submit">
        <v-text-field
          v-model="actor"
          label="Operator label"
          autocomplete="nickname"
          class="mb-3"
        />

        <v-text-field
          v-if="session.requireAuth.value"
          v-model="token"
          label="Bearer token"
          type="password"
          autocomplete="off"
          class="mb-4"
        />

        <div class="d-flex align-center justify-end ga-2">
          <v-btn
            v-if="session.token.value"
            variant="text"
            @click="clearToken"
          >
            Clear token
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            :loading="isSubmitting"
            :disabled="!canSubmit"
          >
            {{ session.requireAuth.value ? 'Save session' : 'Continue' }}
          </v-btn>
        </div>
      </form>
    </v-card-text>
  </v-card>
</template>
