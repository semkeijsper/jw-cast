import { describe, expect, it } from 'vitest';
import { formatTime } from '~/utils/time';

describe('formatTime', () => {
  it('formats sub-hour durations as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(59)).toBe('0:59');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('formats hour+ durations as h:mm:ss with zero-padding', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3723)).toBe('1:02:03');
    expect(formatTime(36000)).toBe('10:00:00');
  });

  it('floors fractional seconds', () => {
    expect(formatTime(9.9)).toBe('0:09');
    expect(formatTime(59.999)).toBe('0:59');
  });

  it('guards against invalid input', () => {
    expect(formatTime(-5)).toBe('0:00');
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('0:00');
  });
});
