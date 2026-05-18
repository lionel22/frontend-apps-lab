<script setup lang="ts">
definePageMeta({
  layout: 'blank',
});

const session = useSession();
</script>

<template>
  <v-card width="520">
    <v-card-title class="text-h5">
      Protected Session Required
    </v-card-title>
    <v-card-text class="text-body-1">
      This operator environment requires authenticated access to guarded trader endpoints.
      Configure a valid token or authenticated session and reload this page.
      <div class="mt-4 text-caption text-medium-emphasis">
        Current actor: {{ session.actor }}
      </div>
    </v-card-text>
  </v-card>
</template>