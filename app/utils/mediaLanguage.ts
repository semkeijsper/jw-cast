import type { Language } from '~/types';

/**
 * The preferred language, unless the video was never released in it — then the
 * first fallback it was. `available` holds Watchtower codes
 * (`Video.availableLanguages`); an empty or unknown list means "no
 * information", so `preferred` wins unchanged.
 */
export function resolveAvailableLanguage(
  preferred: Language,
  fallbacks: (Language | undefined)[],
  available: string[] | undefined,
): Language {
  if (!available?.length || available.includes(preferred.code)) {
    return preferred;
  }
  return fallbacks.find(l => l && available.includes(l.code)) ?? preferred;
}
