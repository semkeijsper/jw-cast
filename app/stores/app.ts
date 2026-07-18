import type { Language, Translations, Video } from '~/types';

export const useAppStore = defineStore('app', () => {
  // API base URLs
  const mediatorUrl = 'https://b.jw-cdn.org/apis/mediator/v1';
  const searchUrl = 'https://b.jw-cdn.org/apis/search/results';
  const tokenUrl = 'https://b.jw-cdn.org/tokens/jworg.jwt';

  // Seeded with Dutch + English; expanded by fetchLanguages()
  const languages = ref<Language[]>([
    { code: 'O', locale: 'nl', vernacular: 'Nederlands', name: 'Nederlands' },
    { code: 'E', locale: 'en', vernacular: 'English', name: 'Engels' },
  ]);

  const translations = ref<Translations>({});
  const siteLanguage = ref('nl');

  // Legacy cookies from before pinia-plugin-persistedstate; read-only fallback
  // so previously saved selections survive. Persistence itself is handled by
  // the `persist` option below.
  const videoLanguageCookie = useCookie<string>('jw_videoLanguage');
  const subtitleLanguageCookie = useCookie<string>('jw_subtitleLanguage');
  const videoLanguage = ref(videoLanguageCookie.value || 'en');
  const subtitleLanguage = ref(subtitleLanguageCookie.value || 'nl');

  const searchDialog = ref(false);
  const videoDialog = ref(false);
  const transcriptDialog = ref(false);
  const getNotifiedDialog = ref(false);
  const selectedVideo = ref<Video | null>(null);
  const subtitleMedia = ref<Video | null>(null);

  // Computed getters
  const getSiteLanguage = computed(
    () => languages.value.find(l => l.locale === siteLanguage.value) ?? languages.value[0],
  );
  const getVideoLanguage = computed(
    () =>
      languages.value.find(l => l.locale === videoLanguage.value)
      ?? languages.value.find(l => l.locale === 'en')
      ?? languages.value[0],
  );
  const getSubtitleLanguage = computed(
    () =>
      languages.value.find(l => l.locale === subtitleLanguage.value)
      ?? languages.value.find(l => l.locale === 'nl')
      ?? languages.value[0],
  );

  function findLanguageByCode(code: string | undefined) {
    return languages.value.find(l => l.code === code);
  }

  function findLanguageByLocale(locale: string | undefined) {
    return languages.value.find(l => l.locale === locale?.replace('-', '_'));
  }

  // Mutations
  function setLanguages(value: Language[]) {
    languages.value = value;
  }
  function setTranslations(value: Translations) {
    translations.value = value;
  }
  function setSiteLanguage(value: string) {
    siteLanguage.value = value;
  }
  function setVideoLanguage(value: string) {
    videoLanguage.value = value;
  }
  function setSubtitleLanguage(value: string) {
    subtitleLanguage.value = value;
  }
  function setSearchDialog(value: boolean) {
    searchDialog.value = value;
  }
  function setVideoDialog(value: boolean) {
    videoDialog.value = value;
  }
  function setTranscriptDialog(value: boolean) {
    transcriptDialog.value = value;
  }
  function setGetNotifiedDialog(value: boolean) {
    getNotifiedDialog.value = value;
  }
  function setSelectedVideo(value: Video | null) {
    selectedVideo.value = value;
  }
  function setSubtitleMedia(value: Video | null) {
    subtitleMedia.value = value;
  }

  return {
    mediatorUrl,
    searchUrl,
    tokenUrl,
    languages,
    translations,
    siteLanguage,
    videoLanguage,
    subtitleLanguage,
    searchDialog,
    videoDialog,
    transcriptDialog,
    getNotifiedDialog,
    selectedVideo,
    subtitleMedia,
    getSiteLanguage,
    getVideoLanguage,
    getSubtitleLanguage,
    findLanguageByCode,
    findLanguageByLocale,
    setLanguages,
    setTranslations,
    setSiteLanguage,
    setVideoLanguage,
    setSubtitleLanguage,
    setSearchDialog,
    setVideoDialog,
    setTranscriptDialog,
    setGetNotifiedDialog,
    setSelectedVideo,
    setSubtitleMedia,
  };
}, {
  persist: {
    pick: ['videoLanguage', 'subtitleLanguage'],
  },
});
