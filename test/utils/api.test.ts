import type { MediaFile, Video } from '~/types';
import { describe, expect, it } from 'vitest';
import { downloadableFiles } from '~/utils/api';

function video(labels: string[]): Video {
  return { files: labels.map(label => ({ label } as MediaFile)) } as Video;
}

describe('downloadableFiles', () => {
  it('hides the 144p low-bandwidth fallback', () => {
    expect(downloadableFiles(video(['1080p', '144p', '480p'])).map(f => f.label))
      .toEqual(['1080p', '480p']);
  });

  it('returns an empty array for a null video', () => {
    expect(downloadableFiles(null)).toEqual([]);
  });
});
