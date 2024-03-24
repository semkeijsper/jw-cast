<template>
  <v-menu offset-y rounded="0" transition="slide-y-transition">
    <template v-slot:activator="{ attrs, on }">
      <v-btn
        color="primary"
        v-bind="attrs"
        v-on="on"
        class="ml-2"
        :loading="!subtitleMedia"
        :disabled="subtitleUrl === null"
      >
        <v-icon left>
          mdi-download
        </v-icon>
        {{ translations.hdgSubtitles }}
      </v-btn>
    </template>

    <v-list dense v-if="subtitleMedia">
      <v-list-item :href="subtitleUrl">
        <v-list-item-icon class="mr-4">
          <v-icon>mdi-download</v-icon>
        </v-list-item-icon>
        <v-list-item-title>
          {{ translations.btnDownload }}
        </v-list-item-title>
      </v-list-item>
      <v-list-item link @click="onClick">
        <v-list-item-icon class="mr-4">
          <v-icon>mdi-text</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Transcript</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Mutation, State } from 'vuex-class';

import { Video } from '@/types';

@Component
export default class SubtitleButton extends Vue {
  @Prop({ required: true })
  subtitleMedia!: Video | null;
  @Prop({ required: true })
  subtitleUrl!: string | null;

  @State translations!: { [key: string]: string };

  @Mutation setSubtitleMedia!: (value: Video | null) => void;
  @Mutation setTranscriptDialog!: (value: boolean) => void;

  onClick() {
    this.setSubtitleMedia(this.subtitleMedia);
    this.setTranscriptDialog(true);
  }
}
</script>
