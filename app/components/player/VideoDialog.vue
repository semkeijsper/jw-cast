<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="smAndDown"
    :max-width="uiStore.transcriptPanel && !smAndDown ? '1240px' : '900px'"
    transition="dialog-bottom-transition"
  >
    <v-card v-if="uiStore.selectedVideo">
      <v-toolbar v-if="!(uiStore.transcriptExpanded && transcriptMobileOpen)" density="compact">
        <v-toolbar-title class="dialog-title">
          {{ `${uiStore.selectedVideo.title} (${uiStore.selectedVideo.durationFormattedHHMM})` }}
        </v-toolbar-title>

        <template #append>
          <VideoDownloadMenu :subtitle-url="subtitleUrl" :video-media="videoMedia" />

          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <!-- Loading state -->
      <v-responsive v-if="loading || !videoMedia" :aspect-ratio="16 / 9" class="player-frame">
        <v-container fill-height fluid>
          <v-row justify="center">
            <v-col class="d-flex justify-center">
              <v-progress-circular color="primary" indeterminate size="48" />
            </v-col>
          </v-row>
        </v-container>
      </v-responsive>

      <!-- Player -->
      <template v-else>
        <div
          class="player-row"
          :class="{
            'player-row--split': uiStore.transcriptPanel && !smAndDown,
            'player-row--hidden': uiStore.transcriptExpanded && transcriptMobileOpen,
          }"
        >
          <v-responsive :aspect-ratio="16 / 9" class="player-frame">
            <!-- Exclusive playback: while casting, the local player is torn
                 down and replaced by a placeholder; CastBar has the controls.
                 Plyr's destroy() swaps the <video> for an internal clone, so
                 the v-if must sit on a Vue-owned wrapper — never the Plyr
                 element itself — or the clone orphans on teardown. -->
            <div v-if="!castActive" class="player-host">
              <video
                ref="playerEl"
                class="player-video"
                controls
                crossorigin="anonymous"
                playsinline
                :poster="videoPoster"
              />
            </div>

            <v-img
              v-else
              class="cast-placeholder"
              cover
              height="100%"
              :src="videoPoster"
            >
              <div class="cast-placeholder-overlay d-flex flex-column align-center justify-center">
                <v-progress-circular v-if="isConnecting" color="white" indeterminate size="48" />

                <template v-else>
                  <v-icon color="white" size="56">mdi-cast-connected</v-icon>
                  <span v-if="castDeviceName" class="mt-2 text-body-1 text-white">{{ castDeviceName }}</span>
                </template>
              </div>
            </v-img>
          </v-responsive>

          <TranscriptPanel
            v-if="uiStore.transcriptPanel && !smAndDown"
            class="transcript-side"
            :current-time="transcriptTime"
            :vtt-url="subtitleUrl"
            @seek="onSeekTranscript"
          />
        </div>

        <TranscriptPanel
          v-if="transcriptMobileOpen"
          class="transcript-below"
          closable
          :current-time="transcriptTime"
          expandable
          :vtt-url="subtitleUrl"
          @seek="onSeekTranscript"
        />
      </template>

      <v-card-text v-if="!transcriptMobileOpen" class="px-3 pb-3 pt-0">
        <v-container class="pa-3">
          <v-row :no-gutters="xs">
            <v-col cols="12" sm="6">
              <LanguageSelect
                v-model="videoLanguage"
                class="mt-4"
                icon="mdi-volume-high"
                :items="availableLanguages"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <LanguageSelect
                v-model="subtitleLanguage"
                class="mt-4"
                icon="mdi-subtitles"
                :items="availableLanguages"
              />
            </v-col>
          </v-row>
        </v-container>

        <v-card-actions>
          <CastButton
            :start-time="localTime"
            :subtitle-media="subtitleMedia"
            :subtitle-url="subtitleUrl"
            :video-media="videoMedia"
          />

          <v-spacer />

          <TranscriptButton
            v-if="!landscapeMobile"
            :subtitle-media="subtitleMedia"
            :subtitle-url="subtitleUrl"
          />
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';

const languageStore = useLanguageStore();
const uiStore = useUiStore();
const { xs, smAndDown } = useDisplay();

const landscape = ref(false);
let landscapeQuery: MediaQueryList | null = null;
function onLandscapeChange(e: MediaQueryListEvent | MediaQueryList) {
  landscape.value = e.matches;
}
onMounted(() => {
  landscapeQuery = window.matchMedia('(orientation: landscape)');
  onLandscapeChange(landscapeQuery);
  landscapeQuery.addEventListener('change', onLandscapeChange);
});
onBeforeUnmount(() => landscapeQuery?.removeEventListener('change', onLandscapeChange));

const landscapeMobile = computed(() => smAndDown.value && landscape.value);
// Mobile transcript is only shown in portrait; landscape on a phone has no
// vertical room for a stacked panel, so it is hidden there
const transcriptMobileOpen = computed(
  () => uiStore.transcriptPanel && smAndDown.value && !landscape.value,
);

const {
  isCastConnected,
  isMediaLoaded,
  isConnecting,
  castDeviceName,
  castVideoKey,
  currentTime: castTime,
  seekTo: castSeekTo,
} = useCast();

const playerEl = ref<HTMLVideoElement | null>(null);

const { loading, videoMedia, subtitleMedia, captionUrl, subtitleUrl }
  = useMediaItems(() => captureResume());

// The cast session is global (one device), so mirror it in this dialog only
// when the media on the receiver is the video this dialog is showing —
// otherwise browsing to a different video inherits the cast placeholder, its
// controls, and the wrong (still-scrolling) transcript
const isCurrentCastTarget = computed(() =>
  !!uiStore.selectedVideo
  && castVideoKey.value === uiStore.selectedVideo.languageAgnosticNaturalKey,
);
const isCasting = computed(
  () => isCurrentCastTarget.value && isCastConnected.value && isMediaLoaded.value,
);
// Exclusive playback: from the moment this video's cast session starts
// connecting until it ends, the cast owns playback and the local player does
// not exist
const castActive = computed(
  () => isCurrentCastTarget.value && (isConnecting.value || isCasting.value),
);
const transcriptTime = computed(() => (isCasting.value ? castTime.value : localTime.value));

function onSeekTranscript(seconds: number) {
  if (isCasting.value) {
    castSeekTo(seconds);
  }
  else {
    playerSeekTo(seconds);
  }
}

const dialog = computed({
  get: () => uiStore.videoDialog,
  set: v => uiStore.setVideoDialog(v),
});

const videoLanguage = computed({
  get: () => languageStore.videoLanguageInfo.locale,
  set: (v: string) => {
    if (!v) {
      return;
    }
    languageStore.setVideoLanguage(v);
  },
});

const subtitleLanguage = computed({
  get: () => languageStore.subtitleLanguageInfo.locale,
  set: (v: string) => {
    if (!v) {
      return;
    }
    languageStore.setSubtitleLanguage(v);
  },
});

const videoPoster = computed(
  () => (uiStore.selectedVideo ?? videoMedia.value)?.images.wss.lg,
);

const availableLanguages = computed(() => {
  if (!uiStore.selectedVideo) {
    return [];
  }
  return languageStore.languages.filter(l =>
    uiStore.selectedVideo!.availableLanguages.includes(l.code),
  );
});

const {
  localTime,
  loadPlayer,
  captureResume,
  markResume,
  resetResume,
  seekTo: playerSeekTo,
  destroy: destroyPlayer,
} = usePlyrPlayer(playerEl, { videoMedia, captionUrl, subtitleUrl, poster: videoPoster });

// Track the cast position so local playback can resume there when it ends
let lastCastTime = 0;
watch(castTime, time => {
  if (isCasting.value && time > 0) {
    lastCastTime = time;
  }
});

// Exclusive playback: destroy the local player when casting takes over
// (the <video> is v-if'd out); rebuild it at the cast position when the
// cast ends while the dialog is still open
watch(castActive, active => {
  if (active) {
    destroyPlayer();
  }
  else if (uiStore.videoDialog) {
    markResume(lastCastTime);
    lastCastTime = 0;
    nextTick(() => loadPlayer());
  }
});

// Re-init player once media is loaded
watch(loading, async isLoading => {
  if (!isLoading) {
    await nextTick();
    loadPlayer();
  }
});

// Stop playback when the dialog closes (URL sync lives in useVideoRoute)
watch(
  () => uiStore.videoDialog,
  open => {
    if (!open) {
      destroyPlayer();
      uiStore.setTranscriptPanel(false);
    }
    else if (open && uiStore.selectedVideo) {
      // Reopening the same video remounts the dialog's <video> element without
      // any media watcher firing, so the player must be re-initialized here
      nextTick(() => loadPlayer());
    }
  },
);

// New video selected — close the transcript and forget the old position
// (media reloading itself is handled inside useMediaItems)
watch(
  () => uiStore.selectedVideo,
  video => {
    if (!video) {
      return;
    }
    uiStore.setTranscriptPanel(false);
    resetResume();
  },
);
</script>

<style>
.dialog-title {
  word-break: normal;
  user-select: none;
}
.player-host {
  height: 100%;
}
.player-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cast-placeholder {
  height: 100%;
}
.cast-placeholder-overlay {
  height: 100%;
  background: rgba(0, 0, 0, 0.55);
}
/* v-responsive defaults to flex: 1 0 auto; inside the fullscreen dialog's
   flex-column card it grows past its 16:9 sizer on tall mobile viewports,
   which makes the covered video look stretched. */
.player-frame {
  flex-grow: 0;
}
.player-row {
  --transcript-width: 340px;
  position: relative;
  flex-grow: 0;
}
.player-row--split .player-frame {
  width: calc(100% - var(--transcript-width));
}
.transcript-side {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--transcript-width);
}
.transcript-below {
  flex-grow: 1;
  min-height: 0;
}
.player-row--hidden {
  display: none;
}
.plyr {
  height: 100%;
  --plyr-font-size-xlarge: 36px;
  --plyr-font-size-large: 22px;
}
.plyr__poster {
  background-size: cover !important;
}
.plyr__control--transcript[aria-pressed='true'] {
  background: var(--plyr-video-control-background-hover, var(--plyr-color-main, #00b3ff));
  color: #fff;
}
@media (max-width: 959.98px) {
  /* smAndDown — hide if a resize crossed the breakpoint after injection */
  .plyr__control--transcript {
    display: none;
  }
}

/* .player-row is Plyr's fullscreen container (desktop), so Plyr's own
   .plyr:fullscreen sizing never applies; replicate the essentials. Cover both
   native fullscreen and Plyr's class-based fallback. */
.player-row:fullscreen,
.player-row.plyr--fullscreen-fallback {
  background: #000;
}
.player-row:fullscreen .player-frame,
.player-row.plyr--fullscreen-fallback .player-frame {
  width: 100%;
  height: 100%;
  max-height: 100%;
}
.player-row:fullscreen.player-row--split .player-frame,
.player-row.plyr--fullscreen-fallback.player-row--split .player-frame {
  width: calc(100% - var(--transcript-width));
}
.player-row:fullscreen .player-frame .v-responsive__sizer,
.player-row.plyr--fullscreen-fallback .player-frame .v-responsive__sizer {
  /* Inline padding-bottom from :aspect-ratio would letterbox at viewport height */
  padding-bottom: 0 !important;
}
.player-row:fullscreen .player-frame video,
.player-row.plyr--fullscreen-fallback .player-frame video {
  /* Inline object-fit: cover would crop on non-16:9 viewports */
  object-fit: contain !important;
}
.player-row:fullscreen .plyr__poster,
.player-row.plyr--fullscreen-fallback .plyr__poster {
  /* Match the video's object-fit: contain so the poster stays 16:9 */
  background-size: contain !important;
}
.player-row:fullscreen .transcript-side,
.player-row.plyr--fullscreen-fallback .transcript-side {
  /* Panel has no background of its own; without this it sits on black */
  background: rgb(var(--v-theme-surface));
}
</style>
