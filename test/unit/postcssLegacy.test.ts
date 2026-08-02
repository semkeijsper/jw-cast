import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { installLegacyCssPasses, viewportUnitFallback, vuetifyLayerOrder } from '../../build/postcss-legacy';

function run(css: string) {
  return postcss([vuetifyLayerOrder(), viewportUnitFallback()]).process(css, { from: undefined }).css;
}

describe('vuetifyLayerOrder', () => {
  it('prepends the layer order so every file flattens against the same list', () => {
    const css = run('.x { color: red; }');
    expect(css.indexOf('@layer vuetify-core')).toBeLessThan(css.indexOf('.x'));
    expect(css).toContain('@layer vuetify-final');
  });
});

describe('viewportUnitFallback', () => {
  it('emits a static fallback ahead of a dynamic viewport unit', () => {
    expect(run('.v-main { height: 100dvh; }')).toContain('height: 100vh; height: 100dvh;');
  });

  it('covers the small and large variants and every axis', () => {
    expect(run('.a { width: 50svw; }')).toContain('width: 50vw');
    expect(run('.a { height: 10lvh; }')).toContain('height: 10vh');
    expect(run('.a { font-size: 4dvmin; }')).toContain('font-size: 4vmin');
    expect(run('.a { padding: 1dvmax; }')).toContain('padding: 1vmax');
  });

  it('rewrites every unit in a multi-value declaration', () => {
    expect(run('.a { inset: 10dvh 5dvw; }')).toContain('inset: 10vh 5vw');
  });

  it('leaves declarations without dynamic units untouched', () => {
    const css = run('.a { height: 100vh; }');
    expect(css.match(/height/g)).toHaveLength(1);
  });

  it('does not stack fallbacks when the pass runs over its own output', () => {
    const once = run('.a { height: 100dvh; }');
    expect(postcss([viewportUnitFallback()]).process(once, { from: undefined }).css.match(/height: 100vh/g)).toHaveLength(1);
  });
});

describe('installLegacyCssPasses', () => {
  it('puts the legacy passes ahead of the plugins Nuxt already resolved', () => {
    const config = { css: { postcss: { plugins: [{ postcssPlugin: 'cssnano' }] } } };
    installLegacyCssPasses(config);
    expect(config.css.postcss.plugins.map(plugin => plugin.postcssPlugin))
      .toEqual(['vuetify-layer-order', 'postcss-cascade-layers', 'viewport-unit-fallback', 'cssnano']);
  });

  it('is idempotent — vite:extendConfig fires for both builds, which may share one css object', () => {
    const config = { css: { postcss: { plugins: [] as { postcssPlugin?: string }[] } } };
    installLegacyCssPasses(config);
    installLegacyCssPasses(config);
    expect(config.css.postcss.plugins).toHaveLength(3);
  });

  it('throws rather than silently shipping layered CSS if the chain moves', () => {
    expect(() => installLegacyCssPasses({ css: {} })).toThrow(/css\.postcss\.plugins/);
  });
});
