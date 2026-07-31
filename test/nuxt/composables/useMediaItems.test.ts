import type { Language, Video } from '~/types';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMediaItems } from '~/composables/useMediaItems';
import { useLanguageStore } from '~/stores/language';
import { useUiStore } from '~/stores/ui';
import { makeVideo } from '../../fixtures';

/**
 * The case under test: a video released in English but not in the user's
 * persisted subtitle language. `/media-items/O/<lank>` answers `{ media: [] }`
 * for those, which used to leave `subtitleMedia` null forever.
 */

const { fetchMediaItem } = vi.hoisted(() => ({ fetchMediaItem: vi.fn() }));
vi.mock('~/utils/api', async importOriginal => ({
  ...(await importOriginal<typeof import('~/utils/api')>()),
  fetchMediaItem,
}));

const languages: Language[] = [
  { code: 'O', locale: 'nl', vernacular: 'Nederlands', name: 'Dutch' },
  { code: 'E', locale: 'en', vernacular: 'English', name: 'English' },
  { code: 'S', locale: 'es', vernacular: 'español', name: 'Spanish' },
];

function mediaItem(code: string, availableLanguages: string[] = []): Video {
  return makeVideo('pub-test', {
    naturalKey: `pub-test_${code}`,
    availableLanguages,
    files: [{ subtitles: { url: `https://cdn.test/${code}.vtt` } }],
  } as unknown as Partial<Video>);
}

/** Site language `en` so the English catalog item is what the dialog opens with */
function openVideo(availableLanguages: string[], subtitleLocale: string) {
  const languageStore = useLanguageStore();
  languageStore.setLanguages(languages);
  languageStore.setSiteLanguage('en');
  languageStore.setVideoLanguage('en');
  languageStore.setSubtitleLanguage(subtitleLocale);

  const media = useMediaItems();
  useUiStore().openVideo(mediaItem('E', availableLanguages));
  return media;
}

beforeEach(() => {
  setActivePinia(createPinia());
  fetchMediaItem.mockImplementation(async (code: string) =>
    (code === 'O' ? undefined : mediaItem(code)),
  );
});

afterEach(() => {
  fetchMediaItem.mockReset();
});

describe('useMediaItems language resolution', () => {
  it('keeps the preferred subtitle language when the video has it', async() => {
    const media = openVideo(['E', 'O', 'S'], 'nl');
    await vi.waitFor(() => expect(media.subtitleLoading.value).toBe(false));

    expect(media.resolvedSubtitleLanguage.value.locale).toBe('nl');
    expect(media.subtitleUnavailable.value).toBe(false);
    expect(fetchMediaItem).toHaveBeenCalledWith('O', 'pub-test');
  });

  it('falls back to the audio language when the video has no such release', async() => {
    const media = openVideo(['E', 'S'], 'nl');
    await vi.waitFor(() => expect(media.subtitleLoading.value).toBe(false));

    expect(media.resolvedSubtitleLanguage.value.locale).toBe('en');
    expect(media.subtitleUnavailable.value).toBe(true);
    // The doomed request is never made — the empty response is what used to
    // leave subtitleMedia null and the buttons spinning
    expect(fetchMediaItem).not.toHaveBeenCalledWith('O', 'pub-test');
  });

  it('leaves the persisted preference alone', async() => {
    const media = openVideo(['E', 'S'], 'nl');
    await vi.waitFor(() => expect(media.subtitleLoading.value).toBe(false));

    expect(useLanguageStore().subtitleLanguage).toBe('nl');
  });

  it('resolves the subtitle url and clears loading on the fallback path', async() => {
    const media = openVideo(['E', 'S'], 'nl');
    await vi.waitFor(() => expect(media.subtitleLoading.value).toBe(false));

    expect(media.subtitleMedia.value).not.toBeNull();
    expect(media.subtitleUrl.value).toBe('https://cdn.test/E.vtt');
    expect(media.loading.value).toBe(false);
  });

  it('falls back for the audio language too', async() => {
    const languageStore = useLanguageStore();
    languageStore.setLanguages(languages);
    languageStore.setSiteLanguage('en');
    languageStore.setVideoLanguage('nl');
    languageStore.setSubtitleLanguage('nl');

    const media = useMediaItems();
    useUiStore().openVideo(mediaItem('E', ['E', 'S']));
    await vi.waitFor(() => expect(media.loading.value).toBe(false));

    expect(media.resolvedVideoLanguage.value.locale).toBe('en');
    expect(media.videoMedia.value).not.toBeNull();
  });

  it('offers only the languages the video was released in', () => {
    const media = openVideo(['E', 'S'], 'nl');
    expect(media.availableLanguages.value.map(l => l.locale)).toEqual(['en', 'es']);
  });
});
