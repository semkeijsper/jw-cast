import type { SubtitleCue } from '~/types';

/** Index of the cue active at `time` (last cue whose start is ≤ time), or -1. */
export function activeCueIndex(cues: SubtitleCue[], time: number): number {
  for (let i = cues.length - 1; i >= 0; i--) {
    if (cues[i]!.start <= time) {
      return i;
    }
  }
  return -1;
}

/**
 * Split cue text into consecutive segments, marking the parts that match the
 * (case-insensitive) query so the caller can highlight them.
 */
export function highlightSegments(text: string, query: string): { text: string; match: boolean }[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [{ text, match: false }];
  }

  const segments: { text: string; match: boolean }[] = [];
  const lower = text.toLowerCase();
  let position = 0;
  for (let hit = lower.indexOf(q); hit !== -1; hit = lower.indexOf(q, position)) {
    if (hit > position) {
      segments.push({ text: text.slice(position, hit), match: false });
    }
    segments.push({ text: text.slice(hit, hit + q.length), match: true });
    position = hit + q.length;
  }
  if (position < text.length) {
    segments.push({ text: text.slice(position), match: false });
  }
  return segments;
}
