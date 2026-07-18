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
      <VideoCard
        :src="video.images.lss.lg"
        :title="video.title"
        @click="onClickVideo(video)"
      />
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
