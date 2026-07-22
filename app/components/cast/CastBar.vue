<template>
  <v-slide-y-reverse-transition>
    <v-card
      v-if="isActive || isConnecting"
      class="cast-bar"
      :class="{ 'cast-bar-desktop': mdAndUp }"
      elevation="8"
    >
      <div class="d-flex align-center px-4 pt-2">
        <v-progress-circular
          v-if="isConnecting"
          class="mr-2"
          color="primary"
          indeterminate
          size="16"
          width="2"
        />

        <v-icon
          v-else
          class="mr-2"
          color="primary"
          icon="mdi-cast-connected"
          size="small"
        />

        <div class="text-truncate text-body-2">
          <span class="font-weight-medium">{{ castTitle }}</span>
          <span v-if="castDeviceName" class="text-medium-emphasis"> &middot; {{ castDeviceName }}</span>
        </div>

        <v-spacer />

        <v-btn
          density="comfortable"
          icon="mdi-cast-off"
          size="small"
          variant="text"
          @click="stopCasting"
        />
      </div>

      <div v-if="isConnecting" class="d-flex align-center px-4 seek-row">
        <v-progress-linear color="primary" indeterminate rounded />
      </div>

      <div v-else class="d-flex align-center px-4 seek-row">
        <span class="time-label text-caption text-medium-emphasis">{{ formatTime(displayTime) }}</span>

        <v-slider
          class="mx-3"
          color="primary"
          density="compact"
          :disabled="!canSeek"
          hide-details
          :max="duration || 1"
          :min="0"
          :model-value="displayTime"
          @end="onSeekEnd"
          @start="onSeekStart"
          @update:model-value="onSeekInput"
        />

        <span class="time-label text-caption text-medium-emphasis">{{ formatTime(duration) }}</span>
      </div>

      <div class="d-flex align-center px-4 pb-2">
        <v-btn
          density="comfortable"
          :disabled="!canSeek"
          icon="mdi-rewind-10"
          variant="text"
          @click="skip(-10)"
        />

        <v-btn
          density="comfortable"
          :disabled="!canPause"
          :icon="isPaused ? 'mdi-play' : 'mdi-pause'"
          variant="text"
          @click="togglePlay"
        />

        <v-btn
          density="comfortable"
          :disabled="!canSeek"
          icon="mdi-fast-forward-10"
          variant="text"
          @click="skip(10)"
        />

        <v-btn
          v-if="hasCaptions"
          :color="captionsEnabled ? 'primary' : undefined"
          density="comfortable"
          :icon="captionsEnabled ? 'mdi-closed-caption' : 'mdi-closed-caption-outline'"
          variant="text"
          @click="toggleCaptions"
        />

        <v-spacer />

        <v-btn
          density="comfortable"
          :icon="isMuted ? 'mdi-volume-off' : 'mdi-volume-high'"
          size="small"
          variant="text"
          @click="toggleMute"
        />

        <v-slider
          class="volume-slider flex-grow-0 ml-1"
          color="primary"
          density="compact"
          hide-details
          :max="1"
          :min="0"
          :model-value="isMuted ? 0 : volumeLevel"
          :step="0.05"
          @update:model-value="setVolume"
        />
      </div>
    </v-card>
  </v-slide-y-reverse-transition>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';

const { mdAndUp } = useDisplay();
const playback = usePlaybackStore();
const {
  isMuted,
  volumeLevel,
  canSeek,
  canPause,
  castDeviceName,
  castTitle,
  hasCaptions,
  captionsEnabled,
  togglePlay,
  toggleMute,
  setVolume,
  seekTo,
  skip,
  toggleCaptions,
  stopCasting,
} = useCast();

// Session fields (position, duration, paused, connecting/active) come from the
// playback store's cast slice; the device/config fields above stay on useCast
const isConnecting = computed(() => playback.cast.kind === 'connecting');
const isActive = computed(() => playback.cast.kind === 'active');
const isPaused = computed(() => (playback.cast.kind === 'active' ? playback.cast.paused : false));
const currentTime = computed(() => (playback.cast.kind === 'active' ? playback.cast.position : 0));
const duration = computed(() => (playback.cast.kind === 'active' ? playback.cast.duration : 0));

// While the user drags the seek slider, show the drag position instead of
// the (still updating) playback position; only seek on release. After release,
// keep showing the target position until the receiver reports a playback
// position near it — otherwise the slider bounces back for a moment.
const seeking = ref(false);
const seekPosition = ref(0);
const pendingSeek = ref<number | null>(null);

const displayTime = computed(() => {
  if (seeking.value) {
    return seekPosition.value;
  }
  return pendingSeek.value ?? currentTime.value;
});

watch(currentTime, time => {
  if (pendingSeek.value !== null && Math.abs(time - pendingSeek.value) < 3) {
    pendingSeek.value = null;
  }
});

function onSeekStart(value: number) {
  seeking.value = true;
  seekPosition.value = value;
}

function onSeekInput(value: number) {
  if (seeking.value) {
    seekPosition.value = value;
  }
}

function onSeekEnd(value: number) {
  seeking.value = false;
  pendingSeek.value = value;
  seekTo(value);
  // Failsafe: never show a stale target for more than a few seconds
  setTimeout(() => {
    pendingSeek.value = null;
  }, 5000);
}
</script>

<style scoped>
.cast-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  /* Above Vuetify overlays (~2400) so the bar stays visible over the
     fullscreen video dialog, where casting is started from */
  z-index: 10000;
  border-radius: 0;
}

.seek-row {
  min-height: 32px;
}

.cast-bar-desktop {
  left: 50%;
  right: auto;
  transform: translateX(-50%);
  bottom: 16px;
  width: 600px;
  max-width: calc(100vw - 32px);
  border-radius: 8px;
}

.time-label {
  min-width: 40px;
  text-align: center;
  user-select: none;
}

.volume-slider {
  width: 96px;
}
</style>
