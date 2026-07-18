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

// Search API types

export interface SearchResponse {
  layout: string[];
  results: SearchResult[];
  messages: SearchMessage[];
  insight: QueryInsight;
  pagination: Pagination;
  filters: Filter[];
  sorts: Sort[];
}

export interface SearchResult {
  type: string;
  subtype: string;
  links: { 'jw.org': string };
  lank: string;
  context?: string;
  title: string;
  image: { type: string; url: string };
  duration?: string;
  snippet?: string;
  insight: { rank: number; lank: string };
}

export interface SearchMessage {
  type: string;
  message: string;
}

export interface QueryInsight {
  query: string;
  filter: string;
  sort: string;
  offset: number;
  page: number;
  total: { value: number; relation: string };
}

export interface Pagination {
  label: string;
  links: PaginationLink[];
}

export interface PaginationLink {
  type: string;
  label: string;
  link: string;
  selected?: boolean;
}

export interface Filter {
  label: string;
  link: string;
  selected?: boolean;
}

export interface Sort {
  label: string;
  link: string;
  selected?: boolean;
}
