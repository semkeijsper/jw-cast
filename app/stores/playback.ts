import type { Video } from '~/types';
import type { CastState, LocalState } from '~/types/playback';

/**
 * Single owner of playback session state, one slice per transport. Cast and
 * local can be non-idle at the same time (the cast session is app-global and
 * survives dialog close; the local player is dialog-scoped), so they are kept
 * as two concurrent slices rather than one exclusive union.
 *
 * The two drivers write here: `useCast` drives `cast`, `usePlyrPlayer` drives
 * `local`. Components read the identity-aware getters for the video they show.
 */
export const usePlaybackStore = defineStore('playback', () => {
  const cast = ref<CastState>({ kind: 'idle' });
  const local = ref<LocalState>({ kind: 'idle' });
  // Last known cast position, retained across `castIdle` so the local player
  // can resume there on the cast → local handoff (disconnect while open)
  const lastCastPosition = ref(0);

  function keyOf(video: Video) {
    return video.languageAgnosticNaturalKey;
  }

  // --- cast slice (driven by useCast) ---
  // Seed lastCastPosition with the local handoff position so a cancelled or
  // failed cast (e.g. the device picker dismissed without a selection) restores
  // the local player to where it was, not to 0
  function setCastConnecting(video: Video, startPosition = 0) {
    cast.value = { kind: 'connecting', video };
    lastCastPosition.value = startPosition;
  }
  function setCastActive(patch: {
    video: Video;
    position: number;
    duration: number;
    paused: boolean;
  }) {
    cast.value = { kind: 'active', ...patch };
    if (patch.position > 0) {
      lastCastPosition.value = patch.position;
    }
  }
  function updateCast(patch: Partial<{ position: number; duration: number; paused: boolean }>) {
    if (cast.value.kind !== 'active') {
      return;
    }
    cast.value = { ...cast.value, ...patch };
    if (patch.position !== undefined && patch.position > 0) {
      lastCastPosition.value = patch.position;
    }
  }
  function castIdle() {
    cast.value = { kind: 'idle' };
  }

  // --- local slice (driven by usePlyrPlayer) ---
  function setLocalLoading(video: Video) {
    local.value = { kind: 'loading', video };
  }
  function setLocalReady(video: Video) {
    local.value = { kind: 'ready', video, position: 0, duration: 0, paused: true };
  }
  function updateLocal(patch: Partial<{ position: number; duration: number; paused: boolean }>) {
    if (local.value.kind !== 'ready') {
      return;
    }
    local.value = { ...local.value, ...patch };
  }
  function localIdle() {
    local.value = { kind: 'idle' };
  }

  // --- identity-aware reads (for a dialog's selectedVideo) ---
  function isCastTarget(video: Video | null): boolean {
    if (!video) {
      return false;
    }
    return (cast.value.kind === 'connecting' || cast.value.kind === 'active')
      && keyOf(cast.value.video) === keyOf(video);
  }
  function isCastingVideo(video: Video | null): boolean {
    if (!video) {
      return false;
    }
    return cast.value.kind === 'active' && keyOf(cast.value.video) === keyOf(video);
  }
  function localPositionOf(video: Video | null): number {
    if (video && local.value.kind === 'ready' && keyOf(local.value.video) === keyOf(video)) {
      return local.value.position;
    }
    return 0;
  }
  // Transcript clock: the cast position when this video is casting, else local
  function positionFor(video: Video | null): number {
    if (isCastingVideo(video) && cast.value.kind === 'active') {
      return cast.value.position;
    }
    return localPositionOf(video);
  }

  return {
    cast,
    local,
    lastCastPosition,
    setCastConnecting,
    setCastActive,
    updateCast,
    castIdle,
    setLocalLoading,
    setLocalReady,
    updateLocal,
    localIdle,
    isCastTarget,
    isCastingVideo,
    localPositionOf,
    positionFor,
  };
});
