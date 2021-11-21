<template>
  <v-app id="inspire">
    <v-app-bar app dark color="primary">
      <v-toolbar-title>JW Cast</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-toolbar-items>
        <v-btn text @click="setSearchDialog(true)">
          <v-icon left>mdi-magnify</v-icon>
          {{ this.translations.lnkSearch }}
        </v-btn>
        <v-btn text href="https://github.com/semkeijsper/jw-cast#handleiding" target="_blank">
          <v-icon left>mdi-book-open-blank-variant</v-icon>
          {{ guideButtonText }}
        </v-btn>
      </v-toolbar-items>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-row justify="center">
          <v-col class="mt-3" sm="12" xl="8">
            <span class="text-h3 font-weight-bold" v-text="translations.hdgVideos"></span>
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
        <VideoCategory categoryName="LatestVideos" grid divider></VideoCategory>
        <VideoCategory categoryName="StudioMonthlyPrograms" :limit="18" divider></VideoCategory>
        <VideoCategory categoryName="StudioTalks" :limit="10" divider></VideoCategory>
        <VideoCategory categoryName="StudioNewsReports" :limit="10" class="mb-3"></VideoCategory>
      </v-container>
    </v-main>
    <SearchDialog></SearchDialog>
    <VideoDialog></VideoDialog>
  </v-app>
</template>

<script lang="ts">
import axios from 'axios';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';

import { Language, Translations } from './types';

import VideoDialog from '@/components/VideoDialog.vue';
import SearchDialog from '@/components/SearchDialog.vue';
import VideoCategory from '@/components/VideoCategory.vue';

@Component({
  components: {
    VideoCategory,
    SearchDialog,
    VideoDialog,
  },
})
export default class App extends Vue {
  @State(state => state.route.params.language) routeLanguage!: string;

  @State baseUrl!: string;
  @State languages!: Language[];
  @State translations!: Translations;

  @Getter getSiteLanguage!: Language;
  @Mutation setSiteLanguage!: (value: string) => void;

  @Mutation setLanguages!: (value: Language[]) => void;
  @Mutation setTranslations!: (value: Translations) => void;
  @Mutation setSearchDialog!: (value: boolean) => void;

  async mounted() {
    // Make sure languages/translations are fetched first
    this.fetchTranslations().then(() => {
      this.setSiteLanguage(this.routeLanguage);
    });
  }

  updateRoute() {
    this.$router.push({ name: 'Home', params: { language: this.siteLanguage } });
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
    return this.getSiteLanguage?.locale ?? 'en';
  }

  set siteLanguage(language: string) {
    this.setSiteLanguage(language);
  }

  get guideButtonText() {
    switch (this.siteLanguage) {
      case 'nl':
        return 'Handleiding';
      case 'en':
        return 'Guide';
      default:
        return this.translations.lnkHelpView;
    }
  }

  @Watch('routeLanguage')
  onRouteLanguageChange(newLang: string) {
    if (!this.languages.some(language => language.locale === newLang)) {
      this.setSiteLanguage('en');
      this.fetchTranslations();
      this.updateRoute();
      return;
    }
    this.setSiteLanguage(newLang);
  }

  @Watch('siteLanguage')
  async onSiteLanguageChange() {
    this.fetchTranslations();
    if (this.routeLanguage !== this.siteLanguage) {
      this.updateRoute();
    }
  }

  async fetchTranslations() {
    type LanguagesRequest = { languages: Language[] };
    axios.get<LanguagesRequest>(this.languagesUrl).then(response => {
      const { languages } = response.data;
      const dutch = languages.filter(language => language.locale === 'nl')[0];
      const english = languages.filter(language => language.locale === 'en')[0];
      const remainder = languages.filter(
        language => language.locale !== 'nl' && language.locale !== 'en',
      );
      remainder.unshift(dutch, english);
      this.setLanguages(remainder);
    });

    type TranslationsRequest = { translations: { [key: string]: Translations } };
    axios.get<TranslationsRequest>(this.translationsUrl).then(response => {
      const translations = response.data.translations[this.getSiteLanguage.code];
      this.setTranslations(translations);
    });
  }
}
</script>

<style>
html {
  overflow-y: auto !important;
}
</style>
