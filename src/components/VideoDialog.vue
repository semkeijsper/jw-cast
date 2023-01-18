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
        <v-toolbar-title
          v-if="!loading && videoMedia"
          v-text="`${selectedVideo.title} (${selectedVideo.durationFormattedHHMM})`"
          style="word-break: normal; user-select: none;"
        ></v-toolbar-title>
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
        v-if="loading || !videoMedia"
        :src="videoPoster"
        :aspect-ratio="xsOnly ? 2 : 3 / 1"
        class="white--text align-end"
        :class="{ 'img-loading': loading }"
        gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
      >
        <v-row v-if="loading" class="fill-height ma-0" justify="center">
          <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
        </v-row>
        <v-card-title
          v-text="`${selectedVideo.title} (${selectedVideo.durationFormattedHHMM})`"
          style="word-break: normal; user-select: none;"
        ></v-card-title>
      </v-img>
      <video
        v-else-if="videoMedia"
        id="player"
        controls
        crossorigin
        playsinline
        :poster="videoPoster"
        style="width: 100%; object-fit: cover;"
      >
        <source
          v-for="file in videoMedia.files.slice().reverse()"
          :key="file.label"
          :src="file.progressiveDownloadURL"
          :type="file.mimetype"
          :label="file.label"
          :size="file.label.slice(0, -1)"
        />
        <track
          v-if="captionUrl"
          :src="captionUrl"
          kind="captions"
          :srclang="getVideoLanguage.locale"
          :label="languageLabel(getVideoLanguage)"
        />
        <track
          v-if="subtitleUrl"
          :src="subtitleUrl"
          kind="subtitles"
          :default="true"
          :srclang="getSubtitleLanguage.locale"
          :label="languageLabel(getSubtitleLanguage)"
        />
        Your browser does not support the video tag.
      </video>
      <v-card-text class="px-3 pb-3">
        <v-container>
          <v-row :no-gutters="xsOnly">
            <v-col cols="12" sm="6">
              <v-autocomplete
                ref="vidLangSelect"
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
                ref="subLangSelect"
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
        <!-- Button components use v-bind as props are the same name as the variables -->
        <!-- For mobile -->
        <v-card-actions v-if="xsOnly">
          <CastButton v-bind="{ videoMedia, subtitleMedia, subtitleUrl }"></CastButton>
        </v-card-actions>
        <v-card-actions>
          <!-- For non-mobile -->
          <template v-if="!xsOnly">
            <CastButton v-bind="{ videoMedia, subtitleMedia, subtitleUrl }"></CastButton>
            <v-spacer></v-spacer>
          </template>
          <VideoButton v-bind="{ videoMedia }"></VideoButton>
          <SubtitleButton v-bind="{ subtitleMedia, subtitleUrl }"></SubtitleButton>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import axios from 'axios';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';

// @ts-ignore
import Plyr, { Track } from 'plyr';
import { Language, Video } from '@/types';

import CastButton from './button/CastButton.vue';
import VideoButton from './button/VideoButton.vue';
import SubtitleButton from './button/SubtitleButton.vue';

@Component({
  components: {
    CastButton,
    VideoButton,
    SubtitleButton,
  },
})
export default class VideoDialog extends Vue {
  player: Plyr | null = null;
  loading: boolean = true;
  videoMedia: Video | null = null;
  subtitleMedia: Video | null = null;
  videoOptions = {
    quality: {
      default: 720,
      options: [720, 480, 360, 240, 144],
    },
  };

  @State mediatorUrl!: string;
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

  get xsOnly() {
    return this.$vuetify.breakpoint.xsOnly;
  }

  get videoTitle() {
    return (this.selectedVideo ?? this.videoMedia)?.title;
  }

  get videoPoster() {
    return this.xsOnly
      ? (this.selectedVideo ?? this.videoMedia)?.images.lss.lg
      : (this.selectedVideo ?? this.videoMedia)?.images.pnr.lg;
  }

  get jwOrgUrl() {
    const { locale } = this.getSiteLanguage;
    const { primaryCategory, languageAgnosticNaturalKey } =
      this.selectedVideo ?? this.videoMedia ?? {};
    return `https://www.jw.org/finder?locale=${locale}&category=${primaryCategory}&lank=${languageAgnosticNaturalKey}`;
  }

  get captionUrl() {
    const found = this.videoMedia?.files.find(file => file?.subtitles?.url !== undefined);
    if (found === undefined) return null;
    return found.subtitles.url;
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

  get videoParam() {
    return this.$route.query.video;
  }

  get videoLanguage() {
    return this.getVideoLanguage.locale ?? this.getSiteLanguage.locale;
  }

  set videoLanguage(language: string) {
    if (language === null) return;
    this.setVideoLanguage(language);
  }

  get subtitleLanguage() {
    return this.getSubtitleLanguage.locale ?? 'nl';
  }

  set subtitleLanguage(language: string) {
    if (language === null) return;
    this.setSubtitleLanguage(language);
  }

  getMediaUrl(language: Language) {
    return `${this.mediatorUrl}/media-items/${language.code}/${this.selectedVideo
      ?.languageAgnosticNaturalKey ?? this.videoParam}?clientType=www`;
  }

  loadPlayer() {
    if (this.player) {
      this.player.destroy();
    }
    this.player = new Plyr('#player', this.videoOptions);
    const tracks: Track[] = [];
    if (this.captionUrl) {
      tracks.push({
        kind: 'captions',
        label: this.languageLabel(this.getVideoLanguage),
        srcLang: this.getVideoLanguage.locale,
        src: this.captionUrl,
      });
    }
    if (this.subtitleUrl) {
      tracks.push({
        kind: 'subtitles',
        label: this.languageLabel(this.getSubtitleLanguage),
        srcLang: this.getSubtitleLanguage.locale,
        src: this.subtitleUrl,
      });
    }
    this.player.source = {
      type: 'video',
      poster: this.videoPoster,
      title: this.selectedVideo.title,
      sources:
        this.videoMedia?.files.map(file => ({
          src: file.progressiveDownloadURL,
          type: file.mimetype,
          size: parseInt(file.label.slice(0, -1), 10),
        })) ?? [],
      tracks,
    };
  }

  async loadMediaItems() {
    this.loading = true;
    if (this.videoMedia === null) {
      [this.videoMedia] = (await axios.get(this.getMediaUrl(this.getVideoLanguage))).data.media;
    }
    if (this.selectedVideo === null) {
      this.setSelectedVideo(this.videoMedia);
    }
    if (this.subtitleMedia === null) {
      [this.subtitleMedia] = (
        await axios.get(this.getMediaUrl(this.getSubtitleLanguage))
      ).data.media;
    }
    this.loadPlayer();
    this.loading = false;
  }

  @Watch('videoDialog')
  onVideoDialogChange(active: boolean) {
    if (active && this.videoParam) {
      this.loadMediaItems();
    }
    if (!active) {
      // @ts-ignore
      if (this.player?.media) {
        this.player.stop();
      } else {
        document.querySelector('video')?.pause();
      }
      this.$router.replace({ query: { video: undefined } });
    }
  }

  @Watch('selectedVideo')
  onSelectedVideoChange(video: Video) {
    if (video === null) {
      return;
    }
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

  @Watch('videoLanguage')
  onVideoLanguageChange() {
    (this.$refs.vidLangSelect as any).blur();
    this.videoMedia = null;
    this.loadMediaItems();
  }

  @Watch('subtitleLanguage')
  onSubtitleLanguageChange() {
    (this.$refs.subLangSelect as any).blur();
    this.subtitleMedia = null;
    this.loadMediaItems();
  }
}
</script>
<style lang="scss">
.img-loading {
  .v-image__image {
    filter: blur(5px);
  }
}

.plyr__poster {
  background-size: cover !important;
}
</style>
