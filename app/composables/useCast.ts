/**
 * Google Cast Web Sender SDK composable.
 *
 * The Cast SDK is loaded via the <script> tag in nuxt.config.ts.
 * When it becomes ready, it calls window.__onGCastApiAvailable.
 * We use the Default Media Receiver (CC1AD845) — no app registration required.
 *
 * Falls back gracefully when no Chromecast is available.
 */

// Cast SDK types (minimal, avoids a large @types package)
interface CastWindow {
  __onGCastApiAvailable?: (isAvailable: boolean) => void;
  __castApiReady?: boolean;
  cast?: {
    framework: {
      CastContext: {
        getInstance: () => CastContextInstance;
      };
      RemotePlayer: new () => RemotePlayer;
      RemotePlayerController: new (player: RemotePlayer) => RemotePlayerController;
      RemotePlayerEventType: { ANY_CHANGE: string };
      SessionState: {
        SESSION_STARTED: string;
        SESSION_ENDED: string;
      };
    };
  };
  chrome?: {
    cast: {
      media: {
        MediaInfo: new (url: string, contentType: string) => MediaInfo;
        LoadRequest: new (mediaInfo: MediaInfo) => LoadRequest;
        Track: new (id: number, type: string) => MediaTrack;
        TrackType: { TEXT: string };
        TextTrackType: { SUBTITLES: string };
        TextTrackStyle: new () => TextTrackStyle;
        TextTrackFontGenericFamily: { SANS_SERIF: string };
        TextTrackEdgeType: { OUTLINE: string };
        EditTracksInfoRequest: new (activeTrackIds: number[]) => object;
        GenericMediaMetadata: new () => MediaMetadata;
      };
      AutoJoinPolicy: { ORIGIN_SCOPED: string };
    };
  };
}

interface CastContextInstance {
  setOptions: (opts: object) => void;
  requestSession: () => Promise<void>;
  getCurrentSession: () => CastSession | null;
  endCurrentSession: (stopCasting: boolean) => void;
}

interface CastSession {
  loadMedia: (request: LoadRequest) => Promise<void>;
  getMediaSession: () => MediaSession | null;
}

interface MediaSession {
  editTracksInfo: (request: object, onSuccess: () => void, onError: () => void) => void;
}

interface MediaInfo {
  metadata: MediaMetadata;
  tracks: MediaTrack[];
  textTrackStyle: TextTrackStyle;
}

interface MediaTrack {
  trackContentId: string;
  trackContentType: string;
  subtype: string;
  name: string;
}

interface MediaMetadata {
  title: string;
}

interface LoadRequest {
  activeTrackIds: number[];
}

interface TextTrackStyle {
  fontGenericFamily: string;
  fontScale: number;
  foregroundColor: string;
  backgroundColor: string;
  edgeType: string;
  edgeColor: string;
}

interface RemotePlayer {
  isConnected: boolean;
  isMediaLoaded: boolean;
  isPaused: boolean;
  isMuted: boolean;
  volumeLevel: number;
  currentTime: number;
  duration: number;
  canSeek: boolean;
  canPause: boolean;
  displayName: string;
  title: string;
}

interface RemotePlayerController {
  addEventListener: (type: string, handler: () => void) => void;
  playOrPause: () => void;
  muteOrUnmute: () => void;
  setVolumeLevel: () => void;
  seek: () => void;
}

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
const hasCaptions = ref(false);
const captionsEnabled = ref(false);

let remotePlayer: RemotePlayer | null = null;
let remotePlayerController: RemotePlayerController | null = null;

export function useCast() {
  function syncRemotePlayer() {
    if (!remotePlayer) {
      return;
    }
    isCastConnected.value = remotePlayer.isConnected;
    isMediaLoaded.value = remotePlayer.isMediaLoaded;
    isPaused.value = remotePlayer.isPaused;
    isMuted.value = remotePlayer.isMuted;
    volumeLevel.value = remotePlayer.volumeLevel;
    currentTime.value = remotePlayer.currentTime;
    duration.value = remotePlayer.duration;
    canSeek.value = remotePlayer.canSeek;
    canPause.value = remotePlayer.canPause;
    castDeviceName.value = remotePlayer.displayName;
    castTitle.value = remotePlayer.title;
  }

  function initCast() {
    if (typeof window === 'undefined') {
      return;
    }
    const w = window as unknown as CastWindow;

    const configureCast = () => {
      if (isAvailable.value) {
        return;
      }
      try {
        w.cast!.framework.CastContext.getInstance().setOptions({
          receiverApplicationId: 'CC1AD845',
          autoJoinPolicy: w.chrome!.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
        remotePlayer = new w.cast!.framework.RemotePlayer();
        remotePlayerController = new w.cast!.framework.RemotePlayerController(remotePlayer);
        remotePlayerController.addEventListener(
          w.cast!.framework.RemotePlayerEventType.ANY_CHANGE,
          syncRemotePlayer,
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
   * Cast a video to a Chromecast device.
   * Returns true on success, false on failure or if Cast is unavailable.
   */
  async function castMedia(
    videoUrl: string,
    title: string,
    subtitleUrl?: string | null,
  ): Promise<boolean> {
    if (!isAvailable.value) {
      return false;
    }
    try {
      const w = window as unknown as CastWindow;
      const context = w.cast!.framework.CastContext.getInstance();
      await context.requestSession();

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

      const session = context.getCurrentSession();
      await session!.loadMedia(request);
      hasCaptions.value = !!subtitleUrl;
      captionsEnabled.value = !!subtitleUrl;
      return true;
    }
    catch {
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

  /**
   * Fallback: build an SMPlayer Chromecast URL.
   * Used when the native Cast SDK is unavailable.
   */
  function getSmPlayerUrl(videoUrl: string, title: string, subtitleUrl?: string | null): string {
    const encodedVideo = btoa(videoUrl);
    // sfgc = subtitle foreground colour (#ffffff), ss = subtitle size (1.1)
    let url = `https://chromecast.smplayer.info/index.php?sfgc=I2ZmZmZmZg==&ss=MS4x&url=${encodedVideo}`;
    try {
      url += `&title=${btoa(title.replaceAll('—', '-'))}`;
    }
    catch {
      // non-Latin title — skip encoding
    }
    if (subtitleUrl) {
      url += `&subtitles=${btoa(subtitleUrl)}`;
    }
    return url;
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
    hasCaptions,
    captionsEnabled,
    initCast,
    castMedia,
    togglePlay,
    toggleMute,
    setVolume,
    seekTo,
    skip,
    toggleCaptions,
    stopCasting,
    getSmPlayerUrl,
  };
}
