import { describe, expect, it } from 'vitest';
import { LEGACY_CSS_SUFFIX, legacyCssHref } from '../../build/legacy-css';
import { legacyCssSwapScript } from '../../build/legacy-runtime';

const PREFIX = '/_nuxt/';
const ORIGIN = 'https://jwcast.semdev.nl';

interface FakeLink {
  rel: string;
  as?: string;
  href: string;
}

/**
 * The script ships as an inline `<head>` string, so it is executed rather than
 * imported. Only the handful of DOM APIs it touches are faked — a full DOM
 * would try to fetch every stylesheet; the real end-to-end proof is the
 * browser A/B run, which loads a built site with `CSSLayerBlockRule` removed.
 */
function runScript(links: FakeLink[], { supportsLayers = false } = {}) {
  let notify: (() => void) | undefined;

  const matches = (link: FakeLink, selector: string) =>
    selector.includes('stylesheet')
      ? link.rel === 'stylesheet'
      : link.rel === 'prefetch' && link.as === 'style';

  const document = {
    documentElement: {},
    baseURI: `${ORIGIN}/nl`,
    querySelectorAll: (selectors: string) => links
      .filter(link => selectors.split(',').some(selector => matches(link, selector)))
      .map(link => ({
        getAttribute: (name: string) => (name === 'href' ? link.href : null),
        setAttribute: (name: string, value: string) => {
          if (name === 'href') {
            link.href = value;
          }
        },
      })),
  };

  const window = {
    ...(supportsLayers ? { CSSLayerBlockRule: class {} } : {}),
    URL: globalThis.URL,
    location: { href: ORIGIN, origin: ORIGIN },
    MutationObserver: class {
      constructor(callback: () => void) {
        notify = callback;
      }

      observe() {}
    },
  };

  // eslint-disable-next-line no-new-func
  new Function('window', 'document', legacyCssSwapScript(PREFIX))(window, document);

  return { rerun: () => notify?.() };
}

describe('legacyCssSwapScript', () => {
  it('leaves everything alone when the engine supports cascade layers', () => {
    const links = [{ rel: 'stylesheet', href: '/_nuxt/entry.CZp6Aps3.css' }];
    runScript(links, { supportsLayers: true });
    expect(links[0]!.href).toBe('/_nuxt/entry.CZp6Aps3.css');
  });

  it('swaps stylesheets already in the document', () => {
    const links = [{ rel: 'stylesheet', href: '/_nuxt/entry.CZp6Aps3.css' }];
    runScript(links);
    expect(links[0]!.href).toBe(`/_nuxt/entry.CZp6Aps3${LEGACY_CSS_SUFFIX}`);
  });

  it('swaps prefetch hints so they warm the file that gets requested', () => {
    const links = [{ rel: 'prefetch', as: 'style', href: '/_nuxt/error-404.css' }];
    runScript(links);
    expect(links[0]!.href).toBe(`/_nuxt/error-404${LEGACY_CSS_SUFFIX}`);
  });

  it('picks up stylesheets Vite injects later for lazy route chunks', () => {
    const links: FakeLink[] = [];
    const { rerun } = runScript(links);

    links.push({ rel: 'stylesheet', href: '/_nuxt/LanguageSelect.CeB1_rxE.css' });
    rerun();

    expect(links[0]!.href).toBe(`/_nuxt/LanguageSelect.CeB1_rxE${LEGACY_CSS_SUFFIX}`);
  });

  it('does not re-swap a href it already rewrote', () => {
    const links = [{ rel: 'stylesheet', href: '/_nuxt/entry.css' }];
    const { rerun } = runScript(links);
    rerun();
    rerun();
    expect(links[0]!.href).toBe(`/_nuxt/entry${LEGACY_CSS_SUFFIX}`);
  });

  it('swaps the absolute hrefs Vite assigns to lazily-loaded route chunks', () => {
    // vite's preload helper runs the href through import.meta.resolve, so it
    // arrives absolute rather than root-relative
    const links = [{ rel: 'stylesheet', href: `${ORIGIN}/_nuxt/_videoId_.igyVAZto.css` }];
    runScript(links);
    expect(links[0]!.href).toBe(`/_nuxt/_videoId_.igyVAZto${LEGACY_CSS_SUFFIX}`);
  });

  it('leaves same-path stylesheets on another origin alone', () => {
    const links = [{ rel: 'stylesheet', href: 'https://cdn.example.com/_nuxt/entry.css' }];
    runScript(links);
    expect(links[0]!.href).toBe('https://cdn.example.com/_nuxt/entry.css');
  });

  it('agrees with legacyCssHref, which is what named the files on disk', () => {
    const hrefs = [
      '/_nuxt/entry.CZp6Aps3.css',
      '/_nuxt/nested/chunk.css',
      '/_nuxt/entry.js',
      `/_nuxt/entry${LEGACY_CSS_SUFFIX}`,
      'https://cdn.example.com/x.css',
    ];
    const links = hrefs.map(href => ({ rel: 'stylesheet', href }));
    runScript(links);

    expect(links.map(link => link.href))
      .toEqual(hrefs.map(href => legacyCssHref(href, PREFIX) ?? href));
  });

  it('honours the baseURL prefix the staging deploy runs under', () => {
    const links = [
      { rel: 'stylesheet', href: '/jw-cast-staging/_nuxt/entry.css' },
      { rel: 'stylesheet', href: '/_nuxt/entry.css' },
    ];
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', legacyCssSwapScript('/jw-cast-staging/_nuxt/'))(
      {
        URL: globalThis.URL,
        location: { href: ORIGIN, origin: ORIGIN },
        MutationObserver: class { observe() {} },
      },
      {
        documentElement: {},
        baseURI: `${ORIGIN}/jw-cast-staging/nl`,
        querySelectorAll: () => links.map(link => ({
          getAttribute: () => link.href,
          setAttribute: (_name: string, value: string) => {
            link.href = value;
          },
        })),
      },
    );

    expect(links[0]!.href).toBe(`/jw-cast-staging/_nuxt/entry${LEGACY_CSS_SUFFIX}`);
    expect(links[1]!.href).toBe('/_nuxt/entry.css');
  });
});
