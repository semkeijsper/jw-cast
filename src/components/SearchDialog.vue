<template>
  <v-dialog
    v-model="dialog"
    @click:outside="dialog = false"
    max-width="1100px"
    transition="dialog-bottom-transition"
    :fullscreen="$vuetify.breakpoint.smAndDown"
  >
    <v-card>
      <v-toolbar color="primary" dark>
        <v-text-field
          v-model="query"
          prepend-inner-icon="mdi-magnify"
          :placeholder="placeholder"
          hide-details
          single-line
          outlined
          dense
          class="mr-3"
        ></v-text-field>
        <v-toolbar-items>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-card-text :class="[xsOnly ? 'px-0' : 'px-3', 'py-3', 'pt-6']">
        <v-container>
          <v-row v-if="response">
            <v-col sm="6" lg="8" :class="[xsOnly ? 'pt-0' : undefined]">
              <span v-text="response.pagination.label"></span>
            </v-col>
            <v-col sm="6" lg="4" class="pt-0">
              <v-select
                v-model="sort"
                :items="response.sorts"
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
              <v-skeleton-loader type="text" boilerplate></v-skeleton-loader>
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
            <v-col v-for="i in 3" :key="i" sm="6" lg="4" cols="12">
              <v-skeleton-loader type="image" max-height="186.25" boilerplate></v-skeleton-loader>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { State, Getter, Mutation } from 'vuex-class';

import axios, { AxiosRequestConfig } from 'axios';
import { Language, Result, SearchResponse, Translations, Video } from '@/types';

@Component
export default class SearchDialog extends Vue {
  jwt: string = '';
  sort: string = 'rel';
  searchQuery: string = '';
  debounce: number | null = null;
  response: SearchResponse | null = null;

  @State tokenUrl!: string;
  @State searchUrl!: string;
  @State mediatorUrl!: string;
  @State translations!: Translations;

  @Getter getSiteLanguage!: Language;

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

  getMediaUrl(result: Result) {
    return `${this.mediatorUrl}/media-items/${this.getSiteLanguage.code}/${result.lank}?clientType=www`;
  }

  async onClickResult(result: Result) {
    const [video] = (await axios.get(this.getMediaUrl(result))).data.media;
    this.setSelectedVideo(video);
    this.setVideoDialog(true);
  }

  @Watch('searchQuery')
  async onSearchQueryChange(value: string) {
    if (value === '') {
      this.response = null;
      return;
    }

    // is URL check
    // jw\.org\/\w+\/.*#(?<locale>\w+)\/mediaitems\/(?<category>\w+)\/(?<lank>.*)
    // jw\.org\/finder\?.*&.*
    // wtlocale=(?<code>[A-Za-z]+)
    // locale=(?<locale>[A-Za-z]+)

    const url = `${this.searchUrl}/${this.getSiteLanguage.code}/videos?sort=${this.sort}&q=${value}`;
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
    };

    try {
      const response = await axios.get<SearchResponse>(url, config);
      this.response = response.data;
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        return;
      }
      if (error.response?.status === 401) {
        this.fetchToken();
      }
    }
  }
}
</script>
