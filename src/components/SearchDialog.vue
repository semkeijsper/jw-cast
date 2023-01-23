<template>
  <v-dialog
    v-model="dialog"
    @click:outside="dialog = false"
    max-width="1100px"
    transition="dialog-bottom-transition"
    :fullscreen="$vuetify.breakpoint.smAndDown"
    scrollable
  >
    <v-card>
      <v-toolbar color="primary" dark class="flex-grow-0">
        <v-text-field
          v-model="query"
          prepend-inner-icon="mdi-magnify"
          :placeholder="placeholder"
          hide-details
          single-line
          outlined
          dense
          color="white"
          clearable
          autofocus
          class="mr-3"
        ></v-text-field>
        <v-toolbar-items>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-card-text :class="[xsOnly ? 'px-0' : 'px-3', 'py-3']">
        <v-container>
          <v-row v-if="response">
            <v-col sm="6" lg="8">
              <span v-text="searchMessage"></span>
              <div v-if="response.messages[1]" v-html="response.messages[1].message"></div>
            </v-col>
            <v-col v-if="response.sorts.length > 0" sm="6" lg="4">
              <v-select
                v-model="sort"
                :items="sorts"
                item-value="key"
                item-text="label"
                prepend-icon="mdi-sort"
                label="Sort"
                outlined
                hide-details
                single-line
                dense
              ></v-select>
            </v-col>
          </v-row>
          <v-row v-else>
            <v-col sm="6" lg="4" cols="12">
              <v-skeleton-loader type="text" :boilerplate="!isLoading"></v-skeleton-loader>
            </v-col>
          </v-row>
          <v-row v-if="response">
            <v-col v-for="result in response.results" :key="result.lank" sm="6" lg="4" cols="12">
              <v-card hover ripple rounded @click="onClickResult(result)">
                <v-img
                  :src="result.image.url"
                  :aspect-ratio="2 / 1"
                  class="white--text align-end"
                  gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
                >
                  <v-card-title
                    v-text="result.title"
                    style="word-break: normal; user-select: none;"
                  ></v-card-title>
                </v-img>
              </v-card>
            </v-col>
          </v-row>
          <v-row v-else>
            <v-col v-for="i in columnCount" :key="i" sm="6" lg="4" cols="12">
              <v-skeleton-loader
                type="image"
                max-height="189"
                :boilerplate="!isLoading"
              ></v-skeleton-loader>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import axios, { AxiosRequestConfig } from 'axios';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';
import { Language, Result, SearchResponse, Translations, Video } from '@/types';

@Component
export default class SearchDialog extends Vue {
  jwt: string = '';
  sort: string = 'rel';
  sortKeys: string[] = ['rel', 'newest', 'oldest'];
  isLoading: boolean = false;
  searchQuery: string = '';
  debounce: number | null = null;
  response: SearchResponse | null = null;

  @State tokenUrl!: string;
  @State searchUrl!: string;
  @State mediatorUrl!: string;
  @State languages!: Language[];
  @State translations!: Translations;

  @Getter getSiteLanguage!: Language;
  @Getter findLanguageByLocale!: (locale: string | undefined) => Language | undefined;

  @State searchDialog!: boolean;
  @Mutation setSearchDialog!: (value: boolean) => void;

  @Mutation setVideoDialog!: (value: boolean) => void;
  @Mutation setSelectedVideo!: (value: Video) => void;

  async mounted() {
    this.fetchToken();
  }

  async fetchToken() {
    const response = await axios.get(this.tokenUrl);
    this.jwt = response.data;
  }

  get xsOnly() {
    return this.$vuetify.breakpoint.xsOnly;
  }

  get dialog() {
    return this.searchDialog;
  }

  set dialog(value) {
    this.setSearchDialog(value);
  }

  get query() {
    return this.searchQuery;
  }

  set query(value) {
    if (this.debounce) clearTimeout(this.debounce);
    // @ts-ignore
    this.debounce = setTimeout(() => {
      this.searchQuery = value;
    }, 400);
  }

  get siteLanguage() {
    return this.getSiteLanguage?.locale ?? 'en';
  }

  get placeholder() {
    switch (this.siteLanguage) {
      case 'nl':
        return 'Zoek of plak jw.org link...';
      case 'en':
      default:
        return 'Search or paste jw.org link...';
    }
  }

  get searchMessage() {
    return this.response?.pagination?.label ?? this.response?.messages[0].message;
  }

  get sorts() {
    if (!this.response?.sorts) {
      return [];
    }
    return this.sortKeys.map(key => ({
      key,
      label: this.response?.sorts.find(sort => sort.link.includes(key))?.label,
    }));
  }

  get columnCount() {
    switch (this.$vuetify.breakpoint.name) {
      case 'xl':
      case 'lg':
        return 3;
      case 'md':
      case 'sm':
        return 2;
      case 'xs':
      default:
        return 1;
    }
  }

  async onClickResult(result: Result) {
    this.fetchVideo(this.getSiteLanguage.code, result.lank);
  }

  @Watch('searchQuery')
  async onSearchQueryChange(value: string) {
    if (value === null || value === '') {
      this.response = null;
      return;
    }

    const finderRegex = /jw\.org\/finder\?.+&.+/;
    const wtLocaleRegex = /wtlocale=(?<code>[A-Za-z]+)/;
    const localeRegex = /locale=(?<locale>[A-Za-z]+)/;
    const lankRegex = /lank=(?<lank>[\w-]+)/;
    const mediaItemsRegex = /jw\.org\/[\w-]+\/.+#(?<locale>[\w-]+)\/mediaitems\/(?<category>[\w-]+)\/(?<lank>[\w-]+)/;

    if (finderRegex.test(value)) {
      const lang =
        wtLocaleRegex.exec(value)?.groups?.code ??
        this.findLanguageByLocale(localeRegex.exec(value)?.groups?.locale)?.code;
      const lank = lankRegex.exec(value)?.groups?.lank;
      await this.fetchVideo(lang, lank);
      this.searchQuery = '';
      return;
    }
    if (mediaItemsRegex.test(value)) {
      const match = mediaItemsRegex.exec(value);
      const lang = this.findLanguageByLocale(match?.groups?.locale)?.code;
      const lank = match?.groups?.lank;
      await this.fetchVideo(lang, lank);
      this.searchQuery = '';
      return;
    }

    this.fetchResponse(value);
  }

  async fetchVideo(langCode: string | undefined, lank: string | undefined) {
    if (langCode === undefined || lank === undefined) {
      // TODO: Invalid link message(?)
      return;
    }
    const [video] = (
      await axios.get(`${this.mediatorUrl}/media-items/${langCode}/${lank}?clientType=www`)
    ).data.media;
    this.setSelectedVideo(video);
    this.setVideoDialog(true);
  }

  @Watch('sort')
  async onSortChange() {
    this.fetchResponse(this.searchQuery);
  }

  async fetchResponse(query: string) {
    this.isLoading = true;
    const url = `${this.searchUrl}/${this.getSiteLanguage.code}/videos?sort=${this.sort}&q=${query}`;
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
    };

    try {
      const response = await axios.get<SearchResponse>(url, config);
      response.data.results = response.data.results.filter(
        result => result.subtype !== 'videoCategory',
      );
      this.response = response.data;
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        return;
      }
      if (error.response?.status === 401) {
        this.fetchToken();
      }
    } finally {
      this.isLoading = false;
    }
  }

  @Watch('getSiteLanguage')
  onSiteLanguageChange() {
    this.searchQuery = '';
    this.response = null;
  }
}
</script>
