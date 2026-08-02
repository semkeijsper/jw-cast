/**
 * Browser-compatibility probe, for diagnosing devices we cannot get our hands on.
 *
 * The site is browsed on Samsung Tizen TVs, whose Chromium is years behind
 * desktop, and a TV has no console, no devtools and no way to report anything
 * back. `common/CompatPanel.vue` renders this on screen large enough to
 * photograph, so a bug report can carry the engine version, the feature matrix
 * and the boot errors in one picture. Enable with `?compat` in the URL or
 * `localStorage.compatDebug`.
 *
 * The buffered part (`window.__compat`) is filled by the two inline head
 * scripts in nuxt.config.ts, which run before the bundle so they also catch
 * failures that stop the app from ever mounting.
 */

import type { CastWindow } from '~/types/cast';

export interface CompatBuffer {
  ua: string;
  errors: string[];
  polyfilled: string[];
}

export interface CompatCheck {
  label: string;
  ok: boolean;
  /** Chromium version the feature shipped in, for placing the engine on a timeline */
  since: string;
}

export function compatDebugEnabled() {
  try {
    return window.location.search.includes('compat')
      || window.localStorage.getItem('compatDebug') !== null;
  }
  catch {
    return false;
  }
}

export function compatBuffer(): CompatBuffer {
  const buffer = (window as unknown as { __compat?: Partial<CompatBuffer> }).__compat;
  return {
    ua: buffer?.ua ?? navigator.userAgent,
    errors: buffer?.errors ?? [],
    polyfilled: buffer?.polyfilled ?? [],
  };
}

function supports(property: string, value: string) {
  try {
    return typeof CSS !== 'undefined' && CSS.supports(property, value);
  }
  catch {
    return false;
  }
}

function supportsSelector(selector: string) {
  try {
    return typeof CSS !== 'undefined' && CSS.supports(`selector(${selector})`);
  }
  catch {
    return false;
  }
}

/**
 * Every engine feature the app is known to depend on, newest first — the first
 * red row is the one to fix.
 *
 * The JS rows are read off {@link CompatBuffer.polyfilled} rather than probed
 * directly: the head script has already filled the gaps by the time anything
 * here runs, so a live probe would report every engine as complete. A red row
 * therefore means "this engine lacks it and is running on our polyfill", which
 * is the fact worth knowing.
 */
export function compatChecks(polyfilled: string[]): CompatCheck[] {
  const native = (method: string) => !polyfilled.includes(method);

  return [
    { label: 'color-mix()', ok: supports('color', 'color-mix(in srgb, red, blue)'), since: 'Cr 111' },
    { label: 'Array.toSorted', ok: native('toSorted'), since: 'Cr 110' },
    { label: '100dvh', ok: supports('height', '100dvh'), since: 'Cr 108' },
    { label: ':has()', ok: supportsSelector(':has(*)'), since: 'Cr 105' },
    { label: '@layer', ok: 'CSSLayerBlockRule' in window, since: 'Cr 99' },
    { label: 'Array.findLast', ok: native('findLast'), since: 'Cr 97' },
    { label: 'Object.hasOwn', ok: native('hasOwn'), since: 'Cr 93' },
    { label: 'Array.at', ok: native('at'), since: 'Cr 92' },
    { label: 'ResizeObserver', ok: window.ResizeObserver !== undefined, since: 'Cr 64' },
    { label: 'IntersectionObserver', ok: window.IntersectionObserver !== undefined, since: 'Cr 51' },
    { label: 'Cast SDK', ok: (window as unknown as CastWindow).chrome?.cast !== undefined, since: 'Chromium only' },
  ];
}

/** The Chromium build behind the browser, which is what actually gates features. */
export function engineVersion(ua: string) {
  const chromium = /(?:Chrome|Chromium|CrOS)\/(\d+)/.exec(ua);
  const tizen = /Tizen[ /](\d+\.\d+)/.exec(ua);
  return [
    chromium ? `Chromium ${chromium[1]}` : 'Chromium unknown',
    tizen ? `Tizen ${tizen[1]}` : null,
  ].filter(Boolean).join(' · ');
}
