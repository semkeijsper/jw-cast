import { describe, expect, it } from 'vitest';
import { parseVideoLink, sortKeyOf } from '~/utils/searchLink';

describe('parseVideoLink', () => {
  it('parses a finder link with wtlocale + lank', () => {
    const r = parseVideoLink('https://www.jw.org/finder?wtlocale=E&lank=pub-jwb_202007_1_VIDEO&srctype=wol');
    expect(r.kind).toBe('finder');
    if (r.kind === 'finder') {
      expect(r.wtlocale).toBe('E');
      expect(r.lank).toBe('pub-jwb_202007_1_VIDEO');
    }
  });

  it('parses a finder link with locale and no wtlocale', () => {
    const r = parseVideoLink('https://www.jw.org/finder?locale=en&lank=docid-502200092_1_VIDEO');
    expect(r.kind).toBe('finder');
    if (r.kind === 'finder') {
      expect(r.wtlocale).toBeUndefined();
      expect(r.locale).toBe('en');
      expect(r.lank).toBe('docid-502200092_1_VIDEO');
    }
  });

  it('parses a media-items hash link', () => {
    const r = parseVideoLink('https://www.jw.org/en/library/videos/#en/mediaitems/LatestVideos/pub-jwbcov_202301_1_VIDEO');
    expect(r).toEqual({ kind: 'mediaitems', locale: 'en', lank: 'pub-jwbcov_202301_1_VIDEO' });
  });

  it('treats plain text as a query', () => {
    expect(parseVideoLink('kingdom song')).toEqual({ kind: 'query' });
  });
});

describe('sortKeyOf', () => {
  it('reads the ?sort= param', () => {
    expect(sortKeyOf('https://example.test/x?sort=newest&q=a')).toBe('newest');
  });

  it('returns null without a query string', () => {
    expect(sortKeyOf('https://example.test/x')).toBeNull();
  });

  it('returns null when sort is absent', () => {
    expect(sortKeyOf('https://example.test/x?q=a')).toBeNull();
  });
});
