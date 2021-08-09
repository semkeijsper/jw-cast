/* eslint-disable @typescript-eslint/no-shadow */
import Vue from 'vue';
import Vuex, { ActionTree, GetterTree, MutationTree } from 'vuex';

// import axios from 'axios';

import { State } from '@/types/store';

Vue.use(Vuex);

const state: State = {
  baseUrl: 'https://b.jw-cdn.org/apis/mediator/v1',
  languages: [
    {
      code: 'O',
      locale: 'nl',
      vernacular: 'Nederlands',
      name: 'Nederlands',
      isLangPair: false,
      isSignLanguage: false,
      isRTL: false,
    },
    {
      code: 'E',
      locale: 'en',
      vernacular: 'English',
      name: 'Engels',
      isLangPair: false,
      isSignLanguage: false,
      isRTL: false,
    },
  ],
  translations: {},
  siteLanguage: 'nl',
  videoLanguage: 'en',
  subtitleLanguage: 'nl',
  categories: [],
  selectedVideo: null,
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
  setSelectedVideo(state, value) {
    state.selectedVideo = value;
  },
};

const actions: ActionTree<State, any> = {};

export default new Vuex.Store({
  state,
  getters,
  mutations,
  actions,
});
