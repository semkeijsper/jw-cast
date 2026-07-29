import type { Language, Translations } from '~/types';
import { tutorialSteps } from '~/config/tutorialSteps';
import { uiStrings } from '~/config/uiStrings';
import { whatsappChannels } from '~/config/whatsappChannels';

export const useLanguageStore = defineStore('language', () => {
  // Seeded with Dutch + English; expanded by the page's language fetch
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

  // Resolved Language objects for the selected locales. `languages` is seeded
  // non-empty and only ever replaced with fetched lists, so the [0] fallback
  // always exists — typed as Language so call sites need no assertions.
  const siteLanguageInfo = computed<Language>(
    () => languages.value.find(l => l.locale === siteLanguage.value) ?? languages.value[0]!,
  );
  const videoLanguageInfo = computed<Language>(
    () =>
      languages.value.find(l => l.locale === videoLanguage.value)
      ?? languages.value.find(l => l.locale === 'en')
      ?? languages.value[0]!,
  );
  const subtitleLanguageInfo = computed<Language>(
    () =>
      languages.value.find(l => l.locale === subtitleLanguage.value)
      ?? languages.value.find(l => l.locale === 'nl')
      ?? languages.value[0]!,
  );

  const whatsappChannel = computed(() => whatsappChannels[siteLanguage.value]);

  const tutorialSteps_ = computed(() => tutorialSteps[siteLanguage.value] ?? tutorialSteps.en!);

  // UI string resolution: jw.org API translation → local dict → English
  function t(key: string): string {
    return translations.value[key]
      ?? uiStrings[siteLanguage.value]?.[key]
      ?? uiStrings.en![key]
      ?? key;
  }

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

  return {
    languages,
    translations,
    siteLanguage,
    videoLanguage,
    subtitleLanguage,
    siteLanguageInfo,
    videoLanguageInfo,
    subtitleLanguageInfo,
    whatsappChannel,
    tutorialSteps: tutorialSteps_,
    t,
    findLanguageByCode,
    findLanguageByLocale,
    setLanguages,
    setTranslations,
    setSiteLanguage,
    setVideoLanguage,
    setSubtitleLanguage,
  };
}, {
  persist: {
    // Pinned to the pre-split store id so the existing cookie keeps working;
    // the persisted field names must not change either
    key: 'app',
    pick: ['videoLanguage', 'subtitleLanguage'],
  },
});
