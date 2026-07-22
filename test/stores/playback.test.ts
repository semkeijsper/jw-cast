import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePlaybackStore } from '~/stores/playback';
import { makeVideo } from '../fixtures';

const A = makeVideo('vid-A');
const B = makeVideo('vid-B');

beforeEach(() => setActivePinia(createPinia()));

describe('playback store — cast slice', () => {
  it('starts with both slices idle', () => {
    const s = usePlaybackStore();
    expect(s.cast.kind).toBe('idle');
    expect(s.local.kind).toBe('idle');
  });

  it('treats a connecting video as a target but not yet casting', () => {
    const s = usePlaybackStore();
    s.setCastConnecting(A);
    expect(s.cast.kind).toBe('connecting');
    expect(s.isCastTarget(A)).toBe(true);
    expect(s.isCastingVideo(A)).toBe(false);
  });

  it('casts only the matching video (identity — the regression)', () => {
    const s = usePlaybackStore();
    s.setCastConnecting(A);
    s.setCastActive({ video: A, position: 12, duration: 100, paused: false });
    expect(s.isCastingVideo(A)).toBe(true);
    expect(s.isCastTarget(B)).toBe(false);
    expect(s.isCastingVideo(B)).toBe(false);
    expect(s.positionFor(A)).toBe(12);
  });

  it('tracks position and retains lastCastPosition across castIdle (handoff source)', () => {
    const s = usePlaybackStore();
    s.setCastActive({ video: A, position: 5, duration: 100, paused: false });
    s.updateCast({ position: 42 });
    expect(s.lastCastPosition).toBe(42);
    s.castIdle();
    expect(s.cast.kind).toBe('idle');
    expect(s.lastCastPosition).toBe(42);
  });

  it('resets lastCastPosition when a new cast connects', () => {
    const s = usePlaybackStore();
    s.setCastActive({ video: A, position: 30, duration: 100, paused: false });
    s.castIdle();
    s.setCastConnecting(B);
    expect(s.lastCastPosition).toBe(0);
  });

  it('goes idle for a video that is not the cast target', () => {
    const s = usePlaybackStore();
    expect(s.isCastTarget(null)).toBe(false);
    expect(s.positionFor(null)).toBe(0);
  });
});

describe('playback store — coexistence', () => {
  it('holds an active cast and a ready local player simultaneously', () => {
    const s = usePlaybackStore();
    s.setCastActive({ video: A, position: 100, duration: 200, paused: false });
    s.setLocalReady(B);
    s.updateLocal({ position: 7 });

    expect(s.isCastingVideo(A)).toBe(true);
    expect(s.positionFor(A)).toBe(100); // cast clock for A
    expect(s.isCastingVideo(B)).toBe(false);
    expect(s.positionFor(B)).toBe(7); // local clock for B
    expect(s.localPositionOf(B)).toBe(7);
  });
});
