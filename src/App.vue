<template>
  <v-app id="inspire">
    <v-app-bar app dark color="primary">
      <v-toolbar-title>JW Cast</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-toolbar-items v-if="translations.lnkSearch">
        <v-btn v-if="!$vuetify.breakpoint.xsOnly" text @click="setSearchDialog(true)">
          <v-icon left>mdi-magnify</v-icon>
          {{ translations.lnkSearch }}
        </v-btn>
        <v-btn v-else icon @click="setSearchDialog(true)">
          <v-icon>mdi-magnify</v-icon>
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
            <span
              class="text-h3 font-weight-bold"
              v-text="translations.hdgVideos || '\u200D'"
            ></span>
            <v-row>
              <v-col xs="12" sm="6" lg="4" cols="12">
                <v-autocomplete
                  ref="langSelect"
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
        <template v-if="ready">
          <VideoCategory categoryName="LatestVideos" grid divider></VideoCategory>
          <VideoCategory categoryName="StudioMonthlyPrograms" :limit="12" divider></VideoCategory>
          <VideoCategory categoryName="StudioTalks" :limit="9" divider></VideoCategory>
          <VideoCategory categoryName="StudioNewsReports" :limit="9" class="mb-3"></VideoCategory>
        </template>
      </v-container>
    </v-main>
    <SearchDialog></SearchDialog>
    <VideoDialog></VideoDialog>
    <TranscriptDialog></TranscriptDialog>
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
import TranscriptDialog from '@/components/TranscriptDialog.vue';

@Component({
  components: {
    VideoCategory,
    SearchDialog,
    VideoDialog,
    TranscriptDialog,
  },
})
export default class App extends Vue {
  ready: boolean = false;

  @State(state => state.route.params.language) routeLanguage!: string;

  @State mediatorUrl!: string;
  @State languages!: Language[];
  @State translations!: Translations;

  @Getter getSiteLanguage!: Language;
  @Mutation setSiteLanguage!: (value: string) => void;

  @Mutation setLanguages!: (value: Language[]) => void;
  @Mutation setTranslations!: (value: Translations) => void;
  @Mutation setSearchDialog!: (value: boolean) => void;

  async mounted() {
    this.$vuetify.theme.dark = window.matchMedia('(prefers-color-scheme:dark)').matches;
    await this.fetchLanguages();
    this.siteLanguage = this.routeLanguage;
    this.ready = true;
    if (this.routeLanguage === 'nl') this.fetchI18n();
  }

  updateRoute() {
    this.$router.push({ name: 'Home', params: { language: this.siteLanguage } });
  }

  // eslint-disable-next-line class-methods-use-this
  languageLabel(item: Language) {
    return item.name === item.vernacular ? item.name : `${item.name} (${item.vernacular})`;
  }

  languagesUrl(language: string) {
    return `${this.mediatorUrl}/languages/${language}/all?clientType=www`;
  }

  get translationsUrl() {
    return `${this.mediatorUrl}/translations/${this.getSiteLanguage.code}`;
  }

  get siteLanguage() {
    return this.getSiteLanguage?.locale ?? 'en';
  }

  set siteLanguage(language: string) {
    if (language === null) return;
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
  async onRouteLanguageChange(newLang: string) {
    if (!this.languages.some(language => language.locale === newLang)) {
      this.siteLanguage = 'en';
      this.updateRoute();
      return;
    }
    this.siteLanguage = newLang;
  }

  @Watch('siteLanguage')
  async onSiteLanguageChange() {
    (this.$refs.langSelect as any).blur();
    await this.fetchI18n();
    if (this.routeLanguage !== this.siteLanguage) {
      this.updateRoute();
    }
  }

  async fetchI18n() {
    await Promise.allSettled([this.fetchLanguages(), this.fetchTranslations()]);
  }

  async fetchLanguages() {
    type LanguagesRequest = { languages: Language[] };
    const url = this.languagesUrl(this.ready ? this.getSiteLanguage.code : '-');
    const { languages } = (await axios.get<LanguagesRequest>(url)).data;

    // Pinning items to the top of a list has never been harder
    const dutch = languages.filter(language => language.locale === 'nl')[0];
    const english = languages.filter(language => language.locale === 'en')[0];
    const remainder = languages.filter(
      language => language.locale !== 'nl' && language.locale !== 'en',
    );
    remainder.unshift(dutch, english);
    this.setLanguages(remainder);
  }

  async fetchTranslations() {
    type TranslationsRequest = { translations: { [key: string]: Translations } };
    const response = await axios.get<TranslationsRequest>(this.translationsUrl);
    const translations = response.data.translations[this.getSiteLanguage.code];
    this.setTranslations(translations);
  }
}
</script>
<style lang="scss">
* {
  scrollbar-width: thin;
}

html {
  overflow-y: hidden;
}

.v-main {
  height: 100dvh;
}

.v-main__wrap {
  overflow-y: auto;
  height: 100%;
}
</style>
