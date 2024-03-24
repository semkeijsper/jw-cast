<template>
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
        <span v-text="translations[`btnPlayWith${subtitleUrl ? '' : 'out'}Subtitles`]"></span>
      </v-tooltip>
    </template>
    <v-list dense v-if="videoMedia">
      <v-list-item
        v-for="file in videoMedia.files.filter(f => f.label !== '144p')"
        :key="file.checksum"
        :href="getChromecastUrl(file)"
        target="_blank"
      >
        <v-list-item-title>{{ file.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State } from 'vuex-class';

import { File, Video } from '@/types';

@Component
export default class CastButton extends Vue {
  @Prop({ required: true })
  videoMedia!: Video | null;
  @Prop({ required: true })
  subtitleMedia!: Video | null;
  @Prop({ required: true })
  subtitleUrl!: string | null;

  @State selectedVideo!: Video;
  @State translations!: { [key: string]: string };

  // eslint-disable-next-line class-methods-use-this
  getChromecastUrl(file: File) {
    const videoUrl = btoa(file.progressiveDownloadURL);
    // sfgc: subtitle foreground color = #ffffff
    // ss: subtitle size = 1.1
    let url = `https://chromecast.smplayer.info/index.php?sfgc=I2ZmZmZmZg==&ss=MS4x&url=${videoUrl}`;
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
}
</script>
