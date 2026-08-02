import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import cascadeLayers from '@csstools/postcss-cascade-layers';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import {
  PADDING_TOKEN,
  UNLAYERED_PADDING,
  VUETIFY_LAYER_ORDER,
  VUETIFY_LAYERS,
  layerPadding,
} from '~/config/cssLayers';
import { flattenCssLayers } from '~/utils/cssLayers';

const require = createRequire(import.meta.url);

function paddingCount(selector: string) {
  return selector.split(PADDING_TOKEN).length - 1;
}

describe('VUETIFY_LAYER_ORDER', () => {
  it('still matches the layer declaration Vuetify ships', () => {
    // Vuetify writes one `@layer name;` per line where we use comma lists, so
    // both sides collapse to a flat name sequence — the assertion is that the
    // same names are declared in the same order.
    const names = (css: string) => [...css.matchAll(/@layer\s+([^;{]+)[;{]/g)]
      .flatMap(match => match[1]!.split(',').map(name => name.trim()));

    const scss = readFileSync(require.resolve('vuetify/lib/styles/generic/_layers.scss'), 'utf8');
    expect(names(VUETIFY_LAYER_ORDER)).toEqual(names(scss));
  });
});

describe('VUETIFY_LAYERS', () => {
  // The runtime flattener has to land on exactly the specificity the build-time
  // flattener produced, or the theme stylesheet ranks against a different scale
  // than the CSS it has to override.
  it('gives each layer the padding @csstools/postcss-cascade-layers assigns it', async () => {
    const probes = VUETIFY_LAYERS.map((layer, index) => {
      const [parent, child] = layer.split('.');
      const rule = `.probe-${index} { color: red; }`;
      return child ? `@layer ${parent} { @layer ${child} { ${rule} } }` : `@layer ${parent} { ${rule} }`;
    });
    const result = await postcss([cascadeLayers()])
      .process(`${VUETIFY_LAYER_ORDER}\n${probes.join('\n')}\n.probe-unlayered { color: red; }`, { from: undefined });

    for (const [index, layer] of VUETIFY_LAYERS.entries()) {
      const selector = new RegExp(`\\.probe-${index}[^{]*`).exec(result.css)?.[0] ?? '';
      expect(paddingCount(selector), `${layer} (index ${index})`).toBe(index);
    }

    const unlayered = /\.probe-unlayered[^{]*/.exec(result.css)?.[0] ?? '';
    expect(paddingCount(unlayered)).toBe(UNLAYERED_PADDING);
  });

  it('pads unlayered rules above every layer', () => {
    expect(UNLAYERED_PADDING).toBeGreaterThan(VUETIFY_LAYERS.length - 1);
    expect(layerPadding('not-a-layer')).toBe(PADDING_TOKEN.repeat(UNLAYERED_PADDING));
  });
});

describe('flattenCssLayers', () => {
  it('pads a rule by the index of the layer it came from', () => {
    const css = flattenCssLayers('@layer vuetify-components { .v-btn { color: red; } }');
    expect(css).toBe(`.v-btn${PADDING_TOKEN.repeat(3)}{ color: red; }`);
  });

  it('resolves nested layers against their parent, matching Vuetify\'s theme sheet', () => {
    const css = flattenCssLayers(`
      @layer vuetify-utilities {
        @layer theme-base { :root { --v-theme-primary: 74,109,167; } }
        @layer theme-background { .bg-primary { background-color: red; } }
      }
    `);
    expect(css).toContain(`:root${PADDING_TOKEN.repeat(5)}{`);
    expect(css).toContain(`.bg-primary${PADDING_TOKEN.repeat(8)}{`);
    expect(css).not.toContain('@layer');
  });

  it('pads the first compound so descendant matching is unchanged', () => {
    const css = flattenCssLayers('@layer vuetify-components { .a .b, .c > .d { color: red; } }');
    const pad = PADDING_TOKEN.repeat(3);
    expect(css).toBe(`.a${pad} .b,.c${pad} > .d{ color: red; }`);
  });

  it('keeps conditional at-rules and flattens what is inside them', () => {
    const css = flattenCssLayers('@media (min-width: 600px) { @layer vuetify-overrides { .a { color: red; } } }');
    expect(css).toBe(`@media (min-width: 600px){.a${PADDING_TOKEN.repeat(4)}{ color: red; }}`);
  });

  it('drops layer order statements, which mean nothing once flattened', () => {
    expect(flattenCssLayers('@layer a, b;\n.x { color: red; }')).toBe(`.x${PADDING_TOKEN.repeat(UNLAYERED_PADDING)}{ color: red; }`);
  });

  it('leaves unlayered CSS at the top of the cascade', () => {
    const css = flattenCssLayers('.x { color: red; }');
    expect(css).toBe(`.x${PADDING_TOKEN.repeat(UNLAYERED_PADDING)}{ color: red; }`);
  });
});
