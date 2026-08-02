/**
 * Vuetify's CSS cascade layers, and the specificity padding that replaces them.
 *
 * Cascade layers are Chromium 99+. Samsung Tizen TV browsers are older than
 * that (Tizen 7 ≈ Cr 94), and an engine that does not know `@layer` discards
 * the whole at-rule — which is *all* of Vuetify's CSS, reset and theme
 * variables included. `build/postcss-legacy.ts` therefore flattens the layers
 * out of the built stylesheets at build time, replacing the layer order with
 * `:not(#\#)` specificity padding (one per layer the rule has to outrank).
 *
 * Two consumers share this table:
 *
 * - `build/postcss-legacy.ts`, which feeds {@link VUETIFY_LAYER_ORDER} to
 *   `@csstools/postcss-cascade-layers` so every file flattens against the same
 *   global order.
 * - `app/plugins/vuetifyLayers.client.ts`, which applies the same padding to
 *   the theme stylesheet Vuetify builds *at runtime* — that one never passes
 *   through PostCSS, and it carries `:root { --v-theme-* }`, so leaving it
 *   layered strands the built CSS at a specificity the theme can no longer
 *   reach.
 *
 * No `~`/`@` imports: nuxt.config.ts loads this file outside the app's alias
 * resolution, the same constraint `app/config/seoMeta.ts` has.
 */

/**
 * Vuetify's layer order statement, copied verbatim from
 * `vuetify/lib/styles/generic/_layers.scss`.
 */
export const VUETIFY_LAYER_ORDER = `
@layer vuetify-core { @layer reset, base; }
@layer vuetify-components;
@layer vuetify-overrides;
@layer vuetify-utilities { @layer theme-base, typography, helpers, theme-background, theme-foreground; }
@layer vuetify-final { @layer transitions, trumps; }
`;

/**
 * The same order, flattened — a sub-layer sorts before its parent, since the
 * parent holds whatever was not put in a sub-layer and therefore wins.
 *
 * The index into this array is the number of padding tokens a rule in that
 * layer receives; unlayered rules get {@link UNLAYERED_PADDING}, one more than
 * any layer, because unlayered styles outrank every layer.
 *
 * `test/unit/cssLayers.test.ts` runs the real PostCSS flattener over a probe
 * stylesheet and asserts these indices, so a Vuetify release that adds a layer
 * fails the suite rather than quietly shifting the cascade.
 */
export const VUETIFY_LAYERS = [
  'vuetify-core.reset',
  'vuetify-core.base',
  'vuetify-core',
  'vuetify-components',
  'vuetify-overrides',
  'vuetify-utilities.theme-base',
  'vuetify-utilities.typography',
  'vuetify-utilities.helpers',
  'vuetify-utilities.theme-background',
  'vuetify-utilities.theme-foreground',
  'vuetify-utilities',
  'vuetify-final.transitions',
  'vuetify-final.trumps',
  'vuetify-final',
];

/**
 * Adds an id's worth of specificity while matching everything — `#\#` is not a
 * value any element's id can take. This is the token
 * `@csstools/postcss-cascade-layers` emits; the runtime pass has to use the
 * identical one or the two halves rank against different scales.
 */
export const PADDING_TOKEN = String.raw`:not(#\#)`;

export const UNLAYERED_PADDING = VUETIFY_LAYERS.length;

/** Padding for a fully-qualified layer name, e.g. `vuetify-utilities.helpers`. */
export function layerPadding(layer: string) {
  const index = VUETIFY_LAYERS.indexOf(layer);
  return PADDING_TOKEN.repeat(index === -1 ? UNLAYERED_PADDING : index);
}
