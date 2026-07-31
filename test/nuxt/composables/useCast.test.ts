import type { CastSession, CastWindow, MediaSession, RemotePlayer } from '~/types/cast';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCast } from '~/composables/useCast';
import { usePlaybackStore } from '~/stores/playback';

/**
 * Fake Cast SDK. The behaviour under test is the session race: the SDK's
 * `requestSession()` settles at SESSION_STARTING, so `getCurrentSession()` is
 * still null when it returns — casting must wait for SESSION_STARTED instead.
 */

const SessionState = {
  SESSION_STARTING: 'SESSION_STARTING',
  SESSION_STARTED: 'SESSION_STARTED',
  SESSION_START_FAILED: 'SESSION_START_FAILED',
  SESSION_ENDED: 'SESSION_ENDED',
  SESSION_RESUMED: 'SESSION_RESUMED',
};

const loadMedia = vi.fn(async () => {});
const sendMessage = vi.fn(async () => {});
const session: CastSession = {
  loadMedia,
  sendMessage,
  getMediaSession: () => sdk.mediaSession,
  getSessionObj: () => ({ media: sdk.mediaSession ? [sdk.mediaSession] : [] }),
  addEventListener: (type, handler) => {
    (sdk.sessionHandlers[type] ??= []).push(handler);
  },
  removeEventListener: (type, handler) => {
    sdk.sessionHandlers[type] = (sdk.sessionHandlers[type] ?? []).filter(h => h !== handler);
  },
};

const sdk = {
  handlers: [] as ((event: { sessionState: string }) => void)[],
  sessionHandlers: {} as Record<string, (() => void)[]>,
  currentSession: null as CastSession | null,
  mediaSession: null as MediaSession | null,
  emitSession(type: string) {
    [...(this.sessionHandlers[type] ?? [])].forEach(handler => handler());
  },
  // The live RemotePlayer the composable holds, so tests can drive it
  remotePlayer: null as RemotePlayer | null,
  syncRemotePlayer: () => {},
  requestSession: vi.fn(async (): Promise<string | null | undefined> => null),
  emit(sessionState: string) {
    this.handlers.forEach(handler => handler({ sessionState }));
  },
};

const context = {
  setOptions: () => {},
  requestSession: () => sdk.requestSession(),
  getCurrentSession: () => sdk.currentSession,
  endCurrentSession: () => {},
  addEventListener: (_type: string, handler: (event: { sessionState: string }) => void) => {
    sdk.handlers.push(handler);
  },
};

function stubClass() {
  return class {} as never;
}

function installSdk() {
  const w = window as unknown as CastWindow;
  w.cast = {
    framework: {
      CastContext: { getInstance: () => context },
      RemotePlayer: class {
        isConnected = false;
        isMediaLoaded = false;
        isPaused = false;
        isMuted = false;
        volumeLevel = 1;
        currentTime = 0;
        duration = 0;
        canSeek = false;
        canPause = false;
        displayName = 'Living Room';
        title = '';
        constructor() {
          sdk.remotePlayer = this as unknown as RemotePlayer;
        }
      },
      RemotePlayerController: class {
        addEventListener(_type: string, handler: () => void) {
          sdk.syncRemotePlayer = handler;
        }

        playOrPause() {}
        muteOrUnmute() {}
        setVolumeLevel() {}
        seek() {}
      },
      RemotePlayerEventType: { ANY_CHANGE: 'ANY_CHANGE' },
      CastContextEventType: { SESSION_STATE_CHANGED: 'SESSION_STATE_CHANGED' },
      SessionEventType: { MEDIA_SESSION: 'mediasession' },
      SessionState,
    },
  } as unknown as CastWindow['cast'];
  w.chrome = {
    cast: {
      media: {
        MediaInfo: class {
          metadata = {};
          tracks = [];
          textTrackStyle = {};
        },
        LoadRequest: class {
          activeTrackIds: number[] = [];
          currentTime = 0;
        },
        Track: class {},
        TrackType: { TEXT: 'TEXT' },
        TextTrackType: { SUBTITLES: 'SUBTITLES' },
        TextTrackStyle: class {},
        TextTrackFontGenericFamily: { SANS_SERIF: 'SANS_SERIF' },
        TextTrackEdgeType: { OUTLINE: 'OUTLINE' },
        EditTracksInfoRequest: stubClass(),
        GenericMediaMetadata: class {
          title = '';
        },
      },
      AutoJoinPolicy: { ORIGIN_SCOPED: 'origin_scoped' },
    },
  } as unknown as CastWindow['chrome'];
  w.__castApiReady = true;
}

// The composable's SDK wiring is module-level and installed once, so the fake
// context is a stable singleton whose behaviour each test reconfigures
beforeAll(() => {
  setActivePinia(createPinia());
  installSdk();
  useCast().initCast();
});

beforeEach(() => {
  loadMedia.mockClear();
  sendMessage.mockClear();
  sdk.sessionHandlers = {};
  sdk.currentSession = null;
  sdk.mediaSession = null;
  sdk.requestSession.mockReset();
  sdk.requestSession.mockResolvedValue(null);
  useCast().clearCastError();
});

const cast = () => useCast().castMedia('https://example.test/video.mp4', 'Some video');

describe('useCast — castMedia session handling', () => {
  it('waits for SESSION_STARTED before loading (the regression)', async () => {
    // requestSession settles while getCurrentSession() is still null
    sdk.requestSession.mockImplementation(async () => {
      sdk.emit(SessionState.SESSION_STARTING);
      setTimeout(() => {
        sdk.currentSession = session;
        sdk.emit(SessionState.SESSION_STARTED);
      }, 10);
      return null;
    });

    await expect(cast()).resolves.toBe(true);
    expect(loadMedia).toHaveBeenCalledOnce();
    expect(useCast().castError.value).toBeNull();
  });

  it('reuses a running session without opening the device picker', async () => {
    sdk.currentSession = session;

    await expect(cast()).resolves.toBe(true);
    expect(sdk.requestSession).not.toHaveBeenCalled();
    expect(loadMedia).toHaveBeenCalledOnce();
  });

  it('treats a dismissed device picker as a non-error', async () => {
    sdk.requestSession.mockResolvedValue('cancel');

    await expect(cast()).resolves.toBe(false);
    expect(loadMedia).not.toHaveBeenCalled();
    expect(useCast().castError.value).toBeNull();
  });

  it('surfaces an error when the session never starts', async () => {
    sdk.requestSession.mockImplementation(async () => {
      sdk.emit(SessionState.SESSION_STARTING);
      setTimeout(() => sdk.emit(SessionState.SESSION_START_FAILED), 10);
      return null;
    });

    await expect(cast()).resolves.toBe(false);
    expect(loadMedia).not.toHaveBeenCalled();
    expect(useCast().castError.value).toBe('session_unavailable');
  });

  it('surfaces the error code when the session start itself fails', async () => {
    sdk.requestSession.mockResolvedValue('receiver_unavailable');

    await expect(cast()).resolves.toBe(false);
    expect(useCast().castError.value).toBe('receiver_unavailable');
  });
});

describe('useCast — resuming a session after a reload', () => {
  // What a reloaded page starts from: the persisted key, an idle cast slice
  // and a RemotePlayer the SDK has already rejoined to the receiver
  function mediaSessionFixture(): MediaSession {
    return {
      editTracksInfo: () => {},
      activeTrackIds: [1],
      playerState: 'PAUSED',
      getEstimatedTime: () => 42,
      media: { duration: 300, tracks: [{} as never], metadata: { title: 'Some video' } },
    };
  }

  function seedResumedSession(videoKey: string | null, withMedia = true) {
    const playback = usePlaybackStore();
    playback.castIdle();
    playback.castTargetKey = videoKey;
    sdk.currentSession = session;
    sdk.mediaSession = withMedia ? mediaSessionFixture() : null;
    Object.assign(sdk.remotePlayer!, {
      isConnected: true,
      isMediaLoaded: false,
      isPaused: true,
      currentTime: 0,
      duration: 0,
      displayName: 'Living Room',
      title: '',
    });
    return playback;
  }

  it('re-adopts the running cast from the persisted key', () => {
    const playback = seedResumedSession('vid-A');

    sdk.emit(SessionState.SESSION_RESUMED);

    expect(playback.cast).toMatchObject({
      kind: 'active',
      videoKey: 'vid-A',
      position: 42,
      duration: 300,
      paused: true,
    });
    expect(useCast().castDeviceName.value).toBe('Living Room');
    expect(useCast().hasCaptions.value).toBe(true);
    expect(useCast().captionsEnabled.value).toBe(true);
  });

  it('promotes past connecting without any RemotePlayer event (paused receiver)', () => {
    // A paused receiver emits nothing, so the bar would spin forever if the
    // promotion waited on RemotePlayer.isMediaLoaded — the reported regression
    const playback = seedResumedSession('vid-A');
    Object.assign(sdk.remotePlayer!, { isMediaLoaded: false, currentTime: 0, duration: 0 });

    sdk.emit(SessionState.SESSION_RESUMED);

    expect(playback.cast.kind).toBe('active');
  });

  it('stays idle when there is no persisted key (e.g. a new tab)', () => {
    const playback = seedResumedSession(null);

    sdk.emit(SessionState.SESSION_RESUMED);

    expect(playback.cast.kind).toBe('idle');
  });

  it('asks the receiver for its media status, then adopts on MEDIA_SESSION', () => {
    // The reported failure: a rejoined session's media list is empty until a
    // MEDIA_STATUS arrives, and the receiver only broadcasts one on a state
    // change — so nothing ever comes unless the sender asks for it
    const playback = seedResumedSession('vid-A', false);

    sdk.emit(SessionState.SESSION_RESUMED);
    expect(playback.cast.kind).toBe('connecting');
    expect(sendMessage).toHaveBeenCalledWith(
      'urn:x-cast:com.google.cast.media',
      expect.objectContaining({ type: 'GET_STATUS' }),
    );

    // The status lands and the framework attaches the media session
    sdk.mediaSession = mediaSessionFixture();
    sdk.emitSession('mediasession');

    expect(playback.cast).toMatchObject({ kind: 'active', videoKey: 'vid-A', position: 42 });
  });

  it('adopts off the RemotePlayer when no media session is exposed', () => {
    const playback = seedResumedSession('vid-A', false);
    Object.assign(sdk.remotePlayer!, {
      isMediaLoaded: true,
      isPaused: false,
      currentTime: 12,
      duration: 200,
    });

    sdk.emit(SessionState.SESSION_RESUMED);

    expect(playback.cast).toMatchObject({
      kind: 'active',
      videoKey: 'vid-A',
      position: 12,
      duration: 200,
      paused: false,
    });
  });

  it('clears the persisted key when the session ends', () => {
    const playback = seedResumedSession('vid-A');
    sdk.emit(SessionState.SESSION_RESUMED);

    sdk.emit(SessionState.SESSION_ENDED);

    expect(playback.cast.kind).toBe('idle');
    expect(playback.castTargetKey).toBeNull();
  });
});
