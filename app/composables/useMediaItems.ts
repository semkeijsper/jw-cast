import type { Video } from '~/types';

/**
 * Holds the media items backing the video dialog: the audio-language media
 * (`videoMedia`) and the subtitle-language media (`subtitleMedia`), refetched
 * when the selected video or either language changes.
 *
 * A video is only released in some languages (`Video.availableLanguages`), so
 * the persisted language preferences are reconciled against that list per video
 * — asking for one the video was never translated into returns `media: []`,
 * which used to leave the media `null` forever and park the dialog in a
 * permanent spinner. The store is never written to: the preference survives,
 * the substitution is scoped to this video.
 *
 * `onBeforeLanguageReload` runs before a language switch clears the media —
 * the player uses it to capture the playback position it should restore.
 */
export function useMediaItems(onBeforeLanguageReload?: () => void) {
  const languageStore = useLanguageStore();
  const uiStore = useUiStore();

  const loading = ref(true);
  const subtitleLoading = ref(false);
  const videoMedia = ref<Video | null>(null);
  const subtitleMedia = ref<Video | null>(null);

  // The languages this video actually exists in — both pickers' item list
  const availableLanguages = computed(() => {
    const video = uiStore.selectedVideo;
    if (!video) {
      return [];
    }
    return languageStore.languages.filter(l => video.availableLanguages.includes(l.code));
  });

  const availableCodes = computed(() => uiStore.selectedVideo?.availableLanguages);

  const resolvedVideoLanguage = computed(() =>
    resolveAvailableLanguage(
      languageStore.videoLanguageInfo,
      [
        languageStore.siteLanguageInfo,
        languageStore.findLanguageByLocale('en'),
        availableLanguages.value[0],
      ],
      availableCodes.value,
    ),
  );

  // Falls back to the audio language, which has itself already landed on
  // something the video exists in, so this chain always ends somewhere real
  const resolvedSubtitleLanguage = computed(() =>
    resolveAvailableLanguage(
      languageStore.subtitleLanguageInfo,
      [resolvedVideoLanguage.value],
      availableCodes.value,
    ),
  );

  const subtitleUnavailable = computed(
    () => languageStore.subtitleLanguageInfo.locale !== resolvedSubtitleLanguage.value.locale,
  );

  const captionUrl = computed(() => {
    const found = videoMedia.value?.files.find(f => f?.subtitles?.url);
    return found?.subtitles?.url ?? null;
  });

  const subtitleUrl = computed(() => {
    const found = subtitleMedia.value?.files.find(f => f?.subtitles?.url);
    return found?.subtitles?.url ?? null;
  });

  async function loadMediaItems() {
    if (!uiStore.selectedVideo) {
      return;
    }
    const { languageAgnosticNaturalKey: lank } = uiStore.selectedVideo;
    const needVideo = !videoMedia.value;
    const needSubtitle = !subtitleMedia.value;

    // Only a missing video media blanks the player frame; a subtitle-only fetch
    // must leave the live player mounted so its track can be swapped in place
    loading.value = needVideo;
    subtitleLoading.value = needSubtitle;

    const requests: Promise<void>[] = [];

    if (needVideo) {
      requests.push(
        fetchMediaItem(resolvedVideoLanguage.value.code, lank).then(media => {
          if (media) {
            videoMedia.value = media;
          }
        }),
      );
    }
    if (needSubtitle) {
      requests.push(
        fetchMediaItem(resolvedSubtitleLanguage.value.code, lank).then(media => {
          if (media) {
            subtitleMedia.value = media;
          }
        }),
      );
    }

    await Promise.allSettled(requests);
    loading.value = false;
    subtitleLoading.value = false;
  }

  // New video selected — reset and reload
  watch(
    () => uiStore.selectedVideo,
    video => {
      if (!video) {
        return;
      }
      videoMedia.value = null;
      subtitleMedia.value = null;
      // Pre-fill from selectedVideo if language matches
      if (languageStore.siteLanguageInfo.locale === resolvedVideoLanguage.value.locale) {
        videoMedia.value = video;
      }
      if (languageStore.siteLanguageInfo.locale === resolvedSubtitleLanguage.value.locale) {
        subtitleMedia.value = video;
      }
      loadMediaItems();
    },
  );

  // Audio language changed
  watch(
    () => languageStore.videoLanguage,
    () => {
      onBeforeLanguageReload?.();
      videoMedia.value = null;
      loadMediaItems();
    },
  );

  // Subtitle language changed. No resume capture here: the player is not
  // rebuilt for this, the subtitle track is swapped in place.
  watch(
    () => languageStore.subtitleLanguage,
    () => {
      subtitleMedia.value = null;
      loadMediaItems();
    },
  );

  return {
    loading,
    subtitleLoading,
    videoMedia,
    subtitleMedia,
    captionUrl,
    subtitleUrl,
    availableLanguages,
    resolvedVideoLanguage,
    resolvedSubtitleLanguage,
    subtitleUnavailable,
  };
}
