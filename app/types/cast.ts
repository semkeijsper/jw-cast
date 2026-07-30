// Google Cast SDK surface (minimal, avoids a large @types package)

export interface CastWindow {
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
      CastContextEventType: { SESSION_STATE_CHANGED: string };
      SessionState: {
        SESSION_STARTING: string;
        SESSION_STARTED: string;
        SESSION_START_FAILED: string;
        SESSION_ENDED: string;
        SESSION_RESUMED: string;
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

export interface CastContextInstance {
  setOptions: (opts: object) => void;
  // Resolves with null on success, or a chrome.cast.ErrorCode string on failure
  // (and rejects with one on some paths) — it resolves as soon as the session is
  // *starting*, so the session itself is not available yet when it settles
  requestSession: () => Promise<string | null | undefined>;
  getCurrentSession: () => CastSession | null;
  endCurrentSession: (stopCasting: boolean) => void;
  addEventListener: (type: string, handler: (event: { sessionState: string }) => void) => void;
}

export interface CastSession {
  loadMedia: (request: LoadRequest) => Promise<void>;
  getMediaSession: () => MediaSession | null;
}

export interface MediaSession {
  editTracksInfo: (request: object, onSuccess: () => void, onError: () => void) => void;
}

export interface MediaInfo {
  metadata: MediaMetadata;
  tracks: MediaTrack[];
  textTrackStyle: TextTrackStyle;
}

export interface MediaTrack {
  trackContentId: string;
  trackContentType: string;
  subtype: string;
  name: string;
}

export interface MediaMetadata {
  title: string;
}

export interface LoadRequest {
  activeTrackIds: number[];
  currentTime: number;
}

export interface TextTrackStyle {
  fontGenericFamily: string;
  fontScale: number;
  foregroundColor: string;
  backgroundColor: string;
  edgeType: string;
  edgeColor: string;
}

export interface RemotePlayer {
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

export interface RemotePlayerController {
  addEventListener: (type: string, handler: () => void) => void;
  playOrPause: () => void;
  muteOrUnmute: () => void;
  setVolumeLevel: () => void;
  seek: () => void;
}
