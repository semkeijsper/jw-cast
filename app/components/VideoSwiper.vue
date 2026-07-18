<template>
  <Swiper
    :breakpoints="{
      600: { slidesPerView: 2, slidesPerGroup: 2 },
      1264: { slidesPerView: 3, slidesPerGroup: 3, scrollbar: { hide: true } },
    }"
    :free-mode="true"
    :modules="modules"
    :navigation="mdAndUp"
    :scrollbar="{ hide: false }"
    :slides-per-view="1"
    :space-between="24"
  >
    <SwiperSlide v-for="video in videos" :key="video.guid">
      <v-card class="video-card mb-4" rounded @click="onClickVideo(video)">
        <v-img :aspect-ratio="2 / 1" cover :src="video.images.lss.lg">
          <div class="image-overlay d-flex align-end">
            <v-card-title class="video-title text-white">
              {{ video.title }}
            </v-card-title>
          </div>
        </v-img>
      </v-card>
    </SwiperSlide>
  </Swiper>
</template>

<script setup lang="ts">
import type { Video } from '~/types';
import { FreeMode, Navigation, Scrollbar } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { useDisplay } from 'vuetify';

defineProps<{ videos: Video[] }>();

const store = useAppStore();
const { mdAndUp } = useDisplay();

const modules = [Navigation, Scrollbar, FreeMode];

function onClickVideo(video: Video) {
  store.setSelectedVideo(video);
  store.setVideoDialog(true);
}
</script>

<style scoped>
.video-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.video-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
}
.image-overlay {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.55));
  height: 100%;
}
.video-title {
  flex: 1 1 auto;
  hyphens: none;
  overflow: visible;
  text-overflow: clip;
  user-select: none;
  white-space: normal;
}
</style>
