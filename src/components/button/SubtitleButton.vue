<template>
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
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State } from 'vuex-class';

import { Video } from '@/types';

@Component
export default class SubtitleButton extends Vue {
  @Prop({ required: true })
  subtitleMedia!: Video | null;
  @Prop({ required: true })
  subtitleUrl!: string | null;

  @State translations!: { [key: string]: string };
}
</script>
