<template>
  <v-slide-y-reverse-transition>
    <v-card
      v-if="isCastConnected && isMediaLoaded"
      class="cast-bar"
      :class="{ 'cast-bar-desktop': mdAndUp }"
      elevation="8"
    >
      <div class="d-flex align-center px-4 pt-2">
        <v-icon class="mr-2" color="primary" icon="mdi-cast-connected" size="small" />

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

      <div class="d-flex align-center px-4">
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
const {
  isCastConnected,
  isMediaLoaded,
  isPaused,
  isMuted,
  volumeLevel,
  currentTime,
  duration,
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

// While the user drags the seek slider, show the drag position instead of
// the (still updating) playback position; only seek on release.
const seeking = ref(false);
const seekPosition = ref(0);

const displayTime = computed(() => (seeking.value ? seekPosition.value : currentTime.value));

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
  seekTo(value);
}

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const paddedSeconds = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}
</script>

<style scoped>
.cast-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  border-radius: 0;
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
