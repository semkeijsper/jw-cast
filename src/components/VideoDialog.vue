<template>
  <v-dialog
    v-model="dialog"
    @click:outside="dialog = false"
    max-width="900px"
    transition="dialog-bottom-transition"
    :fullscreen="$vuetify.breakpoint.smAndDown"
  >
    <v-card v-if="selectedVideo">
      <v-toolbar dense>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn icon :href="jwOrgUrl" target="_blank" v-bind="attrs" v-on="on">
                <v-icon>mdi-open-in-new</v-icon>
              </v-btn>
            </template>
            <span v-text="translations.lnkHome"></span>
          </v-tooltip>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-img
        :src="xsOnly ? selectedVideo.images.lss.lg : selectedVideo.images.pnr.lg"
        :aspect-ratio="xsOnly ? 2 : 3 / 1"
        class="white--text align-end"
        gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
      >
        <v-card-title
          v-text="`${selectedVideo.title} (${selectedVideo.durationFormattedHHMM})`"
          style="word-break: normal; user-select: none;"
        ></v-card-title>
      </v-img>
      <v-card-text class="px-3 pb-3">
        <v-container>
          <v-row :no-gutters="xsOnly">
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
          </v-row>
        </v-container>
        <v-card-actions v-if="xsOnly">
          <v-menu offset-y rounded="0" transition="slide-y-transition">
            <template v-slot:activator="{ on: menu, attrs }">
              <v-tooltip right>
                <template v-slot:activator="{ on: tooltip }">
                  <v-btn
                    color="primary"
                    v-bind="attrs"
                    v-on="{ ...tooltip, ...menu }"
                    class="mr-2"
                    :loading="!videoMedia || !subtitleMedia"
                  >
                    <v-icon left>
                      mdi-cast
                    </v-icon>
                    {{ translations.btnPlay }}
                  </v-btn>
                </template>
                <span
                  v-text="
                    subtitleUrl
                      ? translations.btnPlayWithSubtitles
                      : translations.btnPlayWithoutSubtitles
                  "
                ></span>
              </v-tooltip>
            </template>
            <v-list dense v-if="videoMedia">
              <v-list-item
                v-for="file in videoMedia.files.filter(f => f.label !== '144p')"
                :key="file.checksum"
                link
                :href="getChromecastUrl(file)"
                target="_blank"
              >
                <v-list-item-title v-text="file.label"></v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-card-actions>
        <v-card-actions>
          <template v-if="!xsOnly">
            <v-menu offset-y rounded="0" transition="slide-y-transition">
              <template v-slot:activator="{ on: menu, attrs }">
                <v-tooltip right>
                  <template v-slot:activator="{ on: tooltip }">
                    <v-btn
                      color="primary"
                      v-bind="attrs"
                      v-on="{ ...tooltip, ...menu }"
                      class="mr-2"
                      :loading="!videoMedia || !subtitleMedia"
                    >
                      <v-icon left>
                        mdi-cast
                      </v-icon>
                      {{ translations.btnPlay }}
                    </v-btn>
                  </template>
                  <span
                    v-text="
                      subtitleUrl
                        ? translations.btnPlayWithSubtitles
                        : translations.btnPlayWithoutSubtitles
                    "
                  ></span>
                </v-tooltip>
              </template>
              <v-list dense v-if="videoMedia">
                <v-list-item
                  v-for="file in videoMedia.files.filter(f => f.label !== '144p')"
                  :key="file.checksum"
                  link
                  :href="getChromecastUrl(file)"
                  target="_blank"
                >
                  <v-list-item-title v-text="file.label"></v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-spacer></v-spacer>
          </template>
          <v-menu offset-y rounded="0" transition="slide-y-transition">
            <template v-slot:activator="{ attrs, on }">
              <v-btn color="primary" v-bind="attrs" v-on="on" class="mr-2" :loading="!videoMedia">
                <v-icon left>
                  mdi-download
                </v-icon>
                {{ translations.btnSearchFilterVideo }}
              </v-btn>
            </template>

            <v-list dense v-if="videoMedia">
              <v-list-item
                v-for="file in videoMedia.files.filter(f => f.label !== '144p')"
                :key="file.checksum"
                link
                :href="file.progressiveDownloadURL"
              >
                <v-list-item-title
                  v-text="`${file.label} (${Math.floor(file.filesize / 1048576)} MB)`"
                ></v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn
            color="primary"
            :loading="!subtitleMedia"
            :disabled="subtitleUrl === null"
            :href="subtitleUrl"
          >
            <v-icon left>
              mdi-download
            </v-icon>
            {{ translations.hdgSubtitles }}
          </v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';

import { File, Language, Video } from '@/types';
import axios from 'axios';

@Component
export default class VideoDialog extends Vue {
  videoMedia: Video | null = null;
  subtitleMedia: Video | null = null;

  @State baseUrl!: string;
  @State languages!: Language[];
  @State translations!: { [key: string]: string };

  @State videoDialog!: boolean;
  @State selectedVideo!: Video;
  @Mutation setVideoDialog!: (value: boolean) => void;
  @Mutation setSelectedVideo!: (value: Video | null) => void;

  @Getter getSiteLanguage!: Language;
  @Getter getVideoLanguage!: Language;
  @Getter getSubtitleLanguage!: Language;
  @Mutation setVideoLanguage!: (value: string) => void;
  @Mutation setSubtitleLanguage!: (value: string) => void;

  // eslint-disable-next-line class-methods-use-this
  languageLabel(item: Language) {
    return item.name === item.vernacular ? item.name : `${item.name} (${item.vernacular})`;
  }

  // eslint-disable-next-line class-methods-use-this
  getChromecastUrl(file: File) {
    const video = btoa(file.progressiveDownloadURL);
    // sfgc: subtitle foreground color = #ffffff
    let url = `https://chromecast.smplayer.info/index.php?sfgc=I2ZmZmZmZg==&url=${video}`;
    try {
      url += `&title=${btoa(this.selectedVideo.title.replaceAll('—', '-'))}`;
    } catch (error) {
      // No title then, I guess
    }
    if (this.subtitleUrl !== null) {
      const subtitles = btoa(this.subtitleUrl);
      url += `&subtitles=${subtitles}`;
    }
    return url;
  }

  get xsOnly() {
    return this.$vuetify.breakpoint.xsOnly;
  }

  get jwOrgUrl() {
    const { locale } = this.getSiteLanguage;
    const { primaryCategory, languageAgnosticNaturalKey } = this.selectedVideo;
    return `https://www.jw.org/finder?locale=${locale}&category=${primaryCategory}&lank=${languageAgnosticNaturalKey}`;
  }

  get subtitleUrl() {
    const found = this.subtitleMedia?.files.find(file => file?.subtitles?.url !== undefined);
    if (found === undefined) return null;
    return found.subtitles.url;
  }

  get availableLanguages() {
    if (!this.selectedVideo) {
      return [];
    }
    return this.languages.filter(language =>
      this.selectedVideo.availableLanguages.includes(language.code),
    );
  }

  get dialog() {
    return this.videoDialog;
  }

  set dialog(value) {
    this.setVideoDialog(value);
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

  getMediaUrl(language: Language) {
    return `${this.baseUrl}/media-items/${language.code}/${this.selectedVideo.languageAgnosticNaturalKey}?clientType=www`;
  }

  async loadMediaItems() {
    if (this.videoMedia === null) {
      [this.videoMedia] = (await axios.get(this.getMediaUrl(this.getVideoLanguage))).data.media;
    }
    if (this.subtitleMedia === null) {
      [this.subtitleMedia] = (
        await axios.get(this.getMediaUrl(this.getSubtitleLanguage))
      ).data.media;
    }
  }

  @Watch('selectedVideo')
  onSelectedVideoChange(video: Video) {
    this.dialog = video !== null;
    if (video !== null) {
      this.videoMedia = null;
      this.subtitleMedia = null;
      if (this.getSiteLanguage.locale === this.videoLanguage) {
        this.videoMedia = video;
      }
      if (this.getSiteLanguage.locale === this.subtitleLanguage) {
        this.subtitleMedia = video;
      }
      this.loadMediaItems();
    }
  }

  @Watch('videoLanguage')
  onVideoLanguageChange() {
    this.videoMedia = null;
    this.loadMediaItems();
  }

  @Watch('subtitleLanguage')
  onSubtitleLanguageChange() {
    this.subtitleMedia = null;
    this.loadMediaItems();
  }
}
</script>
