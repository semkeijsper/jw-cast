/**
 * Flattens the cascade layers out of Vuetify's runtime theme stylesheet, on the
 * browsers that cannot read them.
 *
 * Every other stylesheet has a flattened twin emitted at build time, which
 * `LEGACY_CSS_SWAP_SCRIPT` swaps in (see `app/config/cssLayers.ts`). This one
 * has no twin to swap: Vuetify's theme composable assembles it as a string and
 * injects it into the document, so it exists only at runtime and no build tool
 * can reach it. It is also the sheet that matters most — `@layer theme-base`
 * carries the `:root { --v-theme-* }` custom properties every component colour
 * resolves through, so losing it leaves the whole app uncoloured.
 *
 * Browsers that support layers are left alone: they load the layered
 * stylesheets, and padding this sheet would rank it against the wrong scale.
 *
 * Vuetify rewrites the element's text on every theme change, so the observer
 * stays attached for the life of the page.
 */

const STYLESHEET_SELECTOR = 'style#vuetify-theme-stylesheet';

export default defineNuxtPlugin(() => {
  if ('CSSLayerBlockRule' in window) {
    return;
  }

  let patching = false;

  function patch(element: HTMLStyleElement) {
    if (patching) {
      return;
    }
    const flattened = flattenCssLayers(element.textContent ?? '');
    if (flattened === element.textContent) {
      return;
    }
    patching = true;
    element.textContent = flattened;
    patching = false;
  }

  function watchStylesheet(element: HTMLStyleElement) {
    patch(element);
    new MutationObserver(() => patch(element))
      .observe(element, { childList: true, characterData: true, subtree: true });
  }

  const existing = document.querySelector<HTMLStyleElement>(STYLESHEET_SELECTOR);
  if (existing) {
    watchStylesheet(existing);
    return;
  }

  // The plugin runs before the app renders, so the element usually does not
  // exist yet — wait for the insertion, then narrow the observer to it
  const finder = new MutationObserver(() => {
    const element = document.querySelector<HTMLStyleElement>(STYLESHEET_SELECTOR);
    if (element) {
      finder.disconnect();
      watchStylesheet(element);
    }
  });
  finder.observe(document.documentElement, { childList: true, subtree: true });
});
