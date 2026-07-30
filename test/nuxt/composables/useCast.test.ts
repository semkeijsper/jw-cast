import type { CastSession, CastWindow } from '~/types/cast';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCast } from '~/composables/useCast';

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
const session: CastSession = { loadMedia, getMediaSession: () => null };

const sdk = {
  handlers: [] as ((event: { sessionState: string }) => void)[],
  currentSession: null as CastSession | null,
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
      },
      RemotePlayerController: class {
        addEventListener() {}
        playOrPause() {}
        muteOrUnmute() {}
        setVolumeLevel() {}
        seek() {}
      },
      RemotePlayerEventType: { ANY_CHANGE: 'ANY_CHANGE' },
      CastContextEventType: { SESSION_STATE_CHANGED: 'SESSION_STATE_CHANGED' },
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
  sdk.currentSession = null;
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
