import type { CastWindow } from '~/types/cast';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCast } from '~/composables/useCast';

/**
 * SDK readiness, in its own file because `useCast`'s wiring is module-level and
 * `isAvailable` latches — this suite needs it starting false.
 *
 * cast_sender.js captures window.__onGCastApiAvailable when it runs and then
 * replaces the global with its own two-step counter. Reassigning that global
 * from app code clobbered the counter, so whether the Cast button ever came
 * alive depended on script caching: dead on a cold load, fine after a reload.
 */

const setOptions = vi.fn();

function installSdk() {
  const w = window as unknown as CastWindow;
  w.cast = {
    framework: {
      CastContext: {
        getInstance: () => ({
          setOptions,
          requestSession: async () => null,
          getCurrentSession: () => null,
          endCurrentSession: () => {},
          addEventListener: () => {},
        }),
      },
      RemotePlayer: class {},
      RemotePlayerController: class {
        addEventListener() {}
      },
      RemotePlayerEventType: { ANY_CHANGE: 'ANY_CHANGE' },
      CastContextEventType: { SESSION_STATE_CHANGED: 'SESSION_STATE_CHANGED' },
      SessionState: {
        SESSION_STARTING: 'SESSION_STARTING',
        SESSION_STARTED: 'SESSION_STARTED',
        SESSION_START_FAILED: 'SESSION_START_FAILED',
        SESSION_ENDED: 'SESSION_ENDED',
        SESSION_RESUMED: 'SESSION_RESUMED',
      },
    },
  } as unknown as CastWindow['cast'];
  w.chrome = {
    cast: { AutoJoinPolicy: { ORIGIN_SCOPED: 'origin_scoped' } },
  } as unknown as CastWindow['chrome'];
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.useFakeTimers();
  setOptions.mockClear();
  const w = window as unknown as CastWindow;
  delete w.cast;
  delete w.chrome;
});

afterEach(() => vi.useRealTimers());

describe('useCast — SDK readiness', () => {
  it('configures once the SDK globals appear after mount (the regression)', () => {
    const { isAvailable, initCast } = useCast();

    // Cold load: the SDK scripts are still in flight when Vue mounts
    initCast();
    expect(isAvailable.value).toBe(false);

    installSdk();
    vi.advanceTimersByTime(200);

    expect(isAvailable.value).toBe(true);
    expect(setOptions).toHaveBeenCalledOnce();
  });

  it('never reassigns window.__onGCastApiAvailable', () => {
    const w = window as unknown as CastWindow;
    // The stub cast_sender.js captures; overwriting it breaks its ready counter
    const stub = () => {};
    w.__onGCastApiAvailable = stub;

    useCast().initCast();
    installSdk();
    vi.advanceTimersByTime(200);

    expect(w.__onGCastApiAvailable).toBe(stub);
  });
});
