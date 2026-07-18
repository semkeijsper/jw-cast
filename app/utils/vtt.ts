import type { SubtitleCue } from '~/types';

const TIMING_RE
  = /(?:(\d+):)?(\d{1,2}):(\d{2})\.(\d{3})\s+-->\s+(?:(\d+):)?(\d{1,2}):(\d{2})\.(\d{3})/;

function toSeconds(hours: string | undefined, minutes: string, seconds: string, millis: string): number {
  return Number(hours ?? 0) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(millis) / 1000;
}

function cleanCueText(line: string): string {
  return line
    .replace(/<\/c>/g, '')
    .replace(/<.+?>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function parseVtt(raw: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = raw.replace(/\r\n/g, '\n').split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block.split('\n').filter(l => l.trim().length > 0);
    const timingIndex = lines.findIndex(l => TIMING_RE.test(l));
    if (timingIndex === -1) {
      continue;
    }

    const match = lines[timingIndex]!.match(TIMING_RE)!;
    const start = toSeconds(match[1], match[2]!, match[3]!, match[4]!);
    const end = toSeconds(match[5], match[6]!, match[7]!, match[8]!);

    const text = lines
      .slice(timingIndex + 1)
      .map(l => cleanCueText(l))
      .filter(l => l.length > 0)
      .join(' ');
    if (!text) {
      continue;
    }

    const previous = cues.at(-1);
    // Roll-up captions repeat the same text in consecutive cues
    if (previous && previous.text === text) {
      previous.end = end;
      continue;
    }

    cues.push({ start, end, text });
  }

  return cues;
}

export function formatCueTime(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`;
}
