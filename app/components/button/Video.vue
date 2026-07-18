<template>
  <v-menu location="top" transition="slide-y-reverse-transition">
    <template #activator="{ props }">
      <v-btn
        color="primary"
        :loading="!videoMedia"
        prepend-icon="mdi-download"
        variant="elevated"
        v-bind="props"
      >
        {{ store.translations.btnSearchFilterVideo }}
      </v-btn>
    </template>

    <v-list v-if="videoMedia" density="compact">
      <v-list-item
        v-for="file in filteredFiles"
        :key="file.checksum"
        :href="file.progressiveDownloadURL"
        prepend-icon="mdi-download"
        :title="`${file.label} (${Math.floor(file.filesize / 1048576)} MB)`"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import type { Video } from '~/types';

const props = defineProps<{
  videoMedia: Video | null;
}>();

const store = useAppStore();

const filteredFiles = computed(
  () => props.videoMedia?.files.filter(f => f.label !== '144p') ?? [],
);
</script>
