<template>
  <v-row>
    <v-col v-for="video in videos" :key="video.guid" sm="6" lg="4" xl="4" cols="12">
      <v-card hover ripple rounded @click="onClickVideo(video)">
        <v-img :src="video.images.lss.lg" class="align-end" :aspect-ratio="2 / 1" cover
          gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)">
          <v-card-title class="text-white" style="word-break: normal; user-select: none;">
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
