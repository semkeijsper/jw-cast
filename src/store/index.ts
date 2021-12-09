/* eslint-disable @typescript-eslint/no-shadow */
import Vue from 'vue';
import Vuex, { GetterTree, MutationTree } from 'vuex';

import { State } from '@/types/store';

Vue.use(Vuex);

const state: State = {
  mediatorUrl: `https://b.jw-cdn.org/apis/mediator/v1`,
  searchUrl: `https://b.jw-cdn.org/apis/search/results`,
  tokenUrl: `https://b.jw-cdn.org/tokens/jworg.jwt`,
  languages: [
    {
      code: 'O',
      locale: 'nl',
      vernacular: 'Nederlands',
      name: 'Nederlands',
    },
    {
      code: 'E',
      locale: 'en',
      vernacular: 'English',
      name: 'Engels',
    },
  ],
  translations: {},
  siteLanguage: 'nl',
  videoLanguage: 'en',
  subtitleLanguage: 'nl',
  searchDialog: false,
  videoDialog: false,
  transcriptDialog: false,
  selectedVideo: null,
  subtitleMedia: null,
};

const getters: GetterTree<State, any> = {
  getSiteLanguage: state => {
    const language = state.siteLanguage;
    return state.languages.find(l => l.locale === language);
  },
  getVideoLanguage: state => {
    const language = state.videoLanguage;
    return state.languages.find(l => l.locale === language);
  },
  getSubtitleLanguage: state => {
    const language = state.subtitleLanguage;
    return state.languages.find(l => l.locale === language);
  },
  findLanguageByCode: state => (code: string | undefined) =>
    state.languages.find(language => language.code === code),
  findLanguageByLocale: state => (locale: string | undefined) =>
    state.languages.find(language => language.locale === locale?.replace('-', '_')),
};

const mutations: MutationTree<State> = {
  setLanguages(state, value) {
    state.languages = value;
  },
  setTranslations(state, value) {
    state.translations = value;
  },
  setSiteLanguage(state, value) {
    state.siteLanguage = value;
  },
  setVideoLanguage(state, value) {
    state.videoLanguage = value;
  },
  setSubtitleLanguage(state, value) {
    state.subtitleLanguage = value;
  },
  setSearchDialog(state, value) {
    state.searchDialog = value;
  },
  setVideoDialog(state, value) {
    state.videoDialog = value;
  },
  setTranscriptDialog(state, value) {
    state.transcriptDialog = value;
  },
  setSelectedVideo(state, value) {
    state.selectedVideo = value;
  },
  setSubtitleMedia(state, value) {
    state.subtitleMedia = value;
  },
};

export default new Vuex.Store({
  state,
  getters,
  mutations,
});
