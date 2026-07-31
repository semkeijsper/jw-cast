import type { Language } from '~/types';
import { describe, expect, it } from 'vitest';
import { resolveAvailableLanguage } from '~/utils/mediaLanguage';

const nl: Language = { code: 'O', locale: 'nl', vernacular: 'Nederlands', name: 'Dutch' };
const en: Language = { code: 'E', locale: 'en', vernacular: 'English', name: 'English' };
const es: Language = { code: 'S', locale: 'es', vernacular: 'español', name: 'Spanish' };

describe('resolveAvailableLanguage', () => {
  it('keeps the preferred language when the video is released in it', () => {
    expect(resolveAvailableLanguage(nl, [en], ['E', 'O', 'S'])).toBe(nl);
  });

  it('falls back to the first available candidate when it is not', () => {
    expect(resolveAvailableLanguage(nl, [es, en], ['E', 'S'])).toBe(es);
  });

  it('skips fallbacks the video is not released in either', () => {
    expect(resolveAvailableLanguage(nl, [es, en], ['E'])).toBe(en);
  });

  it('ignores undefined fallbacks', () => {
    expect(resolveAvailableLanguage(nl, [undefined, en], ['E'])).toBe(en);
  });

  it('keeps the preferred language when nothing is available', () => {
    expect(resolveAvailableLanguage(nl, [es, en], ['ASL'])).toBe(nl);
  });

  it('treats a missing or empty list as no information', () => {
    expect(resolveAvailableLanguage(nl, [en], undefined)).toBe(nl);
    expect(resolveAvailableLanguage(nl, [en], [])).toBe(nl);
  });
});
