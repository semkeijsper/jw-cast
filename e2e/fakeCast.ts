import type { Page } from '@playwright/test';

/**
 * Inject a minimal fake of the Google Cast Web Sender SDK before the app boots,
 * mirroring only the surface `app/composables/useCast.ts` + `app/types/cast.ts`
 * touch. `requestSession()` and `loadMedia()` auto-progress the session so a
 * spec can start casting by driving the UI; `window.__fakeCast.disconnect()`
 * ends the session (cast → local handoff).
 */
export async function installFakeCast(page: Page) {
  await page.addInitScript(() => {
    const remotePlayer = {
      isConnected: false,
      isMediaLoaded: false,
      isPaused: false,
      isMuted: false,
      volumeLevel: 1,
      currentTime: 0,
      duration: 0,
      canSeek: true,
      canPause: true,
      displayName: 'Fake TV',
      title: '',
    };

    const anyChange: Array<(e?: unknown) => void> = [];
    const sessionCbs: Array<(e?: unknown) => void> = [];
    const fireAnyChange = () => anyChange.forEach(l => l({ field: 'anyChange', value: null }));
    const fireSession = (sessionState: string) => sessionCbs.forEach(l => l({ sessionState }));

    let currentSession: unknown = null;

    const session = {
      loadMedia(req: any) {
        remotePlayer.isConnected = true;
        remotePlayer.isMediaLoaded = true;
        remotePlayer.title = req?.media?.metadata?.title ?? '';
        remotePlayer.duration = 600;
        fireAnyChange();
        return Promise.resolve();
      },
      getMediaSession: () => ({ editTracksInfo: (_r: unknown, ok: () => void) => ok() }),
    };

    const context = {
      setOptions() {},
      getCurrentSession: () => currentSession,
      requestSession() {
        fireSession('SESSION_STARTING');
        currentSession = session;
        remotePlayer.isConnected = true;
        fireAnyChange();
        return Promise.resolve();
      },
      endCurrentSession() {
        currentSession = null;
        remotePlayer.isConnected = false;
        remotePlayer.isMediaLoaded = false;
        fireSession('SESSION_ENDED');
        fireAnyChange();
      },
      addEventListener(_t: string, cb: (e?: unknown) => void) {
        sessionCbs.push(cb);
      },
    };

    const framework = {
      CastContext: { getInstance: () => context },
      RemotePlayer() {
        return remotePlayer;
      },
      RemotePlayerController() {
        return {
          addEventListener(_t: string, cb: (e?: unknown) => void) {
            anyChange.push(cb);
          },
          playOrPause() {
            remotePlayer.isPaused = !remotePlayer.isPaused;
            fireAnyChange();
          },
          muteOrUnmute() {},
          setVolumeLevel() {},
          seek() {},
        };
      },
      RemotePlayerEventType: { ANY_CHANGE: 'anyChange' },
      CastContextEventType: { SESSION_STATE_CHANGED: 'sessionStateChanged' },
      SessionState: {
        SESSION_STARTING: 'SESSION_STARTING',
        SESSION_START_FAILED: 'SESSION_START_FAILED',
        SESSION_ENDED: 'SESSION_ENDED',
      },
    };

    const media = {
      MediaInfo(this: any, id: string) {
        this.contentId = id;
      },
      GenericMediaMetadata() {},
      TextTrackStyle() {},
      Track(this: any, id: number) {
        this.trackId = id;
      },
      LoadRequest(this: any, info: unknown) {
        this.media = info;
      },
      EditTracksInfoRequest() {},
      TrackType: { TEXT: 'TEXT' },
      TextTrackType: { SUBTITLES: 'SUBTITLES' },
      TextTrackFontGenericFamily: { SANS_SERIF: 'SANS_SERIF' },
      TextTrackEdgeType: { OUTLINE: 'OUTLINE' },
    };

    const w = window as any;
    w.cast = { framework };
    w.chrome = { cast: { AutoJoinPolicy: { ORIGIN_SCOPED: 'origin_scoped' }, media } };
    w.__castApiReady = true;
    w.__fakeCast = { disconnect: () => context.endCurrentSession() };
  });
}
