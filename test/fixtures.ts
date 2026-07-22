import type { Video } from '~/types';

/**
 * Minimal Video fixture. The store getters under test read only
 * `languageAgnosticNaturalKey`, so a thin partial cast keeps specs focused.
 */
export function makeVideo(key: string, overrides: Partial<Video> = {}): Video {
  return {
    languageAgnosticNaturalKey: key,
    title: key,
    ...overrides,
  } as unknown as Video;
}
