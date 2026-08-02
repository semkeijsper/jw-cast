import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PADDING_TOKEN, UNLAYERED_PADDING } from '~/config/cssLayers';
import { emitLegacyStylesheets, flattenStylesheet, LEGACY_CSS_SUFFIX, legacyCssHref } from '../../build/legacy-css';

async function fixtureDir(files: Record<string, string>) {
  const dir = await mkdtemp(join(tmpdir(), 'legacy-css-'));
  for (const [name, contents] of Object.entries(files)) {
    await writeFile(join(dir, name), contents);
  }
  return dir;
}

describe('legacyCssHref', () => {
  it('maps a built stylesheet onto its twin', () => {
    expect(legacyCssHref('/_nuxt/entry.CZp6Aps3.css', '/_nuxt/'))
      .toBe(`/_nuxt/entry.CZp6Aps3${LEGACY_CSS_SUFFIX}`);
  });

  it('honours the baseURL prefix the staging deploy runs under', () => {
    expect(legacyCssHref('/jw-cast-staging/_nuxt/entry.css', '/jw-cast-staging/_nuxt/'))
      .toBe(`/jw-cast-staging/_nuxt/entry${LEGACY_CSS_SUFFIX}`);
    expect(legacyCssHref('/_nuxt/entry.css', '/jw-cast-staging/_nuxt/')).toBeNull();
  });

  it('ignores stylesheets outside the build assets dir', () => {
    expect(legacyCssHref('https://cdn.example.com/x.css', '/_nuxt/')).toBeNull();
  });

  it('ignores non-CSS and already-swapped hrefs', () => {
    expect(legacyCssHref('/_nuxt/entry.js', '/_nuxt/')).toBeNull();
    expect(legacyCssHref(`/_nuxt/entry${LEGACY_CSS_SUFFIX}`, '/_nuxt/')).toBeNull();
  });
});

describe('flattenStylesheet', () => {
  it('replaces layers with the padding for the layer each rule came from', async () => {
    const { css } = await flattenStylesheet('@layer vuetify-components { .v-btn { color: red } }');
    expect(css).toContain(`.v-btn${PADDING_TOKEN.repeat(3)}`);
    expect(css).not.toContain('@layer');
  });

  it('pads an unlayered file so its rules still outrank every layer', async () => {
    // Nuxt emits several CSS bundles; one holding only unlayered rules still
    // needs padding, or the twins of its siblings would outrank it
    const { css } = await flattenStylesheet('.plyr { color: red }');
    expect(css).toContain(`.plyr${PADDING_TOKEN.repeat(UNLAYERED_PADDING)}`);
  });

  it('resolves nested layers against the global order, not the file order', async () => {
    const { css } = await flattenStylesheet('@layer vuetify-utilities { @layer helpers { .d-flex { display: flex } } }');
    expect(css).toContain(`.d-flex${PADDING_TOKEN.repeat(7)}`);
  });

  it('reports plugin warnings rather than swallowing them', async () => {
    const { warnings } = await flattenStylesheet('@layer vuetify-core { .a { color: revert-layer } }');
    expect(warnings.join(' ')).toMatch(/revert-layer/);
  });
});

describe('emitLegacyStylesheets', () => {
  it('writes a twin beside every stylesheet and leaves the originals layered', async () => {
    const dir = await fixtureDir({
      'entry.css': '@layer vuetify-components { .v-btn { color: red } }',
      'chunk.css': '.scoped { color: blue }',
      'app.js': 'export default 1;',
    });

    const emitted = await emitLegacyStylesheets(dir);
    expect(emitted).toHaveLength(2);

    expect((await readdir(dir)).sort()).toEqual([
      'app.js',
      `chunk${LEGACY_CSS_SUFFIX}`,
      'chunk.css',
      `entry${LEGACY_CSS_SUFFIX}`,
      'entry.css',
    ].sort());

    expect(await readFile(join(dir, 'entry.css'), 'utf8')).toContain('@layer');
    expect(await readFile(join(dir, `entry${LEGACY_CSS_SUFFIX}`), 'utf8')).not.toContain('@layer');
  });

  it('does not generate twins of twins when run twice', async () => {
    const dir = await fixtureDir({ 'entry.css': '@layer vuetify-components { .v-btn { color: red } }' });

    await emitLegacyStylesheets(dir);
    const second = await emitLegacyStylesheets(dir);

    expect(second).toHaveLength(1);
    expect(await readdir(dir)).toHaveLength(2);
  });
});
