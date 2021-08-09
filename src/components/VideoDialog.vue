<template>
  <v-dialog
    v-model="dialog"
    @click:outside="closeDialog"
    max-width="900px"
    transition="dialog-bottom-transition"
    :fullscreen="$vuetify.breakpoint.smAndDown"
  >
    <v-card v-if="selectedVideo">
      <v-toolbar dense>
        <!-- <v-toolbar-title v-text="selectedVideo.title"></v-toolbar-title> -->
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn icon @click="closeDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-img
        :src="selectedVideo.images.pnr.lg"
        :aspect-ratio="3 / 1"
        class="white--text align-end"
        gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
      >
        <v-card-title
          v-text="selectedVideo.title"
          style="word-break: normal; user-select: none;"
        ></v-card-title>
      </v-img>
      <v-card-text class="px-2">
        <v-container>
          <v-row :no-gutters="$vuetify.breakpoint.xsOnly">
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="videoLanguage"
                :items="availableLanguages"
                class="mt-4"
                hide-details
                prepend-icon="mdi-volume-high"
                :item-text="languageLabel"
                item-value="locale"
                outlined
                dense
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="subtitleLanguage"
                :items="availableLanguages"
                class="mt-4"
                hide-details
                prepend-icon="mdi-subtitles"
                :item-text="languageLabel"
                item-value="locale"
                outlined
                dense
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" :class="$vuetify.breakpoint.xsOnly ? 'mt-4' : ''">
              <v-btn color="primary" dark>
                <v-icon left>
                  mdi-download
                </v-icon>
                {{ translations.btnSearchFilterVideo }}
              </v-btn>
              <v-btn color="primary" dark class="ml-4">
                <v-icon left>
                  mdi-download
                </v-icon>
                {{ translations.hdgSubtitles }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';

import { Language, Video } from '@/types';

@Component
export default class VideoDialog extends Vue {
  dialog = false;

  @State languages!: Language[];
  @State translations!: { [key: string]: string };
  @State selectedVideo!: Video;
  @Mutation setSelectedVideo!: (value: Video | null) => void;

  @Getter getVideoLanguage!: Language;
  @Getter getSubtitleLanguage!: Language;
  @Mutation setVideoLanguage!: (value: string) => void;
  @Mutation setSubtitleLanguage!: (value: string) => void;

  closeDialog() {
    this.setSelectedVideo(null);
  }

  // eslint-disable-next-line class-methods-use-this
  languageLabel(item: Language) {
    return item.name === item.vernacular ? item.name : `${item.name} (${item.vernacular})`;
  }

  get availableLanguages() {
    if (!this.selectedVideo) {
      return [];
    }
    return this.languages.filter(language =>
      this.selectedVideo.availableLanguages.includes(language.code),
    );
  }

  get videoLanguage() {
    return this.getVideoLanguage.locale;
  }

  set videoLanguage(language: string) {
    this.setVideoLanguage(language);
  }

  get subtitleLanguage() {
    return this.getSubtitleLanguage.locale;
  }

  set subtitleLanguage(language: string) {
    this.setSubtitleLanguage(language);
  }

  @Watch('selectedVideo')
  onSelectedVideoChange(video: Video) {
    this.dialog = video !== null;
  }
}
</script>
