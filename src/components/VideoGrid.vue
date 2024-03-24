<template>
  <v-row>
    <v-col v-for="video in videos" :key="video.guid" sm="6" lg="4" cols="12">
      <v-card hover ripple rounded @click="onClickVideo(video)">
        <v-img
          :src="video.images.lss.lg"
          :aspect-ratio="2 / 1"
          class="white--text align-end"
          gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
        >
          <v-card-title style="word-break: normal; user-select: none;">
            {{ video.title }}
          </v-card-title>
        </v-img>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Mutation } from 'vuex-class';

import { Video } from '@/types';

@Component
export default class VideoGrid extends Vue {
  @Prop({ required: true })
  videos!: Video[];

  @Mutation setVideoDialog!: (value: boolean) => void;
  @Mutation setSelectedVideo!: (value: Video) => void;

  onClickVideo(video: Video) {
    this.setSelectedVideo(video);
    this.setVideoDialog(true);
  }
}
</script>
