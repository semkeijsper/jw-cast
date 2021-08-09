<template>
  <v-app id="inspire">
    <v-app-bar app dark color="primary">
      <!-- <v-app-bar-nav-icon></v-app-bar-nav-icon> -->

      <v-toolbar-title>JW Cast</v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn> -->
    </v-app-bar>

    <v-main>
      <v-container>
        <v-row justify="center">
          <v-col class="mt-3" sm="12" xl="8">
            <strong class="text-h3 font-weight-bold" v-text="translations.hdgVideos"></strong>
            <v-row>
              <v-col xs="12" sm="6" lg="4" cols="12">
                <v-autocomplete
                  v-model="siteLanguage"
                  :items="languages"
                  class="mt-4"
                  hide-details
                  prepend-icon="mdi-translate"
                  :item-text="languageLabel"
                  item-value="locale"
                  outlined
                  dense
                ></v-autocomplete>
              </v-col>
            </v-row>
            <v-divider class="mt-8"></v-divider>
          </v-col>
        </v-row>
        <VideoCategory categoryName="JWB2021Convention" divider></VideoCategory>
        <VideoCategory categoryName="LatestVideos"></VideoCategory>
      </v-container>
    </v-main>
    <VideoDialog></VideoDialog>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';

import axios from 'axios';

import VideoCategory from '@/components/VideoCategory.vue';
import VideoDialog from '@/components/VideoDialog.vue';
import { Language } from './types';

@Component({
  components: {
    VideoCategory,
    VideoDialog,
  },
})
export default class App extends Vue {
  @State(state => state.route.params.language) routeLanguage!: string;

  @State baseUrl!: string;
  @State languages!: Language[];
  @State translations!: { [key: string]: string };

  @Getter getSiteLanguage!: Language;
  @Getter getVideoLanguage!: Language;
  @Mutation setSiteLanguage!: (value: string) => void;
  @Mutation setVideoLanguage!: (value: string) => void;

  @Mutation setLanguages!: (value: Language[]) => void;
  @Mutation setTranslations!: (value: { [key: string]: string }) => void;

  async mounted() {
    // Make sure languages/translations are fetched first
    this.fetchTranslations().then(() => {
      this.setSiteLanguage(this.routeLanguage);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  languageLabel(item: Language) {
    return item.name === item.vernacular ? item.name : `${item.name} (${item.vernacular})`;
  }

  get languagesUrl() {
    return `${this.baseUrl}/languages/${this.getSiteLanguage.code}/all?clientType=www`;
  }

  get translationsUrl() {
    return `${this.baseUrl}/translations/${this.getSiteLanguage.code}`;
  }

  get siteLanguage() {
    return this.getSiteLanguage.locale;
  }

  set siteLanguage(language: string) {
    this.setSiteLanguage(language);
  }

  get videoLanguage() {
    return this.getVideoLanguage.locale;
  }

  set videoLanguage(language: string) {
    this.setVideoLanguage(language);
  }

  @Watch('routeLanguage')
  onRouteLanguageChange() {
    this.setSiteLanguage(this.routeLanguage);
  }

  @Watch('siteLanguage')
  async onSiteLanguageChange() {
    this.fetchTranslations();
    this.$router.push({ name: 'Home', params: { language: this.siteLanguage } });
  }

  async fetchTranslations() {
    try {
      // Pinning items to the top of a list has never been harder
      const { languages } = (await axios.get<{ languages: Language[] }>(this.languagesUrl)).data;
      const dutch = languages.filter(language => language.locale === 'nl')[0];
      const english = languages.filter(language => language.locale === 'en')[0];
      const remainder = languages.filter(
        language => language.locale !== 'nl' && language.locale !== 'en',
      );
      remainder.unshift(dutch, english);
      this.setLanguages(remainder);
    } catch (error) {
      // Give up, I guess.
    }
    this.setTranslations(
      (await axios.get(this.translationsUrl)).data.translations[this.getSiteLanguage.code],
    );
  }
}
</script>

<style>
html {
  overflow-y: auto !important;
}
</style>
