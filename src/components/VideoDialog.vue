<template>
  <v-dialog
    v-model="dialog"
    @click:outside="closeDialog"
    max-width="900px"
    transition="dialog-bottom-transition"
  >
    <v-card v-if="selectedVideo">
      <v-toolbar dark color="primary">
        <v-toolbar-title v-text="selectedVideo.title"></v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn icon dark @click="closeDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-img :src="selectedVideo.images.pnr.lg" :aspect-ratio="3 / 1">
        <!-- <v-card-title
          v-text="selectedVideo.title"
          style="word-break: normal; user-select: none;"
        ></v-card-title> -->
      </v-img>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Mutation, State } from 'vuex-class';

import { Video } from '@/types';

@Component
export default class VideoDialog extends Vue {
  dialog = false;

  @State selectedVideo!: Video;
  @Mutation setSelectedVideo!: (value: Video | null) => void;

  closeDialog() {
    this.setSelectedVideo(null);
  }

  @Watch('selectedVideo')
  onSelectedVideoChange(video: Video) {
    this.dialog = video !== null;
  }
}
</script>
