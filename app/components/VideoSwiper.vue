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
      <VideoCard
        class="mb-4"
        :src="video.images.lss.lg"
        :title="video.title"
        @click="onClickVideo(video)"
      />
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
