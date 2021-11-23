<template>
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
        :href="file.progressiveDownloadURL"
      >
        <v-list-item-title
          v-text="`${file.label} (${Math.floor(file.filesize / 1048576)} MB)`"
        ></v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State } from 'vuex-class';

import { Video } from '@/types';

@Component
export default class VideoButton extends Vue {
  @Prop({ required: true })
  videoMedia!: Video | null;

  @State translations!: { [key: string]: string };
}
</script>
