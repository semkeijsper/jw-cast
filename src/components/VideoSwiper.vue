<template>
  <Swiper :options="swiperOptions">
    <SwiperSlide v-for="video in videos" :key="video.guid">
      <v-card hover ripple rounded @click="onClickVideo(video)" class="mb-4">
        <v-img
          :src="video.images.lss.lg"
          :aspect-ratio="2 / 1"
          class="white--text align-end"
          gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
        >
          <v-card-title
            v-text="video.title"
            style="word-break: normal; user-select: none;"
          ></v-card-title>
        </v-img>
      </v-card>
    </SwiperSlide>
    <div v-if="mdAndUp" class="swiper-button-prev swiper-button-white" slot="button-prev"></div>
    <div v-if="mdAndUp" class="swiper-button-next swiper-button-white" slot="button-next"></div>
    <div class="swiper-scrollbar" slot="scrollbar"></div>
  </Swiper>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Mutation } from 'vuex-class';

import { Video } from '@/types';

@Component
export default class VideoSwiper extends Vue {
  @Prop({ required: true })
  videos!: Video[];

  swiperOptions = {
    slidesPerView: 'auto',
    freeMode: true,
    freeModeSticky: true,
    paginationClickable: true,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    breakpoints: {
      '0': {
        slidesPerView: 1,
        slidesPerGroup: 1,
        spaceBetween: 24,
        scrollbar: {
          el: '.swiper-scrollbar',
          hide: false,
        },
      },
      '600': {
        slidesPerView: 2,
        slidesPerGroup: 2,
        spaceBetween: 24,
        scrollbar: {
          el: '.swiper-scrollbar',
          hide: false,
        },
      },
      '1264': {
        slidesPerView: 3,
        slidesPerGroup: 3,
        spaceBetween: 24,
        scrollbar: {
          el: '.swiper-scrollbar',
          hide: true,
        },
      },
    },
  };

  @Mutation setVideoDialog!: (value: boolean) => void;
  @Mutation setSelectedVideo!: (value: Video) => void;

  get mdAndUp() {
    return this.$vuetify.breakpoint.mdAndUp;
  }

  onClickVideo(video: Video) {
    this.setSelectedVideo(video);
    this.setVideoDialog(true);
  }
}
</script>
