/* eslint-disable no-use-before-define */
export interface Language {
  code: string;
  locale: string;
  vernacular: string;
  name: string;
  isLangPair?: boolean;
  isSignLanguage?: boolean;
  isRTL?: boolean;
}

export type Translations = { [key: string]: string };

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
  firstPublished: Date;
  duration: number;
  durationFormattedHHMM: string;
  durationFormattedMinSec: string;
  files: File[];
  images: Images;
  availableLanguages: string[];
}

export interface File {
  progressiveDownloadURL: string;
  modifiedDatetime: Date;
  duration: number;
  label: string;
  subtitled: boolean;
  subtitles: {
    url: string;
    modifiedDatetime: Date;
  };
}

export interface Images {
  lss: {
    lg: string;
  };
  lsr: {
    xl: string;
  };
  pnr: {
    lg: string;
  };
  wss: {
    lg: string;
    sm: string;
  };
  sqr: {
    lg: string;
  };
}
