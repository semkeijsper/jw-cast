import type { Video } from '~/types';

/**
 * Per-media playback session state for each transport, carrying enough identity
 * to tell *which* video a transport is playing. Device/config state (volume,
 * device name, captions, seek/pause capability) is NOT here — it lives as refs
 * in `useCast`, since it is not per-media.
 *
 * The cast slice holds only the `languageAgnosticNaturalKey`, not the `Video`:
 * a cast session survives a page reload (ORIGIN_SCOPED auto-join) but a `Video`
 * object does not, so the identity has to be something restorable from storage.
 * The local slice is dialog-scoped and always has the real object.
 */

export type CastState
  = | { kind: 'idle' }
    | { kind: 'connecting'; videoKey: string }
    | { kind: 'active'; videoKey: string; position: number; duration: number; paused: boolean };

export type LocalState
  = | { kind: 'idle' }
    | { kind: 'loading'; video: Video }
    | { kind: 'ready'; video: Video; position: number; duration: number; paused: boolean };
