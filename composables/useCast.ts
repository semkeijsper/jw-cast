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
        getInstance(): CastContextInstance;
      };
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
        GenericMediaMetadata: new () => MediaMetadata;
      };
      AutoJoinPolicy: { ORIGIN_SCOPED: string };
    };
  };
}

interface CastContextInstance {
  setOptions(opts: object): void;
  requestSession(): Promise<void>;
  getCurrentSession(): CastSession | null;
}

interface CastSession {
  loadMedia(request: LoadRequest): Promise<void>;
}

interface MediaInfo {
  metadata: MediaMetadata;
  tracks: MediaTrack[];
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

// Shared across all component instances
const isAvailable = ref(false);

export function useCast() {
  function initCast() {
    if (typeof window === 'undefined') return;
    const w = window as unknown as CastWindow;

    const configureCast = () => {
      if (isAvailable.value) return;
      try {
        w.cast!.framework.CastContext.getInstance().setOptions({
          receiverApplicationId: 'CC1AD845',
          autoJoinPolicy: w.chrome!.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
        isAvailable.value = true;
      } catch {
        // Cast API present but configuration failed
      }
    };

    // Register callback for when the SDK loads (replaces the early inline stub)
    w.__onGCastApiAvailable = (available: boolean) => {
      if (!available) return;
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
    if (!isAvailable.value) return false;
    try {
      const w = window as unknown as CastWindow;
      const context = w.cast!.framework.CastContext.getInstance();
      await context.requestSession();

      const mediaInfo = new w.chrome!.cast.media.MediaInfo(videoUrl, 'video/mp4');
      const metadata = new w.chrome!.cast.media.GenericMediaMetadata();
      metadata.title = title;
      mediaInfo.metadata = metadata;

      if (subtitleUrl) {
        const track = new w.chrome!.cast.media.Track(1, w.chrome!.cast.media.TrackType.TEXT);
        track.trackContentId = subtitleUrl;
        track.trackContentType = 'text/vtt';
        track.subtype = w.chrome!.cast.media.TextTrackType.SUBTITLES;
        track.name = 'Subtitles';
        mediaInfo.tracks = [track];
      }

      const request = new w.chrome!.cast.media.LoadRequest(mediaInfo);
      if (subtitleUrl) request.activeTrackIds = [1];

      const session = context.getCurrentSession();
      await session!.loadMedia(request);
      return true;
    } catch {
      return false;
    }
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
    } catch {
      // non-Latin title — skip encoding
    }
    if (subtitleUrl) {
      url += `&subtitles=${btoa(subtitleUrl)}`;
    }
    return url;
  }

  return { isAvailable, initCast, castMedia, getSmPlayerUrl };
}
