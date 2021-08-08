<template>
  <v-app id="inspire">
    <v-app-bar app dark color="primary">
      <!-- <v-app-bar-nav-icon></v-app-bar-nav-icon> -->

      <v-toolbar-title>JW Cast</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-autocomplete
        v-model="siteLanguage"
        :items="languages"
        class="mx-4"
        flat
        :dense="!this.$vuetify.breakpoint.mdAndUp"
        hide-details
        solo-inverted
        prepend-icon="mdi-translate"
        :item-text="item => `${item.name} (${item.vernacular})`"
        item-value="code"
      ></v-autocomplete>

      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-row justify="center">
          <v-col class="mt-3" sm="12" xl="8">
            <strong class="text-h3 font-weight-bold" v-text="translations.hdgVideos"></strong>
            <v-row>
              <v-col sm="6" lg="4">
                <v-autocomplete
                  v-model="videoLanguage"
                  :items="languages"
                  class="mt-4"
                  hide-details
                  prepend-icon="mdi-translate"
                  :item-text="item => `${item.name} (${item.vernacular})`"
                  item-value="code"
                  outlined
                  dense
                ></v-autocomplete>
              </v-col>
            </v-row>
            <v-divider class="mt-8"></v-divider>
          </v-col>
        </v-row>
        <VideoCategory :category="latestVideos"></VideoCategory>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import axios from 'axios';

import VideoCategory from '@/components/VideoCategory.vue';

@Component({
  components: {
    VideoCategory,
  },
})
export default class App extends Vue {
  baseUrl = 'https://b.jw-cdn.org/apis/mediator/v1';
  siteLanguage = '';
  videoLanguage = '';
  languages = [];
  translations = [];
  latestVideos = {};

  async mounted() {
    this.siteLanguage = 'O';
    this.videoLanguage = 'O';
  }

  get languagesUrl() {
    return `${this.baseUrl}/languages/${this.siteLanguage}/all?clientType=www`;
  }

  get translationsUrl() {
    return `${this.baseUrl}/translations/${this.siteLanguage}`;
  }

  get latestVideosUrl() {
    return `${this.baseUrl}/categories/${this.videoLanguage}/LatestVideos?detailed=1&clientType=www`;
  }

  @Watch('siteLanguage')
  async onSiteLanguageChange() {
    this.languages = (await axios.get(this.languagesUrl)).data.languages;
    this.translations = (await axios.get(this.translationsUrl)).data.translations[
      this.siteLanguage
    ];
  }

  @Watch('videoLanguage')
  async onVideoLanguageChange() {
    try {
      this.latestVideos = (await axios.get(this.latestVideosUrl)).data.category;
    } catch (error) {
      this.latestVideos = {};
    }
  }
}
</script>

<style>
html {
  overflow-y: auto !important;
}
</style>
