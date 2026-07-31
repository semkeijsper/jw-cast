<template>
  <v-menu location="top" transition="slide-y-reverse-transition">
    <template #activator="{ props: menuProps }">
      <v-tooltip location="right" :text="tooltipText">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            class="mr-2"
            color="primary"
            :disabled="!castAvailable || !videoMedia"
            :loading="loading || isAwaitingDevice"
            prepend-icon="mdi-cast"
            variant="elevated"
            v-bind="{ ...menuProps, ...tooltipProps }"
          >
            {{ languageStore.t('btnPlay') }}
          </v-btn>
        </template>
      </v-tooltip>
    </template>

    <v-list v-if="videoMedia" density="compact">
      <v-list-subheader>{{ languageStore.t('chromecast') }}</v-list-subheader>

      <v-list-item
        v-for="file in downloadableFiles(videoMedia).reverse()"
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
  loading: boolean;
  subtitleUrl: string | null;
  /** Local playback position — the cast starts here (handoff) */
  startTime?: number;
}>();

const languageStore = useLanguageStore();
const uiStore = useUiStore();
const { isAvailable: castAvailable, isAwaitingDevice, castMedia } = useCast();

const tooltipText = computed(() =>
  props.subtitleUrl
    ? languageStore.t('btnPlayWithSubtitles')
    : languageStore.t('btnPlayWithoutSubtitles'),
);

async function onSelectFile(file: MediaFile) {
  const title = uiStore.selectedVideo?.title ?? '';
  await castMedia(
    file.progressiveDownloadURL,
    title,
    props.subtitleUrl,
    props.startTime,
    uiStore.selectedVideo,
  );
}
</script>
