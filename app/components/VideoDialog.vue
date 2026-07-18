<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="smAndDown"
    max-width="900px"
    transition="dialog-bottom-transition"
  >
    <v-card v-if="store.selectedVideo">
      <v-toolbar density="compact">
        <v-toolbar-title style="word-break: normal; user-select: none;">
          {{ `${store.selectedVideo.title} (${store.selectedVideo.durationFormattedHHMM})` }}
        </v-toolbar-title>

        <template #append>
          <v-tooltip location="bottom" :text="store.translations.lnkHome">
            <template #activator="{ props }">
              <v-btn :href="jwOrgUrl" icon target="_blank" v-bind="props">
                <v-icon>mdi-open-in-new</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <!-- Loading state -->
      <v-responsive v-if="loading || !videoMedia" :aspect-ratio="16 / 9">
        <v-container fill-height fluid>
          <v-row justify="center">
            <v-col class="d-flex justify-center">
              <v-progress-circular color="primary" indeterminate size="48" />
            </v-col>
          </v-row>
        </v-container>
      </v-responsive>

      <!-- Player -->
      <v-responsive v-else :aspect-ratio="16 / 9">
        <video
          ref="playerEl"
          controls
          crossorigin="anonymous"
          playsinline
          :poster="videoPoster"
          style="width: 100%; height: 100%; object-fit: cover"
        />
      </v-responsive>

      <v-card-text class="px-3 pb-3 pt-0">
        <v-container class="pa-3">
          <v-row :no-gutters="xs">
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="videoLanguage"
                class="mt-4"
                density="compact"
                hide-details
                :item-title="languageLabel"
                item-value="locale"
                :items="availableLanguages"
                prepend-icon="mdi-volume-high"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="subtitleLanguage"
                class="mt-4"
                density="compact"
                hide-details
                :item-title="languageLabel"
                item-value="locale"
                :items="availableLanguages"
                prepend-icon="mdi-subtitles"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-container>

        <v-card-actions v-if="xs">
          <ButtonCast :subtitle-media="subtitleMedia" :subtitle-url="subtitleUrl" :video-media="videoMedia" />
        </v-card-actions>

        <v-card-actions>
          <template v-if="!xs">
            <ButtonCast :subtitle-media="subtitleMedia" :subtitle-url="subtitleUrl" :video-media="videoMedia" />
            <v-spacer />
          </template>

          <ButtonVideo :video-media="videoMedia" />
          <ButtonSubtitle :subtitle-media="subtitleMedia" :subtitle-url="subtitleUrl" />
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { Track } from 'plyr';
import type { Language, MediaFile, Video } from '~/types';
import { useDisplay } from 'vuetify';

const store = useAppStore();
const route = useRoute();
const router = useRouter();
const { xs, smAndDown } = useDisplay();

const playerEl = ref<HTMLVideoElement | null>(null);
let player: Plyr | undefined = undefined;

const loading = ref(true);
const videoMedia = ref<Video | null>(null);
const subtitleMedia = ref<Video | null>(null);

const dialog = computed({
  get: () => store.videoDialog,
  set: v => store.setVideoDialog(v),
});

const videoLanguage = computed({
  get: () => store.getVideoLanguage!.locale,
  set: (v: string) => {
    if (!v) {
      return;
    }
    store.setVideoLanguage(v);
  },
});

const subtitleLanguage = computed({
  get: () => store.getSubtitleLanguage!.locale,
  set: (v: string) => {
    if (!v) {
      return;
    }
    store.setSubtitleLanguage(v);
  },
});

const videoPoster = computed(
  () => (store.selectedVideo ?? videoMedia.value)?.images.wss.lg,
);

const jwOrgUrl = computed(() => {
  const { locale } = store.getSiteLanguage!;
  const { primaryCategory, languageAgnosticNaturalKey }
    = store.selectedVideo ?? videoMedia.value ?? {};
  return `https://www.jw.org/finder?locale=${locale}&category=${primaryCategory}&lank=${languageAgnosticNaturalKey}`;
});

const captionUrl = computed(() => {
  const found = videoMedia.value?.files.find(f => f?.subtitles?.url);
  return found?.subtitles?.url ?? null;
});

const subtitleUrl = computed(() => {
  const found = subtitleMedia.value?.files.find(f => f?.subtitles?.url);
  return found?.subtitles?.url ?? null;
});

const availableLanguages = computed(() => {
  if (!store.selectedVideo) {
    return [];
  }
  return store.languages.filter(l =>
    store.selectedVideo!.availableLanguages.includes(l.code),
  );
});

function languageLabel(item: Language): string {
  return item.name === item.vernacular ? item.name : `${item.name} (${item.vernacular})`;
}

function mediaUrl(language: Language): string {
  return `${store.mediatorUrl}/media-items/${language.code}/${store.selectedVideo?.languageAgnosticNaturalKey}?clientType=www`;
}

async function loadMediaItems() {
  loading.value = true;
  const requests: Promise<void>[] = [];

  if (!videoMedia.value) {
    requests.push(
      $fetch<{ media: Video[] }>(mediaUrl(store.getVideoLanguage!)).then(result => {
        const [media] = result.media;
        if (media) {
          videoMedia.value = media;
        }
        if (!store.selectedVideo && media) {
          store.setSelectedVideo(media);
        }
      }),
    );
  }
  if (!subtitleMedia.value) {
    requests.push(
      $fetch<{ media: Video[] }>(mediaUrl(store.getSubtitleLanguage!)).then(result => {
        const [media] = result.media;
        if (media) {
          subtitleMedia.value = media;
        }
      }),
    );
  }

  await Promise.allSettled(requests);
  loading.value = false;
}

async function loadPlayer() {
  if (!playerEl.value || !videoMedia.value) {
    return;
  }

  const { default: Plyr } = await import('plyr');
  if (player) {
    player.destroy();
  }

  const tracks: Track[] = [];
  if (captionUrl.value) {
    tracks.push({
      kind: 'captions',
      label: languageLabel(store.getVideoLanguage!),
      srcLang: store.getVideoLanguage!.locale,
      src: captionUrl.value,
    });
  }
  if (subtitleUrl.value) {
    tracks.push({
      kind: 'subtitles',
      label: languageLabel(store.getSubtitleLanguage!),
      srcLang: store.getSubtitleLanguage!.locale,
      src: subtitleUrl.value,
    });
  }

  player = new Plyr(playerEl.value, {
    quality: { default: 1080, options: [1080, 720, 480, 360, 240] },
    captions: { active: true, language: store.getSubtitleLanguage!.locale, update: true },
    // Few enough options that the settings menu can't soft-lock
    speed: { selected: 1, options: [0.75, 1, 1.25, 1.5] },
  });

  player.source = {
    type: 'video',
    poster: videoPoster.value,
    title: store.selectedVideo?.title,
    sources:
      videoMedia.value.files.map((f: MediaFile) => ({
        src: f.progressiveDownloadURL,
        type: f.mimetype,
        size: Number.parseInt(f.label.slice(0, -1), 10),
      })) ?? [],
    tracks,
  };
}

// Re-init player once media is loaded
watch(loading, async isLoading => {
  if (!isLoading) {
    await nextTick();
    loadPlayer();
  }
});

// Stop playback when dialog closes; update URL
watch(
  () => store.videoDialog,
  open => {
    if (!open) {
      player?.stop();
      const lang = route.params.language as string;
      if (route.params.videoId) {
        router.push(`/${lang}`);
      }
    }
    else if (open && store.selectedVideo) {
      const lang = route.params.language as string;
      const lank = store.selectedVideo.languageAgnosticNaturalKey;
      if (route.params.videoId !== lank) {
        router.push(`/${lang}/${lank}`);
      }
    }
  },
);

// New video selected — reset and reload
watch(
  () => store.selectedVideo,
  video => {
    if (!video) {
      return;
    }
    videoMedia.value = null;
    subtitleMedia.value = null;
    // Pre-fill from selectedVideo if language matches
    if (store.getSiteLanguage!.locale === store.getVideoLanguage!.locale) {
      videoMedia.value = video;
    }
    if (store.getSiteLanguage!.locale === store.getSubtitleLanguage!.locale) {
      subtitleMedia.value = video;
    }
    loadMediaItems();
  },
);

// Audio language changed
watch(
  () => store.videoLanguage,
  () => {
    videoMedia.value = null;
    loadMediaItems();
  },
);

// Subtitle language changed
watch(
  () => store.subtitleLanguage,
  () => {
    subtitleMedia.value = null;
    loadMediaItems();
  },
);
</script>

<style>
.plyr {
  height: 100%;
  --plyr-font-size-xlarge: 36px;
  --plyr-font-size-large: 22px;
}
.plyr__poster {
  background-size: cover !important;
}
</style>
