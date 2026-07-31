<template>
  <v-btn
    class="ml-2"
    :color="subtitleUrl ? 'primary' : undefined"
    :disabled="subtitleUrl === null"
    :loading="loading"
    :prepend-icon="uiStore.transcriptPanel ? 'mdi-arrow-left' : 'mdi-script-text-outline'"
    :variant="uiStore.transcriptPanel ? 'outlined' : 'elevated'"
    @click="uiStore.setTranscriptPanel(!uiStore.transcriptPanel)"
  >
    {{ languageStore.t('transcript') }}
  </v-btn>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean;
  subtitleUrl: string | null;
}>();

const languageStore = useLanguageStore();
const uiStore = useUiStore();
</script>
