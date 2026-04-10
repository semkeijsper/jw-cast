<template>
  <Swiper
    :modules="modules"
    :slides-per-view="1"
    :space-between="24"
    :free-mode="true"
    :navigation="mdAndUp"
    :scrollbar="{ hide: false }"
    :breakpoints="{
      600: { slidesPerView: 2, slidesPerGroup: 2 },
      1264: { slidesPerView: 3, slidesPerGroup: 3, scrollbar: { hide: true } },
    }"
  >
    <SwiperSlide v-for="video in videos" :key="video.guid">
      <v-card rounded class="video-card mb-4" @click="onClickVideo(video)">
        <v-img :src="video.images.lss.lg" :aspect-ratio="2 / 1" cover>
          <div class="image-overlay d-flex align-end">
            <v-card-title class="text-white" style="word-break: normal; user-select: none;">
              {{ video.title }}
            </v-card-title>
          </div>
        </v-img>
      </v-card>
    </SwiperSlide>
  </Swiper>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Scrollbar, FreeMode } from 'swiper/modules';
import { useDisplay } from 'vuetify';
import type { Video } from '~/types';

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
</style>
