<template>
  <v-btn
    class="ml-2"
    color="primary"
    :disabled="subtitleUrl === null"
    :loading="!subtitleMedia"
    :prepend-icon="store.transcriptDialog ? 'mdi-arrow-left' : 'mdi-script-text-outline'"
    :variant="store.transcriptDialog ? 'outlined' : 'elevated'"
    @click="store.setTranscriptDialog(!store.transcriptDialog)"
  >
    Transcript
  </v-btn>
</template>

<script setup lang="ts">
import type { Video } from '~/types';

defineProps<{
  subtitleMedia: Video | null;
  subtitleUrl: string | null;
}>();

const store = useAppStore();
</script>
