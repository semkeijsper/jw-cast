/**
 * Emits a cascade-layer-free twin of every built stylesheet, for browsers that
 * do not understand `@layer`.
 *
 * Vuetify 4 puts all of its CSS inside `@layer`, which is Chromium 99+. An
 * engine that does not know the at-rule discards the whole block — reset,
 * components, utilities and the `:root { --v-theme-* }` variables alike — so on
 * a Samsung Tizen TV the site loses its entire stylesheet. Vuetify 3.6 had a
 * `$layers` opt-out; v4 removed it, and no bundler can lower `@layer` because
 * layers invert specificity.
 *
 * So the layers are flattened into `:not(#\#)` padding — but only into a second
 * copy of each file. The shipped stylesheets keep their layers, and
 * `LEGACY_CSS_SWAP_SCRIPT` (build/legacy-runtime.ts) points the handful of
 * browsers that need it at the twins instead. Flattening costs roughly 3× the
 * raw bytes, and ~98% of visitors never download it.
 *
 * This runs *after* the build rather than inside Vite's PostCSS chain because
 * `@csstools/postcss-cascade-layers` documents that it "assumes to process your
 * complete CSS bundle. If your build tool processes files individually […] the
 * output will be incorrect" — and Vite hands PostCSS one source file at a time.
 *
 * Loaded from nuxt.config.ts, which resolves this file outside the app's alias
 * resolution — so, like build/prerender-seo.ts, it must not use `~`/`@` imports.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import cascadeLayers from '@csstools/postcss-cascade-layers';
import postcss from 'postcss';
import { VUETIFY_LAYER_ORDER } from '../app/config/cssLayers';

/** Distinguishes a twin from the layered original it was generated from. */
export const LEGACY_CSS_SUFFIX = '.nolayers.css';

/**
 * Maps a stylesheet URL to its flattened twin, or `null` if it has none.
 *
 * The twin sits next to the original under the same hashed name, so the mapping
 * is a pure suffix rule and neither the build nor the runtime swap needs a
 * manifest. `LEGACY_CSS_SWAP_SCRIPT` reimplements this in ES5; the two are kept
 * honest by `test/unit/legacyCss.test.ts`.
 */
export function legacyCssHref(href: string, assetsPrefix: string) {
  if (!href.startsWith(assetsPrefix) || !href.endsWith('.css') || href.endsWith(LEGACY_CSS_SUFFIX)) {
    return null;
  }
  return `${href.slice(0, -'.css'.length)}${LEGACY_CSS_SUFFIX}`;
}

/**
 * Flattens one stylesheet.
 *
 * Nuxt emits several CSS bundles and each declares only the layers it happens
 * to contain, so the global order is prepended first — otherwise a file's rules
 * would be padded against a different scale than its siblings', and a file with
 * no layers at all would lose the padding that keeps unlayered rules on top.
 */
export async function flattenStylesheet(css: string) {
  const result = await postcss([
    cascadeLayers({ onRevertLayerKeyword: 'warn', onConditionalRulesChangingLayerOrder: 'warn' }),
  ]).process(VUETIFY_LAYER_ORDER + css, { from: undefined });

  return { css: result.css, warnings: result.warnings().map(warning => warning.text) };
}

async function stylesheetsIn(dir: string) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => []);
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.css') && !entry.name.endsWith(LEGACY_CSS_SUFFIX))
    .map(entry => join(entry.parentPath, entry.name));
}

/**
 * Writes `<name>.nolayers.css` beside every stylesheet under `assetsDir`.
 * Returns one entry per file so the caller can report what it produced.
 */
export async function emitLegacyStylesheets(assetsDir: string) {
  const emitted: { file: string; bytes: number; warnings: string[] }[] = [];

  for (const path of await stylesheetsIn(assetsDir)) {
    const { css, warnings } = await flattenStylesheet(await readFile(path, 'utf8'));
    const target = `${path.slice(0, -'.css'.length)}${LEGACY_CSS_SUFFIX}`;
    await writeFile(target, css);
    emitted.push({ file: target, bytes: css.length, warnings });
  }

  return emitted;
}
