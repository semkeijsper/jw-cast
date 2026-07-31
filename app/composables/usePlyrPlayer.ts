import type Plyr from 'plyr';
import type { Track } from 'plyr';
import type { Ref } from 'vue';
import type { Language, Video } from '~/types';
import { useDisplay } from 'vuetify';

// mdi script-text-outline — same icon as the transcript button
const TRANSCRIPT_ICON_PATH = 'M15,20A1,1 0 0,0 16,19V4H8A1,1 0 0,0 7,5V16H5V5A3,3 0 0,1 8,2H19A3,3 0 0,1 22,5V6H20V5A1,1 0 0,0 19,4A1,1 0 0,0 18,5V9L18,19A3,3 0 0,1 15,22H5A3,3 0 0,1 2,19V18H13A2,2 0 0,0 15,20M9,6H14V8H9V6M9,10H14V12H9V10M9,14H14V16H9V14Z';

/**
 * Owns the Plyr lifecycle for the video dialog: (re-)initialization behind a
 * load-id race guard, playback-position restore across rebuilds, the injected
 * transcript control, and the fullscreen Escape capture.
 */
export function usePlyrPlayer(
  playerEl: Ref<HTMLVideoElement | null>,
  source: {
    videoMedia: Ref<Video | null>;
    captionUrl: Ref<string | null>;
    subtitleUrl: Ref<string | null>;
    poster: Ref<string | undefined>;
    // Resolved against the video, not the raw preference — the track labels and
    // srclangs have to name the language the .vtt is actually in
    videoLanguage: Ref<Language>;
    subtitleLanguage: Ref<Language>;
  },
) {
  const uiStore = useUiStore();
  const playback = usePlaybackStore();
  const { smAndDown } = useDisplay();

  let player: Plyr | undefined = undefined;
  let playerLoadId = 0;
  // The <video> the current instance was constructed on, and the media its
  // source was last set from — together they tell a host remount apart from a
  // language switch
  let playerHost: HTMLVideoElement | null = null;
  let loadedVideoMedia: Video | null = null;
  // Playback position to restore after a language switch rebuilds the player
  let resumeTime = 0;

  let transcriptBtn: HTMLButtonElement | null = null;

  function syncTranscriptButton() {
    transcriptBtn?.setAttribute('aria-pressed', String(uiStore.transcriptPanel));
  }

  // Plyr has no API for extra controls; insert a button into its control bar.
  // Runs on every 'ready' because assigning player.source rebuilds the controls DOM.
  function injectTranscriptButton() {
    if (smAndDown.value || !player) {
      return;
    }
    const controls = player.elements.controls;
    if (!controls || controls.querySelector('.plyr__control--transcript')) {
      return;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'plyr__controls__item plyr__control plyr__control--transcript';
    btn.innerHTML
      = `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">`
        + `<path fill="currentColor" d="${TRANSCRIPT_ICON_PATH}"/></svg>`
        + '<span class="plyr__sr-only">Transcript</span>';
    btn.addEventListener('click', () => uiStore.setTranscriptPanel(!uiStore.transcriptPanel));
    const fullscreenBtn = player.elements.buttons.fullscreen;
    if (fullscreenBtn && fullscreenBtn.parentElement === controls) {
      fullscreenBtn.before(btn);
    }
    else {
      controls.append(btn);
    }
    transcriptBtn = btn;
    syncTranscriptButton();
  }

  watch(() => uiStore.transcriptPanel, syncTranscriptButton);

  // Escape while in fullscreen should only exit fullscreen (browser default),
  // not also bubble into Vuetify's overlay and close the whole dialog
  function onKeydownCapture(e: KeyboardEvent) {
    if (e.key === 'Escape' && document.fullscreenElement) {
      e.stopImmediatePropagation();
    }
  }
  onMounted(() => document.addEventListener('keydown', onKeydownCapture, true));
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydownCapture, true));

  // Mobile rotate-to-fullscreen: entering landscape while playing goes
  // fullscreen; returning to portrait always leaves it. Desktop and casting
  // (player is undefined) are excluded by the guards.
  const landscapeQuery = window.matchMedia('(orientation: landscape)');
  function onOrientationChange(e: MediaQueryListEvent) {
    if (!smAndDown.value || !player) {
      return;
    }
    if (e.matches) {
      // requestFullscreen needs transient user activation; without it the
      // browser rejects anyway, so skip instead of throwing (e.g. rotating
      // long after the last tap, or the devtools rotate button)
      if (navigator.userActivation?.isActive) {
        player.fullscreen.enter();
      }
    }
    else if (player.fullscreen.active) {
      player.fullscreen.exit();
    }
  }
  onMounted(() => landscapeQuery.addEventListener('change', onOrientationChange));
  onBeforeUnmount(() => landscapeQuery.removeEventListener('change', onOrientationChange));

  function mediaEl() {
    return player?.elements.container?.querySelector('video') ?? null;
  }

  // Mirrors Plyr's own captions on/off preference, which it persists but does
  // not expose as a readable property
  let captionsEnabled = true;

  // Plyr persists the last caption language it was told about (localStorage)
  // and that stored value wins over config.captions.language on every setup,
  // so the selected subtitle language has to be re-asserted rather than assumed.
  function syncCaptionLanguage() {
    const locale = source.subtitleLanguage.value.locale;
    if (!player || !source.subtitleUrl.value) {
      return;
    }
    // Plyr leaves captions.currentTrack pointing at a stale index when the
    // selected track disappears, so player.language only reports the truth
    // while captions are actually on (currentTrack is -1 otherwise)
    if (player.currentTrack !== -1 && player.language === locale) {
      return;
    }
    // The language setter is non-passive: it selects the track and forces
    // captions on, clobbering the user's own toggle — put that back
    const wanted = captionsEnabled;
    player.language = locale;

    // Plyr only refreshes its reference to the selected track node when the
    // track *index* changes. Swapping one subtitle track for another reuses
    // the index, so Plyr keeps re-enabling the track it just dropped and the
    // new one is never put into rendering mode. Its cue lookup goes by index
    // and is already correct, so only the mode has to be applied by hand.
    // 'hidden' means "cues live, but the browser does not draw them" — Plyr
    // draws them itself behind its own captions-active class, so this is also
    // safe to apply while captions are toggled off, and it is what makes them
    // show the right language when they are toggled back on.
    const tracks = mediaEl()?.textTracks;
    for (const track of tracks ?? []) {
      if (track.kind === 'subtitles' && track.language === locale) {
        track.mode = 'hidden';
      }
    }

    if (!wanted) {
      player.toggleCaptions(false);
    }
  }

  // A subtitle-language switch changes only the <track>, never the video file.
  // Plyr runs with captions.update, so it re-reads media.textTracks on
  // addtrack/removetrack — swapping the element in place keeps playback running
  // instead of rebuilding the player. Only kind="subtitles" is touched; the
  // kind="captions" track belongs to the audio language.
  function applySubtitleTrack() {
    const media = mediaEl();
    if (!player || !media) {
      return;
    }

    // Dropping the active track makes Plyr switch captions off and emit
    // captionsdisabled, which is not a user choice — snapshot the preference
    // first and put it back once the swap has settled
    const wanted = captionsEnabled;

    for (const t of media.querySelectorAll('track[kind="subtitles"]')) {
      t.remove();
    }

    const url = source.subtitleUrl.value;
    if (!url) {
      setTimeout(() => {
        captionsEnabled = wanted;
      });
      return;
    }

    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = languageLabel(source.subtitleLanguage.value);
    track.srclang = source.subtitleLanguage.value.locale;
    track.src = url;

    // Plyr only registers a track once its own addtrack handler has populated
    // captions.meta, so select the language after that handler — never on the
    // same tick as the append
    media.textTracks.addEventListener('addtrack', () => {
      captionsEnabled = wanted;
      syncCaptionLanguage();
    }, { once: true });
    media.append(track);
  }

  watch(source.subtitleUrl, () => {
    // A video or audio-language change replaces videoMedia; that path needs a
    // full source assignment and is handled by loadPlayer instead
    if (player && source.videoMedia.value === loadedVideoMedia) {
      applySubtitleTrack();
    }
  });

  async function loadPlayer() {
    if (!playerEl.value || !source.videoMedia.value) {
      return;
    }

    // The dialog-open and loading watchers can both request an init in the same
    // tick; without this guard two calls interleave across the dynamic import
    // and the second destroys the first mid-setup, leaving a dead player
    const id = ++playerLoadId;
    const { default: Plyr } = await import('plyr');
    if (id !== playerLoadId || !playerEl.value || !source.videoMedia.value) {
      return;
    }

    // Plyr's source setter swaps the media element in place and only soft-
    // destroys, so a live instance is reusable; it has to be thrown away just
    // when Vue remounted the host it was built on (dialog reopen, cast handoff)
    if (player && playerHost !== playerEl.value) {
      player.destroy();
      player = undefined;
    }

    if (uiStore.selectedVideo) {
      playback.setLocalLoading(uiStore.selectedVideo);
    }

    const tracks: Track[] = [];
    if (source.captionUrl.value) {
      tracks.push({
        kind: 'captions',
        label: languageLabel(source.videoLanguage.value),
        srcLang: source.videoLanguage.value.locale,
        src: source.captionUrl.value,
      });
    }
    if (source.subtitleUrl.value) {
      tracks.push({
        kind: 'subtitles',
        label: languageLabel(source.subtitleLanguage.value),
        srcLang: source.subtitleLanguage.value.locale,
        src: source.subtitleUrl.value,
      });
    }

    // Listeners bind once per instance — Plyr's soft destroy keeps the
    // container they live on, so re-registering on reuse would stack them
    if (!player) {
      playerHost = playerEl.value;
      player = new Plyr(playerEl.value, {
        // Plyr's default control bar minus the volume slider on mobile: it crowds
        // out the flex-growing progress bar on narrow portrait viewports. The mute
        // toggle stays; hardware volume keys handle levels there.
        controls: [
          'play-large', 'play', 'progress', 'current-time', 'mute',
          ...(smAndDown.value ? [] : ['volume']),
          'captions', 'settings', 'pip', 'airplay', 'fullscreen',
        ],
        quality: { default: 1080, options: [1080, 720, 480, 360, 240] },
        captions: { active: true, language: source.subtitleLanguage.value.locale, update: true },
        // Few enough options that the settings menu can't soft-lock
        speed: { selected: 1, options: [0.75, 1, 1.25, 1.5] },
        // Fullscreen the whole row so the transcript panel stays visible (desktop)
        ...(smAndDown.value ? {} : { fullscreen: { container: '.player-row' } }),
      });
      player.on('captionsenabled', () => {
        captionsEnabled = true;
      });
      player.on('captionsdisabled', () => {
        captionsEnabled = false;
      });
      player.on('ready', injectTranscriptButton);
      player.on('ready', syncCaptionLanguage);
      player.on('ready', () => {
        if (uiStore.selectedVideo) {
          playback.setLocalReady(uiStore.selectedVideo);
        }
      });

      player.on('timeupdate', () => {
        playback.updateLocal({ position: player?.currentTime ?? 0 });
      });
      player.on('loadedmetadata', () => {
        playback.updateLocal({ duration: player?.duration ?? 0 });
      });
      const syncPaused = () => playback.updateLocal({ paused: player?.paused ?? true });
      player.on('play', syncPaused);
      player.on('pause', syncPaused);
      player.on('playing', syncPaused);
      player.on('ended', syncPaused);
    }

    loadedVideoMedia = source.videoMedia.value;

    player.source = {
      type: 'video',
      poster: source.poster.value,
      title: uiStore.selectedVideo?.title,
      sources: source.videoMedia.value.files.map(f => ({
        src: f.progressiveDownloadURL,
        type: f.mimetype,
        size: Number.parseInt(f.label.slice(0, -1), 10),
      })),
      tracks,
    };

    const resume = resumeTime;
    resumeTime = 0;
    if (resume > 0) {
      const instance = player;
      // Plyr's source setter swaps in a fresh media element asynchronously, so
      // seek only once it re-emits 'ready'. Set the element's currentTime
      // directly (Plyr's own setter bails while duration is still unknown) —
      // before metadata this records the default playback start position —
      // and re-assert on loadedmetadata once the real duration is in.
      instance.once('ready', () => {
        const media = instance.elements.container?.querySelector('video');
        if (media) {
          media.currentTime = resume;
        }
      });
      instance.once('loadedmetadata', () => {
        instance.currentTime = resume;
      });
    }
  }

  // Remember the current position so the next loadPlayer restores it
  function captureResume() {
    resumeTime = player?.currentTime ?? playback.localPositionOf(uiStore.selectedVideo);
  }

  // Explicit position for the next loadPlayer (e.g. resuming after a cast)
  function markResume(seconds: number) {
    resumeTime = seconds;
  }

  function resetResume() {
    resumeTime = 0;
  }

  function seekTo(seconds: number) {
    if (player) {
      player.currentTime = seconds;
    }
  }

  // Full teardown on dialog close — cheaper than keeping a live instance
  // (and its buffers) around; reopening runs loadPlayer from scratch
  function destroy() {
    player?.destroy();
    player = undefined;
    playerHost = null;
    loadedVideoMedia = null;
    playback.localIdle();
  }

  return { loadPlayer, captureResume, markResume, resetResume, seekTo, destroy };
}
