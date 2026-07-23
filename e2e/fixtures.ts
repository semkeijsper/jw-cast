import type { Category, Language, Video } from '~/types';
import type { SearchResponse } from '~/types/search';

export const LANGUAGES: Language[] = [
  { code: 'O', locale: 'nl', vernacular: 'Nederlands', name: 'Nederlands' },
  { code: 'E', locale: 'en', vernacular: 'English', name: 'Engels' },
];

export const TRANSLATIONS: Record<string, string> = {
  hdgVideos: "Video's",
  lnkSearch: 'Zoeken',
  searchPlaceholder: 'Zoeken',
};

export function makeVideo(lank: string, title: string): Video {
  return {
    guid: lank,
    languageAgnosticNaturalKey: lank,
    naturalKey: lank,
    type: 'video',
    primaryCategory: 'LatestVideos',
    title,
    description: '',
    firstPublished: '2026-01-01',
    duration: 600,
    durationFormattedHHMM: '10:00',
    durationFormattedMinSec: '10:00',
    files: [
      {
        progressiveDownloadURL: 'https://cdn.test/video-720.mp4',
        checksum: 'abc123',
        filesize: 1000,
        modifiedDatetime: '2026-01-01',
        duration: 600,
        label: '720p',
        mimetype: 'video/mp4',
        subtitled: true,
        subtitles: { url: 'https://cdn.test/sub.vtt', modifiedDatetime: '2026-01-01' },
      },
    ],
    images: {
      lss: { lg: 'https://cdn.test/lss.jpg' },
      lsr: { xl: 'https://cdn.test/lsr.jpg' },
      pnr: { lg: 'https://cdn.test/pnr.jpg' },
      wss: { lg: 'https://cdn.test/wss.jpg', sm: 'https://cdn.test/wss-sm.jpg' },
      sqr: { lg: 'https://cdn.test/sqr.jpg' },
    },
    availableLanguages: ['O', 'E'],
  };
}

export function makeCategory(name: string, videos: Video[]): { category: Category } {
  return { category: { key: name, type: 'container', name, description: '', media: videos } };
}

export const SEARCH: SearchResponse = {
  layout: [],
  results: [
    {
      type: 'video',
      subtype: 'video',
      links: { 'jw.org': '' },
      lank: 'pub-search_1_VIDEO',
      title: 'Search Result One',
      image: { type: 'wss', url: 'https://cdn.test/search.jpg' },
      insight: { rank: 1, lank: 'pub-search_1_VIDEO' },
    },
  ],
  messages: [{ type: 'info', message: '1 resultaat' }],
  insight: { query: 'x', filter: '', sort: 'rel', offset: 0, page: 1, total: { value: 1, relation: 'eq' } },
  pagination: { label: '1 resultaat', links: [] },
  filters: [],
  sorts: [
    { label: 'Relevantie', link: '?sort=rel' },
    { label: 'Nieuwste', link: '?sort=newest' },
    { label: 'Oudste', link: '?sort=oldest' },
  ],
};
