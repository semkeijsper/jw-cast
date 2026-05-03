/* eslint-disable @typescript-eslint/no-shadow */
import Vue from 'vue';
import Vuex, { GetterTree, MutationTree } from 'vuex';
import VueCookies from 'vue-cookies';

import { State } from '@/types/store';

const COOKIE_VIDEO_LANG = 'jw_videoLanguage';
const COOKIE_SUBTITLE_LANG = 'jw_subtitleLanguage';

Vue.use(Vuex);
Vue.use(VueCookies, { expires: '1y' });

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
  videoLanguage: (Vue.$cookies.get(COOKIE_VIDEO_LANG) as string) || 'en',
  subtitleLanguage: (Vue.$cookies.get(COOKIE_SUBTITLE_LANG) as string) || 'nl',
  searchDialog: false,
  videoDialog: false,
  transcriptDialog: false,
  getNotifiedDialog: false,
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
    Vue.$cookies.set(COOKIE_VIDEO_LANG, value);
  },
  setSubtitleLanguage(state, value) {
    state.subtitleLanguage = value;
    Vue.$cookies.set(COOKIE_SUBTITLE_LANG, value);
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
  setGetNotifiedDialog(state, value) {
    state.getNotifiedDialog = value;
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
