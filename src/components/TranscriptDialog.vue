<template>
  <v-dialog
    :key="subtitleUrl"
    v-model="dialog"
    @click:outside="dialog = false"
    max-width="800px"
    transition="dialog-bottom-transition"
    :fullscreen="$vuetify.breakpoint.smAndDown"
    scrollable
  >
    <v-card>
      <v-toolbar color="primary" dark dense class="flex-grow-0">
        <v-toolbar-title>Transcript</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn icon @click="onCopy">
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-textarea
          :value="subtitles"
          outlined
          auto-grow
          autofocus
          hide-details
          readonly
        ></v-textarea>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import axios from 'axios';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Mutation, State } from 'vuex-class';
import { Language, Video } from '@/types';

@Component
export default class TranscriptDialog extends Vue {
  vtt: string | null = null;

  @State languages!: Language[];

  @State transcriptDialog!: boolean;
  @Mutation setTranscriptDialog!: (value: boolean) => void;

  @State subtitleMedia!: Video | null;

  get xsOnly() {
    return this.$vuetify.breakpoint.xsOnly;
  }

  get dialog() {
    return this.transcriptDialog;
  }

  set dialog(value) {
    this.setTranscriptDialog(value);
  }

  get subtitleUrl() {
    const found = this.subtitleMedia?.files.find(file => file?.subtitles?.url !== undefined);
    if (found === undefined) return null;
    return found.subtitles.url;
  }

  onCopy() {
    navigator.clipboard.writeText(this.subtitles ?? '');
  }

  @Watch('subtitleUrl')
  async onSubtitleUrlChange(url: string | null) {
    if (url === null) {
      return;
    }
    const response = await axios.get(url);
    this.vtt = response.data;
  }

  // eslint-disable-next-line class-methods-use-this
  get testCase() {
    let bigstring = '';
    for (let index = 0; index < 2000; index += 1) {
      bigstring += `yeah this is a beautiful line number ${index} dude why does this not work i'm going to defenestrate myself fr fr\n`;
    }
    return bigstring;
  }

  get subtitles() {
    let { vtt } = this;
    if (!vtt || vtt.length === 0) {
      return '';
    }
    vtt = vtt.replace(/.+ --> .+/g, '');
    vtt = vtt.replace(/<\/c>/g, '');
    vtt = vtt.replace(/<.+?>/g, '');
    vtt = vtt.replace(/^\s*$/g, '');
    vtt = vtt.replace(/&nbsp;/g, ' ');

    let lines = vtt.split('\n');
    lines.splice(0, 2);
    lines = lines.map(line => line.trim());
    lines = lines.filter(line => line.length > 0);
    lines = lines.filter((line, index, total) => line !== total[index + 1]);

    // TODO: solve text being cut off
    return lines.join('\n').replace(/(\.\.\.\n|\. \. \.\n|([^.])\n)/g, '$2 ');
  }
}
</script>
