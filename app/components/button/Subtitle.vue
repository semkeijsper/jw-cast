<template>
  <v-menu location="top" transition="slide-y-reverse-transition">
    <template #activator="{ props }">
      <v-btn
        class="ml-2"
        color="primary"
        :disabled="subtitleUrl === null"
        :loading="!subtitleMedia"
        prepend-icon="mdi-download"
        :variant="subtitleUrl ? 'elevated' : 'outlined'"
        v-bind="props"
      >
        {{ store.translations.hdgSubtitles }}
      </v-btn>
    </template>

    <v-list v-if="subtitleMedia" density="compact">
      <v-list-item
        :href="subtitleUrl ?? undefined"
        prepend-icon="mdi-download"
        :title="store.translations.btnDownload"
      />

      <v-list-item
        prepend-icon="mdi-text"
        title="Transcript"
        @click="onOpenTranscript"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import type { Video } from '~/types';

defineProps<{
  subtitleMedia: Video | null;
  subtitleUrl: string | null;
}>();

const store = useAppStore();

function onOpenTranscript() {
  store.setTranscriptDialog(true);
}
</script>
