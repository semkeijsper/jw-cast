export interface Language {
  /** Watchtower language code e.g. `O` (Dutch) `E` (English) */
  code: string;
  /** ISO locale e.g. `nl`, `en`, `cmn_hans` */
  locale: string;
  /** Language name written in that language */
  vernacular: string;
  /** Language name in the currently-selected UI language */
  name: string;
  isLangPair?: boolean;
  isSignLanguage?: boolean;
  isRTL?: boolean;
}

export type Translations = { [key: string]: string };

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface Category {
  key: string;
  type: string;
  name: string;
  description: string;
  media: Video[];
}

export interface Video {
  guid: string;
  languageAgnosticNaturalKey: string;
  naturalKey: string;
  type: string;
  primaryCategory: string;
  title: string;
  description: string;
  firstPublished: string;
  duration: number;
  durationFormattedHHMM: string;
  durationFormattedMinSec: string;
  files: MediaFile[];
  images: Images;
  availableLanguages: string[];
}

export interface MediaFile {
  progressiveDownloadURL: string;
  checksum: string;
  filesize: number;
  modifiedDatetime: string;
  duration: number;
  label: string;
  mimetype: string;
  subtitled: boolean;
  subtitles: {
    url: string;
    modifiedDatetime: string;
  };
}

export interface Images {
  lss: { lg: string };
  lsr: { xl: string };
  pnr: { lg: string };
  wss: { lg: string; sm: string };
  sqr: { lg: string };
}

export interface WhatsAppChannel {
  link: string;
  ctaLabel: string;
  description: string;
  buttonLabel: string;
}

export interface TutorialStep {
  /** mdi icon name e.g. `mdi-translate` */
  icon: string;
  title: string;
  body: string;
}
