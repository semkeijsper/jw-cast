<template>
  <v-row>
    <v-col
      v-for="video in videos"
      :key="video.guid"
      cols="12"
      lg="4"
      sm="6"
      xl="4"
    >
      <v-card hover ripple rounded @click="onClickVideo(video)">
        <v-img
          :aspect-ratio="2 / 1"
          class="align-end"
          cover
          gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
          :src="video.images.lss.lg"
        >
          <v-card-title class="video-title text-white">
            {{ video.title }}
          </v-card-title>
        </v-img>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { Video } from '~/types';

defineProps<{ videos: Video[] }>();

const store = useAppStore();

function onClickVideo(video: Video) {
  store.setSelectedVideo(video);
  store.setVideoDialog(true);
}
</script>

<style scoped>
.video-title {
  hyphens: none;
  overflow: visible;
  text-overflow: clip;
  user-select: none;
  white-space: normal;
}
</style>
