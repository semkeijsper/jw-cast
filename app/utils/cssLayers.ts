/**
 * Runtime counterpart to the build-time cascade-layer flattening — see
 * `app/config/cssLayers.ts` for why the layers have to go at all.
 *
 * Only one stylesheet reaches the browser without passing through PostCSS:
 * the one Vuetify's theme composable builds as a string and injects as
 * `<style id="vuetify-theme-stylesheet">`. It is also the most load-bearing
 * one, since `@layer theme-base` holds the `:root { --v-theme-* }` custom
 * properties every component colour resolves through.
 *
 * The input is Vuetify's own generated CSS, which is flat rules nested at most
 * two layers deep, so this deliberately does not try to be a general CSS
 * parser — it handles `@layer` blocks, other at-rule blocks and plain rules,
 * and leaves anything it does not recognise alone.
 */

import { layerPadding } from '~/config/cssLayers';

const COMBINATORS = new Set([' ', '\t', '\n', '>', '+', '~']);

/**
 * Appends the padding to the first compound of each selector in a list, which
 * is where `@csstools/postcss-cascade-layers` puts it — `.a .b` has to become
 * `.a<pad> .b`, not `.a .b<pad>`, so that descendant matching is unchanged.
 */
function padSelectorList(selectors: string, padding: string) {
  if (!padding) {
    return selectors;
  }
  return splitTopLevel(selectors)
    .map(selector => {
      const trimmed = selector.trim();
      if (!trimmed) {
        return selector;
      }
      let depth = 0;
      for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i]!;
        if (char === '(' || char === '[') {
          depth++;
        }
        else if (char === ')' || char === ']') {
          depth--;
        }
        else if (depth === 0 && COMBINATORS.has(char)) {
          return `${trimmed.slice(0, i)}${padding}${trimmed.slice(i)}`;
        }
      }
      return `${trimmed}${padding}`;
    })
    .join(',');
}

/** Splits a selector list on commas that are not inside `()` or `[]`. */
function splitTopLevel(selectors: string) {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selectors.length; i++) {
    const char = selectors[i]!;
    if (char === '(' || char === '[') {
      depth++;
    }
    else if (char === ')' || char === ']') {
      depth--;
    }
    else if (char === ',' && depth === 0) {
      parts.push(selectors.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(selectors.slice(start));
  return parts;
}

/** Index of the `}` closing the `{` at `open`. */
function matchBrace(css: string, open: number) {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') {
      depth++;
    }
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return css.length;
}

function walk(css: string, path: string[], out: string[]) {
  let i = 0;
  while (i < css.length) {
    const next = css.indexOf('{', i);
    const semicolon = css.indexOf(';', i);

    // A statement such as `@layer a, b;` only declares order — the flattened
    // output has no layers left to order, so it is dropped
    if (semicolon !== -1 && (next === -1 || semicolon < next)) {
      const statement = css.slice(i, semicolon).trim();
      if (statement && !statement.startsWith('@layer')) {
        out.push(`${statement};`);
      }
      i = semicolon + 1;
      continue;
    }
    if (next === -1) {
      return;
    }

    const prelude = css.slice(i, next).trim();
    const close = matchBrace(css, next);
    const body = css.slice(next + 1, close);

    if (prelude.startsWith('@layer')) {
      const name = prelude.slice('@layer'.length).trim();
      walk(body, name ? [...path, name] : path, out);
    }
    else if (prelude.startsWith('@')) {
      // @media/@supports and friends: keep the wrapper, flatten what is inside
      const inner: string[] = [];
      walk(body, path, inner);
      out.push(`${prelude}{${inner.join('')}}`);
    }
    else {
      out.push(`${padSelectorList(prelude, layerPadding(path.join('.')))}{${body}}`);
    }

    i = close + 1;
  }
}

/**
 * Rewrites layered CSS into equivalent unlayered CSS, giving every rule the
 * specificity padding for the layer it came from.
 */
export function flattenCssLayers(css: string) {
  const out: string[] = [];
  walk(css, [], out);
  return out.join('');
}
