import type { SubtitleCue } from '~/types';
import { describe, expect, it } from 'vitest';
import { activeCueIndex, highlightSegments } from '~/utils/transcript';

const cues: SubtitleCue[] = [
  { start: 0, end: 2, text: 'a' },
  { start: 2, end: 4, text: 'b' },
  { start: 4, end: 6, text: 'c' },
];

describe('activeCueIndex', () => {
  it('returns -1 before the first cue', () => {
    expect(activeCueIndex(cues, -1)).toBe(-1);
  });

  it('matches on the exact start boundary', () => {
    expect(activeCueIndex(cues, 2)).toBe(1);
  });

  it('returns the cue spanning the given time', () => {
    expect(activeCueIndex(cues, 3)).toBe(1);
  });

  it('returns the last cue after the end', () => {
    expect(activeCueIndex(cues, 100)).toBe(2);
  });

  it('returns -1 for an empty list', () => {
    expect(activeCueIndex([], 5)).toBe(-1);
  });
});

describe('highlightSegments', () => {
  it('returns a single non-match segment when the query is empty', () => {
    expect(highlightSegments('hello world', '')).toEqual([{ text: 'hello world', match: false }]);
  });

  it('splits a single match case-insensitively', () => {
    expect(highlightSegments('Hello World', 'world')).toEqual([
      { text: 'Hello ', match: false },
      { text: 'World', match: true },
    ]);
  });

  it('marks every match occurrence', () => {
    expect(highlightSegments('ababa', 'a')).toEqual([
      { text: 'a', match: true },
      { text: 'b', match: false },
      { text: 'a', match: true },
      { text: 'b', match: false },
      { text: 'a', match: true },
    ]);
  });

  it('returns the whole text as a non-match when nothing matches', () => {
    expect(highlightSegments('hello', 'zzz')).toEqual([{ text: 'hello', match: false }]);
  });
});
