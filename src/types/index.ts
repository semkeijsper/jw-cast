/* eslint-disable no-use-before-define */
export interface Language {
  /** Watchtower code such as `O` and `E` */
  code: string;
  /** ISO code such as `nl` and `en` */
  locale: string;
  /** Name of the language written in the language itself */
  vernacular: string;
  /** Name of the language written in the language used during the request */
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
  checksum: string;
  filesize: number;
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

// Search

export interface SearchResponse {
  layout: string[];
  results: Result[];
  messages: Message[];
  insight: QueryInsight;
  pagination: Pagination;
  filters: Filter[];
  sorts: Sort[];
}

/**
{
  "type": "item",
  "subtype": "videoCategory",
  "links": {
    "jw.org": "https://www.jw.org/finder?docid=1011214&category=2017Convention&wtlocale=O&appLanguage=O&prefer=content"
  },
  "lank": "mc-2017Convention",
  "context": "Speciale programma’s en bijeenkomsten",
  "title": "Geef het niet op!-congres 2017",
  "image": {
    "type": "lss",
    "url": "https://b.jw-cdn.org/images/jwb-categories/cat-programs-events/programs-events_univ_lss_lg.png"
  },
  "insight": {
    "rank": 2,
    "lank": "mc-2017Convention"
  }
}
 */
export interface Result {
  type: string;
  subtype: string;
  links: Links;
  lank: string;
  context: string;
  title: string;
  image: Image;
  duration: string;
  insight: Insight;
  snippet: string;
}

export interface Links {
  'jw.org': string;
}

export interface Image {
  type: string;
  url: string;
}

export interface Insight {
  rank: number;
  lank: string;
}

export interface Message {
  type: string;
  message: string;
}

export interface QueryInsight {
  query: string;
  filter: string;
  sort: string;
  offset: number;
  page: number;
  total: Total;
}

export interface Total {
  value: number;
  relation: string;
}

export interface Pagination {
  label: string;
  links: Link[];
}

export interface Link {
  type: string;
  label: string;
  link: string;
  selected: boolean;
}

export interface Filter {
  label: string;
  link: string;
  selected?: boolean;
}

export interface Sort {
  label: string;
  link: string;
  selected: boolean;
}
