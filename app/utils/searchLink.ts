export type ParsedVideoLink
  = | { kind: 'finder'; wtlocale?: string; locale?: string; lank?: string }
    | { kind: 'mediaitems'; locale?: string; lank?: string }
    | { kind: 'query' };

/**
 * Classify a search input as a pasted jw.org video link or a plain query.
 * Only the URL parsing lives here; resolving a locale to a language code
 * (store-bound) stays in the caller.
 */
export function parseVideoLink(value: string): ParsedVideoLink {
  const finderRegex = /jw\.org\/finder\?.+&.+/;
  const mediaItemsRegex
    = /jw\.org\/[\w-]+\/.+#(?<locale>[\w-]+)\/mediaitems\/(?<category>[\w-]+)\/(?<lank>[\w-]+)/;

  if (finderRegex.test(value)) {
    return {
      kind: 'finder',
      wtlocale: /wtlocale=(?<code>[A-Za-z]+)/.exec(value)?.groups?.code,
      locale: /locale=(?<locale>[A-Za-z_]+)/.exec(value)?.groups?.locale,
      lank: /lank=(?<lank>[\w-]+)/.exec(value)?.groups?.lank,
    };
  }

  const mediaMatch = mediaItemsRegex.exec(value);
  if (mediaMatch) {
    return {
      kind: 'mediaitems',
      locale: mediaMatch.groups?.locale,
      lank: mediaMatch.groups?.lank,
    };
  }

  return { kind: 'query' };
}

/** The sort key from a search-sort link's `?sort=` param. */
export function sortKeyOf(link: string): string | null {
  const queryString = link.split('?')[1];
  return queryString ? new URLSearchParams(queryString).get('sort') : null;
}
