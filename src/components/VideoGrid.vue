<template>
  <v-row>
    <v-col v-for="video in videos" :key="video.guid" sm="6" lg="4">
      <v-card hover ripple>
        <v-img
          :src="video.images.lss.lg"
          class="white--text align-end"
          gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
        >
          <v-card-title v-text="video.title" style="word-break: normal"></v-card-title>
        </v-img>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { Video } from '@/types';

@Component
export default class VideoGrid extends Vue {
  @Prop({ required: true })
  videos!: Video[];
}
</script>
