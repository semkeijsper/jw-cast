import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { uiStrings } from '~/config/uiStrings';
import { useLanguageStore } from '~/stores/language';

beforeEach(() => setActivePinia(createPinia()));

describe('language store t()', () => {
  it('prefers the jw.org API translation', () => {
    const s = useLanguageStore();
    s.setTranslations({ btnPlay: 'FROM_API' });
    expect(s.t('btnPlay')).toBe('FROM_API');
  });

  it('falls back to the active locale dictionary', () => {
    const s = useLanguageStore();
    s.setTranslations({});
    s.setSiteLanguage('nl');
    const [key, value] = Object.entries(uiStrings.nl!)[0]!;
    expect(s.t(key)).toBe(value);
  });

  it('falls back to English when the locale block is missing', () => {
    const s = useLanguageStore();
    s.setTranslations({});
    s.setSiteLanguage('zz');
    const [key, value] = Object.entries(uiStrings.en!)[0]!;
    expect(s.t(key)).toBe(value);
  });

  it('returns the key itself when nothing resolves', () => {
    const s = useLanguageStore();
    s.setTranslations({});
    expect(s.t('__does_not_exist__')).toBe('__does_not_exist__');
  });
});
