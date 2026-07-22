import type { Language } from '~/types';
import { describe, expect, it } from 'vitest';
import { languageLabel } from '~/utils/language';

function lang(name: string, vernacular: string): Language {
  return { code: 'X', locale: 'xx', name, vernacular };
}

describe('languageLabel', () => {
  it('shows the name alone when it equals the vernacular', () => {
    expect(languageLabel(lang('English', 'English'))).toBe('English');
  });

  it('appends the vernacular in parentheses when they differ', () => {
    expect(languageLabel(lang('Dutch', 'Nederlands'))).toBe('Dutch (Nederlands)');
  });
});
