import { prerenderLocales, seoFor, SITE_URL } from './app/config/seoMeta';
import { COMPAT_PROBE_SCRIPT, LEGACY_POLYFILL_SCRIPT } from './build/legacy-runtime';
import { installLegacyCssPasses } from './build/postcss-legacy';
import { applyPrerenderSeo } from './build/prerender-seo';

/**
 * Oldest engine the built output is expected to run on: Chromium 85, the browser
 * in Samsung's Tizen 6.5 TVs (2022 models). Later Tizen releases are newer
 * (7.0 ≈ Cr 94, 8.0 ≈ Cr 108) but all of them sit below Vite's default
 * `baseline-widely-available` target, and none of them support CSS cascade
 * layers — which is why build/postcss-legacy.ts flattens those away.
 */
const LEGACY_TARGET = 'chrome85';

const defaultSeo = seoFor('en');

// Production is a custom domain served at "/"; the staging deploy is a GitHub Pages
// project page under "/jw-cast-staging/" and sets these two vars in CI.
const baseURL = process.env.NUXT_APP_BASE_URL || '/';
const siteUrlEnv = process.env.NUXT_PUBLIC_SITE_URL || '';

export default defineNuxtConfig({
  compatibilityDate: '2026-07-23',

  // Client-side only — no SSR
  ssr: false,

  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/test-utils/module',
    'nuxt-gtag',
  ],

  gtag: {
    id: 'G-EBSJ0TYTPY',
  },

  devtools: { enabled: true },

  components: [{ path: '~/components', pathPrefix: false }],

  app: {
    baseURL,

    // GitHub Pages SPA: handle history-mode routing via 404.html redirect
    head: {
      title: defaultSeo.title,
      meta: [
        { charset: 'utf8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'google', content: 'notranslate' },
        { name: 'title', content: defaultSeo.title },
        { name: 'description', content: defaultSeo.description },
        // Social previews: WhatsApp/Facebook/X crawlers never run JS, so these must be
        // in the served HTML. Per-locale values are patched in by build/prerender-seo.ts.
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'JW Cast' },
        { property: 'og:url', content: SITE_URL },
        { property: 'og:title', content: defaultSeo.title },
        { property: 'og:description', content: defaultSeo.description },
        { property: 'og:image', content: `${SITE_URL}/assets/android-chrome-256x256.png` },
        { property: 'og:image:width', content: '256' },
        { property: 'og:image:height', content: '256' },
        { property: 'og:locale', content: 'en' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: defaultSeo.title },
        { name: 'twitter:description', content: defaultSeo.description },
        { name: 'twitter:image', content: `${SITE_URL}/assets/android-chrome-256x256.png` },
        {
          name: 'keywords',
          content:
            'jw.org subtitles, jw.org chromecast subtitles, jw.org download subtitles, jw cast, jw-cast, jw.org ondertiteling, jw ondertiteling, jehovah\'s witnesses convention subtitles',
        },
        { name: 'robots', content: 'index, follow' },
      ],
      // baseURL ends in "/", so these resolve to /assets/… in production and to
      // /jw-cast-staging/assets/… on the staging project page
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: `${baseURL}assets/apple-touch-icon.png` },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${baseURL}assets/favicon-32x32.png` },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: `${baseURL}assets/favicon-16x16.png` },
        { rel: 'manifest', href: `${baseURL}assets/site.webmanifest` },
        { rel: 'mask-icon', href: `${baseURL}assets/safari-pinned-tab.svg`, color: '#4a6da7' },
        { rel: 'shortcut icon', href: `${baseURL}favicon.ico` },
      ],
      script: [
        {
          // Must be first: it installs the error listeners that catch failures
          // in everything after it, including the bundle failing to boot.
          innerHTML: COMPAT_PROBE_SCRIPT,
        },
        {
          // Methods Vue/Vuetify call during the first render that postdate the
          // Chromium in a Samsung TV — see build/legacy-runtime.ts.
          innerHTML: LEGACY_POLYFILL_SCRIPT,
        },
        {
          // GitHub Pages SPA: restore the path encoded by 404.html (?p=/path&q=query).
          // Must run as an inline head script so the URL is fixed before the module
          // entry script boots Vue Router — restoring it any later (e.g. onMounted)
          // loses the race against the router resolving "/" and redirecting.
          // The encoded path is app-relative, so the baseURL is prepended back on
          // (a no-op on production, where baseURL is "/").
          innerHTML: String.raw`(function(l,b){var m=/^\?p=(\/[^&]*)(?:&q=([^&]*))?/.exec(l.search);if(m){var p=m[1].replace(/~and~/g,'&');var q=m[2]?'?'+m[2].replace(/~and~/g,'&'):'';window.history.replaceState(null,'',b+p.slice(1)+q+l.hash);}})(window.location,${JSON.stringify(baseURL)});`,
        },
        {
          // cast_sender.js captures whatever window.__onGCastApiAvailable holds
          // when it runs, then replaces the global with an internal counter — so
          // this stub must exist before it loads, and nothing may reassign the
          // global afterwards (useCast polls for the SDK globals instead).
          innerHTML: `window.__onGCastApiAvailable=function(a){window.__castApiReady=a;};`,
        },
        {
          // Google Cast Sender SDK — calls window.__onGCastApiAvailable when ready
          src: 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1',
          async: true,
        },
      ],
    },
  },

  css: [
    'plyr/dist/plyr.css',
    'swiper/css',
    'swiper/css/navigation',
    'swiper/css/scrollbar',
    '~/assets/styles/main.css',
  ],

  fonts: {
    families: [{ name: 'Roboto', weights: [100, 300, 400, 500, 700, 900] }],
  },

  eslint: {
    config: {
      standalone: false,
      import: {
        package: 'eslint-plugin-import-lite',
      },
    },
  },

  piniaPluginPersistedstate: {
    storage: 'cookies',
    cookieOptions: { maxAge: 60 * 60 * 24 * 365 },
  },

  vuetify: {
    moduleOptions: {
      styles: { configFile: 'assets/styles/settings.scss' },
      prefixComposables: ['useLayout'],
    },
    vuetifyOptions: {
      // Vuetify 2 breakpoints; keep in sync with $grid-breakpoints in settings.scss
      display: {
        thresholds: {
          xs: 0,
          sm: 600,
          md: 960,
          lg: 1264,
          xl: 1904,
          xxl: 2560,
        },
      },
      theme: {
        themes: {
          light: { colors: { primary: '#4a6da7' } },
          dark: { colors: { primary: '#4a6da7' } },
        },
      },
      icons: {
        defaultSet: 'mdi',
      },
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  nitro: {
    prerender: {
      // Static shells per language route so GitHub Pages answers /:language with a
      // real 200 + meta instead of falling through to public/404.html.
      crawlLinks: false,
      // Routes are origin-absolute, so they carry the baseURL — without it the app
      // redirects /:locale to the based path and nitro saves a redirect stub instead
      // of a shell.
      routes: [baseURL, ...prerenderLocales.map(locale => `${baseURL}${locale}`)],
    },
  },

  hooks: {
    // Flattens Vuetify's cascade layers out of every emitted stylesheet — see
    // CLAUDE.md → Legacy browser support
    'vite:extendConfig'(config) {
      installLegacyCssPasses(config);
    },

    'nitro:init'(nitro) {
      nitro.hooks.hook('prerender:generate', route => {
        if (typeof route.contents !== 'string' || !route.fileName?.endsWith('.html')) {
          return;
        }
        route.contents = applyPrerenderSeo(route.contents, route.route, baseURL);
      });
    },
  },

  vite: {
    build: {
      // Vite's default target is roughly Chromium 107, which no Samsung TV
      // browser reaches — see LEGACY_TARGET.
      target: LEGACY_TARGET,
      cssTarget: LEGACY_TARGET,
    },

    define: {
      // config/seoMeta.ts reads this to build canonical/OG URLs. It runs both at
      // build time (nuxt.config, build/prerender-seo.ts) and in the client bundle,
      // where process.env is an empty shim — so inline the value for the client.
      'process.env.NUXT_PUBLIC_SITE_URL': JSON.stringify(siteUrlEnv),
    },

    optimizeDeps: {
      include: [
        'plyr',
        'swiper/modules',
        'swiper/vue',
      ],
    },
  },
});
