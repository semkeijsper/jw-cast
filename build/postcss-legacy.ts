/**
 * PostCSS passes that keep the built stylesheet parseable by older engines —
 * specifically the Chromium builds inside Samsung Tizen TV browsers, which lag
 * desktop Chrome by several years (Tizen 6.5 ≈ Cr 85, Tizen 7 ≈ Cr 94,
 * Tizen 8 ≈ Cr 108).
 *
 * Loaded from nuxt.config.ts, which resolves this file outside the app's alias
 * resolution — so, like build/prerender-seo.ts, it must not use `~`/`@` imports.
 */

import type { Declaration, Plugin } from 'postcss';
import cascadeLayers from '@csstools/postcss-cascade-layers';
import { VUETIFY_LAYER_ORDER } from '../app/config/cssLayers';

const LAYER_ORDER_PLUGIN = 'vuetify-layer-order';

/**
 * Prepends Vuetify's global layer order so the cascade-layer flattener that
 * runs after it sees one consistent order across every stylesheet.
 *
 * Vite runs PostCSS per source file, so a file holding only
 * `@layer vuetify-components { … }` has no idea where that layer sits
 * globally — and files with no layers at all still need the statement, because
 * their unlayered rules must outrank every layered rule and the flattener can
 * only work that out from the full list.
 */
export function vuetifyLayerOrder(): Plugin {
  return {
    postcssPlugin: LAYER_ORDER_PLUGIN,
    Once(root, { parse }) {
      root.prepend(parse(VUETIFY_LAYER_ORDER).nodes);
    },
  };
}

// Dynamic/small/large viewport units — Chromium 108+
const VIEWPORT_UNIT_FALLBACKS: Record<string, string> = {
  dvh: 'vh',
  dvw: 'vw',
  dvmin: 'vmin',
  dvmax: 'vmax',
  svh: 'vh',
  svw: 'vw',
  svmin: 'vmin',
  svmax: 'vmax',
  lvh: 'vh',
  lvw: 'vw',
  lvmin: 'vmin',
  lvmax: 'vmax',
};

const VIEWPORT_UNIT_RE = /(\d)(dv|sv|lv)(h|w|min|max)\b/g;

/**
 * Emits a static-viewport-unit fallback ahead of any declaration using a
 * dynamic/small/large viewport unit.
 *
 * Without one these declarations are simply dropped, which is not cosmetic
 * here: `.v-main { height: 100dvh; overflow-y: auto }` sits under
 * `html { overflow-y: hidden }`, so losing the height leaves the page with no
 * scroll container at all.
 */
export function viewportUnitFallback(): Plugin {
  // PostCSS revisits a declaration whose subtree it saw change, so the pass has
  // to remember what it already handled or it clones forever
  const seen = new WeakSet<Declaration>();

  return {
    postcssPlugin: 'viewport-unit-fallback',
    Declaration(decl: Declaration) {
      if (seen.has(decl)) {
        return;
      }
      seen.add(decl);

      const fallback = decl.value.replace(
        VIEWPORT_UNIT_RE,
        (_match, digit: string, prefix: string, axis: string) =>
          `${digit}${VIEWPORT_UNIT_FALLBACKS[`${prefix}${axis}`] ?? `v${axis}`}`,
      );
      if (fallback === decl.value) {
        return;
      }
      // Already carries a hand-written (or previously emitted) fallback
      const previous = decl.prev();
      if (previous?.type === 'decl' && previous.prop === decl.prop && previous.value === fallback) {
        return;
      }
      seen.add(decl.cloneBefore({ value: fallback }) as Declaration);
    },
  };
}

/**
 * Installs the legacy passes at the front of a Vite config's PostCSS chain.
 *
 * Nuxt builds `css.postcss.plugins` itself, out of plugins it can import by
 * module name — which a local file is not — so they are unshifted onto the
 * finished array rather than declared in `postcss.plugins`. Running first
 * matters: the layers have to be flattened before cssnano merges rules across
 * what used to be a layer boundary.
 *
 * `vite:extendConfig` fires for the client build and the server build, and Vite
 * hands both the same `css` object when neither overrides it — applying the
 * flattener twice would double every rule's padding, so this is idempotent. It
 * throws rather than no-oping if the chain is not where it expects: silently
 * skipping would ship layered CSS, which is invisible on a development machine
 * and total breakage on a TV.
 */
export function installLegacyCssPasses(config: {
  css?: { postcss?: unknown };
}) {
  const postcss = config.css?.postcss as { plugins?: Plugin[] } | undefined;
  if (!Array.isArray(postcss?.plugins)) {
    throw new TypeError(
      '[legacy-css] expected css.postcss.plugins to be an array — Nuxt\'s PostCSS wiring changed, '
      + 'and cascade layers would ship unflattened. See CLAUDE.md → Legacy browser support.',
    );
  }
  if (postcss.plugins.some(plugin => plugin?.postcssPlugin === LAYER_ORDER_PLUGIN)) {
    return;
  }
  postcss.plugins.unshift(
    vuetifyLayerOrder(),
    // Typed as PostCSS's Plugin | Processor union, which the chain accepts but
    // this narrower local shape does not
    cascadeLayers({ onRevertLayerKeyword: 'warn', onConditionalRulesChangingLayerOrder: 'warn' }) as Plugin,
    viewportUnitFallback(),
  );
}
