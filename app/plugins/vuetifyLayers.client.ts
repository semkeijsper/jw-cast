/**
 * Flattens the cascade layers out of Vuetify's runtime theme stylesheet.
 *
 * Everything else is flattened at build time (see `app/config/cssLayers.ts`),
 * but the theme stylesheet is assembled as a string by Vuetify's theme
 * composable and injected straight into the document, so PostCSS never sees
 * it. That leaves two problems, and the second one bites every browser:
 *
 * - On an engine without cascade layers (Samsung Tizen TVs) the whole sheet is
 *   discarded, taking `:root { --v-theme-* }` with it — every component colour
 *   then resolves through an undefined custom property.
 * - Everywhere else, the built CSS now carries specificity padding while this
 *   sheet does not, so `.bg-primary` and friends lose to the component rules
 *   they are supposed to override.
 *
 * Vuetify rewrites the element's text on every theme change, so the observer
 * stays attached for the life of the page.
 */

const STYLESHEET_SELECTOR = 'style#vuetify-theme-stylesheet';

export default defineNuxtPlugin(() => {
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
