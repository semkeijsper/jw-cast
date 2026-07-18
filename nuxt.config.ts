// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-12-21',

  // Client-side only — no SSR
  ssr: false,

  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/eslint',
    '@nuxt/fonts',
  ],

  devtools: { enabled: true },

  app: {
    // GitHub Pages SPA: handle history-mode routing via 404.html redirect
    head: {
      title: 'JW Cast',
      meta: [
        { charset: 'utf8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'google', content: 'notranslate' },
        { name: 'title', content: 'JW Cast' },
        {
          name: 'description',
          content:
            'Cast jw.org videos to your TV with subtitles of any language, or download the video and subtitle files to use with a media player such as VLC.',
        },
        {
          name: 'keywords',
          content:
            'jw.org subtitles, jw.org chromecast subtitles, jw.org download subtitles, jw cast, jw-cast, jw.org ondertiteling, jw ondertiteling, jehovah\'s witnesses convention subtitles',
        },
        { name: 'robots', content: 'index, follow' },
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/assets/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/assets/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/assets/favicon-16x16.png' },
        { rel: 'manifest', href: '/assets/site.webmanifest' },
        { rel: 'mask-icon', href: '/assets/safari-pinned-tab.svg', color: '#4a6da7' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
      ],
      script: [
        {
          // GitHub Pages SPA: restore the path encoded by 404.html (?p=/path&q=query).
          // Must run as an inline head script so the URL is fixed before the module
          // entry script boots Vue Router — restoring it any later (e.g. onMounted)
          // loses the race against the router resolving "/" and redirecting.
          innerHTML: String.raw`(function(l){var m=/^\?p=(\/[^&]*)(?:&q=([^&]*))?/.exec(l.search);if(m){var p=m[1].replace(/~and~/g,'&');var q=m[2]?'?'+m[2].replace(/~and~/g,'&'):'';window.history.replaceState(null,'',p+q+l.hash);}})(window.location);`,
        },
        {
          // Google Analytics
          innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-EBSJ0TYTPY');`,
        },
        {
          src: 'https://www.googletagmanager.com/gtag/js?id=G-EBSJ0TYTPY',
          async: true,
        },
        {
          // Early Cast callback — captures SDK readiness before Vue mounts
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

  css: ['plyr/dist/plyr.css', 'swiper/css', 'swiper/css/navigation', 'swiper/css/scrollbar'],

  // Self-hosted at build time; Vuetify references Roboto from its compiled CSS,
  // so declare the family explicitly instead of relying on scan detection.
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
});
