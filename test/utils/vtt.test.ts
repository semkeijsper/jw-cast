import { describe, expect, it } from 'vitest';
import { parseVtt } from '~/utils/vtt';

describe('parseVtt', () => {
  it('parses a single cue without an hours component', () => {
    const cues = parseVtt('WEBVTT\n\n00:00.000 --> 00:02.500\nHello world');
    expect(cues).toEqual([{ start: 0, end: 2.5, text: 'Hello world' }]);
  });

  it('parses timing with an hours component', () => {
    const cues = parseVtt('1:02:03.000 --> 1:02:04.000\nLate cue');
    expect(cues[0]!.start).toBe(3723);
    expect(cues[0]!.end).toBe(3724);
  });

  it('strips markup tags and decodes &nbsp;', () => {
    const cues = parseVtt('00:00.000 --> 00:01.000\n<c.yellow>Hi</c>&nbsp;there<b>!</b>');
    expect(cues[0]!.text).toBe('Hi there!');
  });

  it('joins multi-line cue text with a space', () => {
    const cues = parseVtt('00:00.000 --> 00:01.000\nline one\nline two');
    expect(cues[0]!.text).toBe('line one line two');
  });

  it('collapses roll-up captions by extending the previous cue end', () => {
    const raw = [
      '00:00.000 --> 00:02.000',
      'same text',
      '',
      '00:02.000 --> 00:05.000',
      'same text',
    ].join('\n');
    const cues = parseVtt(raw);
    expect(cues).toHaveLength(1);
    expect(cues[0]).toEqual({ start: 0, end: 5, text: 'same text' });
  });

  it('skips blocks without a timing line and cues with empty text', () => {
    const raw = [
      'WEBVTT',
      '',
      'NOTE just a comment',
      '',
      '00:00.000 --> 00:01.000',
      '<b></b>',
      '',
      '00:01.000 --> 00:02.000',
      'kept',
    ].join('\n');
    const cues = parseVtt(raw);
    expect(cues).toEqual([{ start: 1, end: 2, text: 'kept' }]);
  });

  it('normalizes CRLF line endings', () => {
    const cues = parseVtt('00:00.000 --> 00:01.000\r\ncrlf cue\r\n');
    expect(cues[0]!.text).toBe('crlf cue');
  });
});
