import type { CastWindow, RemotePlayer, RemotePlayerController } from '~/types/cast';

/**
 * Google Cast Web Sender SDK composable.
 *
 * The Cast SDK is loaded via the <script> tag in nuxt.config.ts.
 * When it becomes ready, it calls window.__onGCastApiAvailable.
 * We use the Default Media Receiver (CC1AD845) — no app registration required.
 *
 * Falls back gracefully when no Chromecast is available.
 */

// Shared across all component instances
const isAvailable = ref(false);
const isCastConnected = ref(false);
const isMediaLoaded = ref(false);
const isPaused = ref(false);
const isMuted = ref(false);
const volumeLevel = ref(1);
const currentTime = ref(0);
const duration = ref(0);
const canSeek = ref(false);
const canPause = ref(false);
const castDeviceName = ref('');
const castTitle = ref('');
// Identity of the media currently loaded on the receiver, so a dialog can tell
// whether the global cast session belongs to the video it is showing
const castVideoKey = ref('');
const hasCaptions = ref(false);
const captionsEnabled = ref(false);
// True from device selection until media is loaded on the receiver
const isConnecting = ref(false);

let remotePlayer: RemotePlayer | null = null;
let remotePlayerController: RemotePlayerController | null = null;
// Start position for the media currently being loaded (local → cast handoff)
let pendingStartTime = 0;

export function useCast() {
  function syncRemotePlayer() {
    if (!remotePlayer) {
      return;
    }
    // When switching videos the old media stays loaded for a moment, so only
    // a false → true transition marks the *new* media as loaded and ends the
    // connecting state
    const mediaJustLoaded = !isMediaLoaded.value && remotePlayer.isMediaLoaded;
    isCastConnected.value = remotePlayer.isConnected;
    isMediaLoaded.value = remotePlayer.isMediaLoaded;
    isPaused.value = remotePlayer.isPaused;
    isMuted.value = remotePlayer.isMuted;
    volumeLevel.value = remotePlayer.volumeLevel;
    currentTime.value = remotePlayer.currentTime;
    duration.value = remotePlayer.duration;
    canSeek.value = remotePlayer.canSeek;
    canPause.value = remotePlayer.canPause;
    // While connecting, the receiver still reports the previous media's title
    // (or none at all) — keep the locally set title of the media being loaded
    // until the new media has actually landed
    if (!isConnecting.value || mediaJustLoaded) {
      castDeviceName.value = remotePlayer.displayName || castDeviceName.value;
      castTitle.value = remotePlayer.title || castTitle.value;
    }
    if (mediaJustLoaded) {
      isConnecting.value = false;
      // Handoff from local playback: LoadRequest.currentTime is ignored by
      // some receivers, so seek explicitly once the media has landed
      if (pendingStartTime > 0) {
        if (Math.abs(remotePlayer.currentTime - pendingStartTime) > 2) {
          remotePlayer.currentTime = pendingStartTime;
          remotePlayerController?.seek();
        }
        pendingStartTime = 0;
      }
    }
  }

  function initCast() {
    const w = window as unknown as CastWindow;

    const configureCast = () => {
      if (isAvailable.value) {
        return;
      }
      try {
        const context = w.cast!.framework.CastContext.getInstance();
        context.setOptions({
          receiverApplicationId: 'CC1AD845',
          autoJoinPolicy: w.chrome!.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
        remotePlayer = new w.cast!.framework.RemotePlayer();
        remotePlayerController = new w.cast!.framework.RemotePlayerController(remotePlayer);
        remotePlayerController.addEventListener(
          w.cast!.framework.RemotePlayerEventType.ANY_CHANGE,
          syncRemotePlayer,
        );
        // SESSION_STARTING fires once the user picks a device — from there
        // until the media is actually loaded the bar shows a connecting state
        context.addEventListener(
          w.cast!.framework.CastContextEventType.SESSION_STATE_CHANGED,
          event => {
            const sessionState = w.cast!.framework.SessionState;
            if (event.sessionState === sessionState.SESSION_STARTING) {
              isConnecting.value = true;
            }
            else if (
              event.sessionState === sessionState.SESSION_START_FAILED
              || event.sessionState === sessionState.SESSION_ENDED
            ) {
              isConnecting.value = false;
              castVideoKey.value = '';
            }
          },
        );
        isAvailable.value = true;
      }
      catch {
        // Cast API present but configuration failed
      }
    };

    // Register callback for when the SDK loads (replaces the early inline stub)
    w.__onGCastApiAvailable = (available: boolean) => {
      if (!available) {
        return;
      }
      configureCast();
    };

    // Handle race condition: SDK may have already loaded and called the
    // early inline __onGCastApiAvailable before Vue mounted
    if (w.__castApiReady && w.cast?.framework && w.chrome?.cast) {
      configureCast();
    }
  }

  /**
   * Cast a video to a Chromecast device, optionally starting at `startTime`
   * seconds (handoff from local playback).
   * Returns true on success, false on failure or if Cast is unavailable.
   */
  async function castMedia(
    videoUrl: string,
    title: string,
    subtitleUrl?: string | null,
    startTime?: number,
    videoKey?: string,
  ): Promise<boolean> {
    if (!isAvailable.value) {
      return false;
    }
    castTitle.value = title;
    castVideoKey.value = videoKey ?? '';
    pendingStartTime = startTime ?? 0;
    try {
      const w = window as unknown as CastWindow;
      const context = w.cast!.framework.CastContext.getInstance();
      if (context.getCurrentSession()) {
        // Already casting — load the new media into the running session.
        // No SESSION_STARTING event fires here, so flag the switch manually.
        isConnecting.value = true;
      }
      else {
        await context.requestSession();
      }

      const mediaInfo = new w.chrome!.cast.media.MediaInfo(videoUrl, 'video/mp4');
      const metadata = new w.chrome!.cast.media.GenericMediaMetadata();
      metadata.title = title;
      mediaInfo.metadata = metadata;

      // Without an explicit style the Default Media Receiver renders
      // subtitles in a monospaced font on some devices
      const textTrackStyle = new w.chrome!.cast.media.TextTrackStyle();
      textTrackStyle.fontGenericFamily = w.chrome!.cast.media.TextTrackFontGenericFamily.SANS_SERIF;
      textTrackStyle.fontScale = 1;
      textTrackStyle.foregroundColor = '#FFFFFFFF';
      textTrackStyle.backgroundColor = '#00000000';
      textTrackStyle.edgeType = w.chrome!.cast.media.TextTrackEdgeType.OUTLINE;
      textTrackStyle.edgeColor = '#000000FF';
      mediaInfo.textTrackStyle = textTrackStyle;

      if (subtitleUrl) {
        const track = new w.chrome!.cast.media.Track(1, w.chrome!.cast.media.TrackType.TEXT);
        track.trackContentId = subtitleUrl;
        track.trackContentType = 'text/vtt';
        track.subtype = w.chrome!.cast.media.TextTrackType.SUBTITLES;
        track.name = 'Subtitles';
        mediaInfo.tracks = [track];
      }

      const request = new w.chrome!.cast.media.LoadRequest(mediaInfo);
      if (subtitleUrl) {
        request.activeTrackIds = [1];
      }
      if (startTime && startTime > 0) {
        request.currentTime = startTime;
      }

      const session = context.getCurrentSession();
      // Resolves when the receiver accepts the load request, which can be well
      // before the media is actually loaded — isConnecting is cleared by
      // syncRemotePlayer once the receiver reports isMediaLoaded
      await session!.loadMedia(request);
      hasCaptions.value = !!subtitleUrl;
      captionsEnabled.value = !!subtitleUrl;
      return true;
    }
    catch {
      isConnecting.value = false;
      pendingStartTime = 0;
      castVideoKey.value = '';
      return false;
    }
  }

  // Remote playback controls, driven by the RemotePlayerController

  function togglePlay() {
    remotePlayerController?.playOrPause();
  }

  function toggleMute() {
    remotePlayerController?.muteOrUnmute();
  }

  function setVolume(level: number) {
    if (!remotePlayer || !remotePlayerController) {
      return;
    }
    remotePlayer.volumeLevel = level;
    remotePlayerController.setVolumeLevel();
  }

  function seekTo(seconds: number) {
    if (!remotePlayer || !remotePlayerController) {
      return;
    }
    remotePlayer.currentTime = Math.min(Math.max(seconds, 0), duration.value);
    remotePlayerController.seek();
  }

  function skip(deltaSeconds: number) {
    seekTo(currentTime.value + deltaSeconds);
  }

  function toggleCaptions() {
    const w = window as unknown as CastWindow;
    const mediaSession = w.cast?.framework.CastContext.getInstance()
      .getCurrentSession()
      ?.getMediaSession();
    if (!mediaSession || !hasCaptions.value) {
      return;
    }
    const activeTrackIds = captionsEnabled.value ? [] : [1];
    const request = new w.chrome!.cast.media.EditTracksInfoRequest(activeTrackIds);
    mediaSession.editTracksInfo(
      request,
      () => {
        captionsEnabled.value = !captionsEnabled.value;
      },
      () => {},
    );
  }

  function stopCasting() {
    const w = window as unknown as CastWindow;
    w.cast?.framework.CastContext.getInstance().endCurrentSession(true);
  }

  return {
    isAvailable,
    isCastConnected,
    isMediaLoaded,
    isPaused,
    isMuted,
    volumeLevel,
    currentTime,
    duration,
    canSeek,
    canPause,
    castDeviceName,
    castTitle,
    castVideoKey,
    hasCaptions,
    captionsEnabled,
    isConnecting,
    initCast,
    castMedia,
    togglePlay,
    toggleMute,
    setVolume,
    seekTo,
    skip,
    toggleCaptions,
    stopCasting,
  };
}
