import type { Video } from '~/types';

/**
 * Per-media playback session state for each transport. The `Video` is carried
 * in every non-idle state so a consumer can tell *which* video a transport is
 * playing (identity) without a separate key. Device/config state (volume,
 * device name, captions, seek/pause capability) is NOT here — it lives as refs
 * in `useCast`, since it is not per-media.
 */

export type CastState =
  | { kind: 'idle' }
  | { kind: 'connecting'; video: Video }
  | { kind: 'active'; video: Video; position: number; duration: number; paused: boolean };

export type LocalState =
  | { kind: 'idle' }
  | { kind: 'loading'; video: Video }
  | { kind: 'ready'; video: Video; position: number; duration: number; paused: boolean };
