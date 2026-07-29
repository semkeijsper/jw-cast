import type { Translations } from '~/types';

/**
 * Locally-owned UI strings, keyed by locale with an `en` fallback.
 * Resolution happens in the store's `t(key)`: jw.org API translation first,
 * then this dictionary for the active locale, then the `en` entry.
 * Add a locale block here to translate the app shell into a new language.
 */
export const uiStrings: Record<string, Translations> = {
  en: {
    guide: 'Guide',
    tutorialTitle: 'How to use JW Cast',
    feedback: 'Feedback',
    btnBack: 'Back',
    btnNext: 'Next',
    btnDone: 'Done',
    lnkSource: 'Source on GitHub',
    lnkSearch: 'Search',
    searchPlaceholder: 'Search or paste jw.org link...',
    searchFailed: 'Search failed. Please try again later.',
    loadFailed: 'Loading failed. Please try again later.',
    retry: 'Retry',
    noTranscript: 'No transcript available',
    noResults: 'No results',
    transcript: 'Transcript',
    chromecast: 'Chromecast',
    btnDownload: 'Download',
    hdgSubtitles: 'Subtitles',
    lnkHome: 'jw.org',
    btnPlay: 'Play',
    btnPlayWithSubtitles: 'Play with subtitles',
    btnPlayWithoutSubtitles: 'Play without subtitles',
  },
  nl: {
    guide: 'Handleiding',
    tutorialTitle: 'JW Cast gebruiken',
    feedback: 'Feedback',
    btnBack: 'Vorige',
    btnNext: 'Volgende',
    btnDone: 'Klaar',
    lnkSource: 'Broncode op GitHub',
    lnkSearch: 'Zoeken',
    searchPlaceholder: 'Zoek of plak jw.org link...',
    searchFailed: 'Zoeken is mislukt. Probeer het later opnieuw.',
    loadFailed: 'Laden is mislukt. Probeer het later opnieuw.',
    retry: 'Opnieuw proberen',
    noTranscript: 'Geen transcript beschikbaar',
    noResults: 'Geen resultaten',
    transcript: 'Transcript',
    chromecast: 'Chromecast',
    btnDownload: 'Downloaden',
    hdgSubtitles: 'Ondertiteling',
    lnkHome: 'jw.org',
    btnPlay: 'Afspelen',
    btnPlayWithSubtitles: 'Afspelen met ondertiteling',
    btnPlayWithoutSubtitles: 'Afspelen zonder ondertiteling',
  },
};
