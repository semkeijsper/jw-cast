<template>
  <v-menu location="top" transition="slide-y-reverse-transition">
    <template #activator="{ props: menuProps }">
      <v-tooltip location="right" :text="tooltipText">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            class="mr-2"
            color="primary"
            :disabled="!castAvailable"
            :loading="!videoMedia || !subtitleMedia"
            prepend-icon="mdi-cast"
            v-bind="{ ...menuProps, ...tooltipProps }"
          >
            {{ store.translations.btnPlay }}
          </v-btn>
        </template>
      </v-tooltip>
    </template>

    <v-list v-if="videoMedia" density="compact">
      <v-list-subheader>Chromecast</v-list-subheader>

      <v-list-item
        v-for="file in filteredFiles"
        :key="file.checksum"
        prepend-icon="mdi-cast"
        :title="file.label"
        @click="onSelectFile(file)"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import type { MediaFile, Video } from '~/types';

const props = defineProps<{
  videoMedia: Video | null;
  subtitleMedia: Video | null;
  subtitleUrl: string | null;
}>();

const store = useAppStore();
const { isAvailable: castAvailable, castMedia } = useCast();

const filteredFiles = computed(
  () => props.videoMedia?.files.filter(f => f.label !== '144p') ?? [],
);

const tooltipText = computed(() =>
  props.subtitleUrl
    ? store.translations.btnPlayWithSubtitles
    : store.translations.btnPlayWithoutSubtitles,
);

async function onSelectFile(file: MediaFile) {
  const title = store.selectedVideo?.title ?? '';
  await castMedia(file.progressiveDownloadURL, title, props.subtitleUrl);
}
</script>
