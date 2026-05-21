<script setup lang="ts">
import { ref } from 'vue';

const dialogOpen = ref(false);

function openDialog() {
  dialogOpen.value = true;
}

function closeDialog() {
  dialogOpen.value = false;
}
</script>

<template>
  <div>
    <SharedSectionHeader
      kicker="Organize"
      title="Dry-run first organization flow"
      description="Sequence 0 locks in the dry-run and apply contract shape so the later workflow can stay summary-first and safe by default."
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          @click="openDialog"
        >
          Review apply guard
        </v-btn>
      </template>
    </SharedSectionHeader>

    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <SharedSuccessState
          title="Normalization placeholders ready"
          message="`useMusicApi.organize` already distinguishes `dryRun=true` from `dryRun=false` and maps both summary and detail sections into stable frontend models."
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <SharedEmptyState
          title="No diff rendered yet"
          message="Sequence 3 will add the actual rule form, dry-run diff cards, conflict lists, and explicit apply confirmation gating."
        />
      </v-col>
    </v-row>

    <SharedConfirmDialog
      v-model="dialogOpen"
      title="Dry-run guard"
      message="The real apply action remains blocked until a successful reviewed dry-run snapshot exists. This placeholder only validates the shared dialog primitive."
      confirm-text="Understood"
      @confirm="closeDialog"
      @cancel="closeDialog"
    />
  </div>
</template>
