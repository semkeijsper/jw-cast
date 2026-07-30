# CLAUDE.md

This file provides guidance for AI assistants working in this repository.

## Project Overview

**jw-cast** is a Nuxt 4 + Vue 3 + TypeScript single-page application that provides a frontend interface for browsing and playing Jehovah's Witnesses media from jw.org. Users can independently select the audio language and subtitle language for videos, and watch via the embedded Plyr player, native Chromecast (Google Cast SDK), or download via VLC.

- **Live site:** https://jwcast.semdev.nl
- **Staging:** https://semkeijsper.github.io/jw-cast-staging/ (mirror repo, see Deployment → Staging)
- **Deployment:** `pnpm run build` → `git subtree push --prefix .output/public origin gh-pages`
- **No backend:** pure client-side app consuming jw.org's public API directly

## Tech Stack

| Layer | Technology |
|---|---|
| Meta-framework | Nuxt 4 (`ssr: false`) |
| Framework | Vue 3 |
| Language | TypeScript 6 (strict mode) |
| UI Library | Vuetify 4 via `vuetify-nuxt-module` (sass variables in `app/assets/styles/settings.scss`) |
| State | Pinia (three composition stores: `language` + `ui` + `playback`) |
| Routing | Vue Router 4 via Nuxt pages/ |
| Video player | Plyr (dynamic import, client-only; patched via `patches/plyr.patch`) |
| Chromecast | Google Cast Web Sender SDK (Default Media Receiver) |
| Carousel | Swiper 14 via `swiper/vue` |
| HTTP client | `$fetch` (Nuxt built-in, via ofetch) via typed wrappers in `utils/api.ts` |
| Analytics | Google Analytics 4 via `nuxt-gtag` module (measurement ID in `nuxt.config.ts`; SPA page views rely on GA4 Enhanced Measurement history tracking) |
| Package manager | pnpm (node >= 22) |
| Linting | ESLint flat config: `eslint-config-vuetify` (with `vue: true`) + `@nuxt/eslint` (stylistic rules, no Prettier) |
| Testing | Vitest via `@nuxt/test-utils` — two projects: `unit` (plain Node) + `nuxt` (happy-dom Nuxt env) |

## Development Commands

```bash
pnpm install          # Install dependencies (also runs nuxt prepare)
pnpm dev              # Start dev server with hot reload
pnpm build            # Static SPA build into .output/public/ (github_pages preset)
pnpm lint             # Run ESLint (lint:fix to autofix)
pnpm preview          # Preview the built output
pnpm test             # Run the unit + nuxt Vitest projects (test:watch for watch mode)
pnpm test:e2e         # Run the browser suite (builds the app, needs network)
pnpm deploy:staging   # Force-push the current branch to the staging mirror
```

`build` uses nitro's `github_pages` preset rather than plain `nuxt generate`. The output is identical except for a `.nojekyll` marker — which is load-bearing: without it a branch-based Pages deploy runs Jekyll, and Jekyll drops `_`-prefixed directories, i.e. all of `_nuxt/` and `_fonts/`.

Automated tests run under **Vitest** (see the Testing section), including the browser suite — `pnpm test` stays fast and offline, `pnpm test:e2e` is the opt-in real-browser run.

## Repository Structure

```
app/
├── app.vue                          # Slim shell: app bar, <NuxtPage>, global overlays
├── assets/styles/
│   ├── settings.scss                # Vuetify SASS variable overrides (styles.configFile)
│   └── main.css                     # Global reset + element styles (loaded via nuxt.config css)
├── pages/
│   ├── index.vue                    # Redirect / → /:browser-language
│   └── [language]/
│       └── [[videoId]].vue          # Main page: language selector + 4 category rows;
│                                    #   videoId is optional — opens that video on load
├── components/                      # Domain directories; pathPrefix: false — usage name = filename,
│   │                                #   so component filenames must be globally unique
│   ├── browse/                      # Category browsing surface
│   │   ├── VideoCategory.vue        # Fetches one named category, renders grid or swiper
│   │   ├── VideoGrid.vue            # Responsive grid (used for LatestVideos)
│   │   ├── VideoSwiper.vue          # Horizontal Swiper carousel
│   │   └── VideoCard.vue            # Shared video/result card (2:1 image, gradient overlay)
│   ├── player/                      # Everything inside the video player modal
│   │   ├── VideoDialog.vue          # Player modal orchestrator (dialog chrome + wiring)
│   │   ├── VideoDownloadMenu.vue    # Toolbar download menu (files, .vtt, jw.org link)
│   │   ├── TranscriptPanel.vue      # Synced transcript panel (search, click-to-seek)
│   │   └── TranscriptButton.vue     # Toggles the transcript panel
│   ├── cast/                        # Chromecast domain
│   │   ├── CastBar.vue              # Global Chromecast control bar (fixed bottom)
│   │   └── CastButton.vue           # Cast menu button (quality picker)
│   ├── search/
│   │   └── SearchDialog.vue         # Search UI with pagination + link-paste parsing
│   └── common/                      # Cross-domain building blocks
│       ├── LanguageSelect.vue       # Shared language autocomplete (v-model, items, icon)
│       ├── PageSection.vue          # Centered max-width section wrapper
│       └── GetNotifiedDialog.vue    # WhatsApp channel promo dialog
├── composables/                     # Stateful / lifecycle-bound logic
│   ├── useCast.ts                   # Google Cast SDK wrapper (module-level shared refs)
│   ├── usePlyrPlayer.ts             # Plyr lifecycle, race guard, position restore, control injection
│   ├── useMediaItems.ts             # videoMedia/subtitleMedia state + language watchers
│   └── useVideoRoute.ts             # Single owner of /:language/:videoId URL sync
├── utils/                           # Pure functions, auto-imported
│   ├── api.ts                       # Typed $fetch wrappers + API base URLs + downloadableFiles
│   ├── language.ts                  # languageLabel
│   ├── time.ts                      # formatTime (H:MM:SS)
│   ├── searchLink.ts                # parseVideoLink (finder/media-items parsing) + sortKeyOf
│   ├── transcript.ts                # activeCueIndex + highlightSegments (transcript logic)
│   └── vtt.ts                       # parseVtt
├── config/                          # Hand-maintained data tables (NOT auto-imported — import explicitly)
│   ├── uiStrings.ts                 # Locale-keyed UI string dictionary (see UI Strings below)
│   ├── seoMeta.ts                   # Locale-keyed title/description + SITE_URL (see SEO)
│   └── whatsappChannels.ts          # Per-language WhatsApp channel links
├── stores/
│   ├── language.ts                  # useLanguageStore — languages, locales, translations, t()
│   ├── ui.ts                        # useUiStore — dialog flags, selectedVideo, openVideo()
│   └── playback.ts                  # usePlaybackStore — cast + local transport state slices
└── types/
    ├── index.ts                     # Domain: Language, Video, Category, MediaFile, SubtitleCue, …
    ├── search.ts                    # Search API response types
    ├── playback.ts                  # CastState / LocalState discriminated unions
    └── cast.ts                      # Hand-written Cast SDK surface
public/
├── 404.html                         # GitHub Pages SPA redirect trick
├── sitemap.xml, robots.txt, CNAME
└── assets/                          # Favicons, PWA manifest
test/                                # Vitest suites (see Testing)
├── setup.ts                         # happy-dom browser-API stubs for the nuxt project
├── unit/                            # Pure-function specs (plain Node)
├── nuxt/                            # Store + component specs (Nuxt env, mountSuspended)
└── e2e/                             # Real-browser player specs (opt-in, see Testing)
build/
└── prerender-seo.ts                 # Build-time head patcher for prerendered shells (see SEO)
.github/workflows/
└── staging.yml                      # Staging Pages deploy; inert here, runs only in the mirror repo
patches/
└── plyr.patch                       # pnpm patch: drop "type":"module" from plyr's package.json
```

## Code Conventions

### Component Style

All components use Vue 3 `<script setup lang="ts">` — no Options API, no Class Components.

```vue
<template>
  <v-btn @click="doSomething">{{ label }}</v-btn>
</template>

<script setup lang="ts">
import type { Video } from '~/types';

const props = defineProps<{ video: Video }>();
const languageStore = useLanguageStore();

const label = computed(() => languageStore.t('btnPlay'));

function doSomething() { ... }
</script>
```

### Auto-imports

Nuxt auto-imports: Vue composables (`ref`, `computed`, `watch`, `onMounted`, etc.), Nuxt composables (`useRoute`, `useRouter`, `navigateTo`, `nextTick`), composables from `composables/`, utils from `utils/`, stores from `stores/`, and all components from `components/`.

- **Components:** `pathPrefix: false` is set in `nuxt.config.ts` — a component's usage name equals its filename regardless of subdirectory (`components/cast/CastButton.vue` → `<CastButton>`). Filenames must therefore be globally unique.
- **`config/` is not auto-imported** — import data tables explicitly so consumers are greppable.
- **Always** import types explicitly: `import type { Video } from '~/types'` (search types from `~/types/search`, Cast SDK types from `~/types/cast`).

Vuetify composables (`useDisplay`, `useTheme`) are **not** auto-imported — import them from `'vuetify'`.

### Naming Conventions

- **Components:** PascalCase filenames (`VideoDialog.vue`), globally unique
- **Event handlers:** camelCase prefixed with `on` (`onClickVideo`, `onSelectFile`)
- **Store mutations:** `set` prefix (`setSiteLanguage`, `setVideoDialog`); higher-level actions are verbs (`openVideo`)
- **Store locale state vs resolved objects:** locale strings keep plain names (`siteLanguage`, `videoLanguage`, `subtitleLanguage`); the resolved `Language`-object getters carry an `Info` suffix (`siteLanguageInfo`, …) and are typed non-null — no `!` needed at call sites
- **Dialog state:** `dialog` computed wrapping the store boolean (get/set pattern); the transcript is a *panel*: `transcriptPanel` / `setTranscriptPanel`
- **CSS classes:** kebab-case; Vuetify utilities (`d-flex`, `text-white`, etc.)

### Vuetify 4 API Notes (migrating from Vuetify 2 idioms)

| Vuetify 2 | Vuetify 3/4 |
|---|---|
| `dense` | `density="compact"` |
| `outlined` | `variant="outlined"` |
| `<v-btn text>` | `variant="text"` |
| `v-slot:activator="{ on, attrs }"` | `v-slot:activator="{ props }"` |
| `$vuetify.breakpoint.xsOnly` | `useDisplay().xs` |
| `v-img gradient="..."` | CSS overlay div inside `v-img` |
| `class="white--text"` | `class="text-white"` |
| `v-list-item-icon` | `prepend-icon` prop on `v-list-item` |
| `v-app-bar app` | just `v-app-bar` |

### Styling

- Scoped CSS (plain, not SCSS) inside `.vue` files; global reset lives in `assets/styles/main.css`
- Vuetify grid (`v-container`, `v-row`, `v-col`) for layout; use `<PageSection>` for the centered max-width page sections
- Responsive breakpoints via `useDisplay()` from `'vuetify'`
- Dark mode: detected at startup in `app.vue` and follows OS theme changes via a `matchMedia` listener
- Image gradient overlay: `<div class="image-overlay">` inside `<v-img>` with `background: linear-gradient(...)`
- Video/search result cards: always use the shared `VideoCard.vue` (`src`, `title` props, `click` event) — do not duplicate card markup in consumers

### Formatting

Enforced by ESLint stylistic rules (`eslint.config.js`, no Prettier):

- Single quotes
- Semicolons
- Trailing commas everywhere
- Stroustrup brace style
- LF line endings
- Indent: 2 spaces

Run `pnpm lint` (or `pnpm lint:fix`) before committing.

### TypeScript

- Strict mode via Nuxt's generated `tsconfig.json`; `typeCheck: true` runs vue-tsc in dev and build
- Domain types in `types/index.ts`; search API types in `types/search.ts`; Cast SDK surface in `types/cast.ts`
- No implicit `any`; use `unknown` or proper types

## State Management (Pinia)

Three flat composition stores:

**`stores/language.ts` — `useLanguageStore`**

| Field | Purpose |
|---|---|
| `languages` | All available languages (seeded with Dutch + English) |
| `siteLanguage` | Selected UI/content locale (string) |
| `videoLanguage` | Selected audio-language locale (persisted) |
| `subtitleLanguage` | Selected subtitle locale (persisted) |
| `siteLanguageInfo` / `videoLanguageInfo` / `subtitleLanguageInfo` | Resolved `Language` objects (non-null) |
| `translations` | Fetched translation strings from jw.org API |
| `whatsappChannel` | Channel entry for the current locale |
| `t(key)` | UI string resolution (see UI Strings) |

Persistence: `pinia-plugin-persistedstate` with **`key: 'app'` pinned** (the pre-split cookie name) and `pick: ['videoLanguage', 'subtitleLanguage']`. **Do not rename the persisted fields or the cookie key** — existing visitors' saved selections depend on them. The legacy `jw_videoLanguage`/`jw_subtitleLanguage` cookies are still read once as a fallback.

**`stores/ui.ts` — `useUiStore`**

| Field | Purpose |
|---|---|
| `searchDialog` / `videoDialog` / `getNotifiedDialog` | Dialog open flags |
| `transcriptPanel` | Transcript panel open flag |
| `transcriptExpanded` | Mobile transcript full-screen expand flag (cleared when the panel closes) |
| `selectedVideo` | Currently focused `Video` object |
| `openVideo(video)` | The single entry point for opening a video (sets `selectedVideo` + `videoDialog`) — use it for every open path |

**`stores/playback.ts` — `usePlaybackStore`**

Single owner of playback-session state, one slice per transport (`types/playback.ts` `CastState` / `LocalState` discriminated unions). Cast and local can be non-idle at the same time — the cast session is app-global and survives dialog close, while the local player is dialog-scoped — so they are two concurrent slices, not one exclusive union.

| Field / getter | Purpose |
|---|---|
| `cast` | Cast slice (`idle` / `connecting` / `active`), written by `useCast` |
| `local` | Local-player slice (`idle` / `loading` / `ready`), written by `usePlyrPlayer` |
| `lastCastPosition` | Position retained across `castIdle` so the cast → local handoff resumes there |
| `castTargetKey` | The persisted cast identity — see below |
| `setCastConnecting` / `setCastActive` / `castIdle` | Cast-slice mutations (connecting seeds `lastCastPosition` for the cancel/fallback case) |
| `setLocalLoading` / `setLocalReady` / `updateLocal` / `localIdle` | Local-slice mutations |
| `isCastTarget(v)` / `isCastingVideo(v)` / `localPositionOf(v)` / `positionFor(v)` | Identity-aware reads for a dialog's `selectedVideo` (`positionFor` is the transcript clock: cast position when casting, else local) |

Mutations are `set*` functions. Async work stays in components/composables, calling `utils/api.ts` helpers.

**The cast slice is keyed, the local slice is not.** `CastState` carries a `videoKey` (`languageAgnosticNaturalKey`) rather than a `Video`, because a cast session outlives the page: it must be restorable from storage after a reload (see Chromecast → Reload mid-cast). `LocalState` is dialog-scoped and keeps the real object. The identity-aware getters still take `Video | null`, so consumers never handle keys themselves.

Persistence: this store persists **only** `castTargetKey`, via `piniaPluginPersistedstate.sessionStorage()` — per-tab, and deliberately *not* the language store's pinned `'app'` cookie (the plugin's Nuxt default is cookies, so the `storage` option must be passed explicitly or this would ride on every request).

## UI Strings

`config/uiStrings.ts` holds locally-owned shell strings, keyed by **locale** (the `Language.locale` string, e.g. `en`, `nl`, `es`, `cmn_hans` — the same value stored as `siteLanguage`). `languageStore.t(key)` resolves: jw.org API translation → `uiStrings[locale]` → `uiStrings.en` → the key itself. Never hardcode user-facing strings in components — add a key to the dictionary.

**Key overlap with jw.org's translation API.** Many of our keys are *exact jw.org translation-key names* — `lnkSearch`, `btnDownload`, `hdgSubtitles`, `btnPlay`, `btnPlayWithSubtitles`, `btnPlayWithoutSubtitles`, `lnkHome`, `searchResultsCountText`, `noSearchResultsText`, `refineSearchResultsText`. For those, `t()` returns the fetched jw.org translation at runtime for **every** language, so they don't need per-locale entries. (Confirm a jw key exists before relying on this: `GET /translations/E` returns ~160 keys; grep it.)

Consequences for adding a locale block:
- **`en` is the fallback of last resort and MUST stay complete** — including the jw-overlap keys above. If the translations fetch fails, `en` is all that's left; a missing key would render the raw key string.
- **Every other locale block only carries what jw.org does NOT provide**: the bespoke shell copy (`guide`, `searchPlaceholder`, `searchFailed`, `loadFailed`, `retry`, `noTranscript`, `noResults`, `transcript`) plus the three search **sort labels** (`sortRelevance` / `sortNewest` / `sortOldest`). Do not re-add jw-overlap keys to non-`en` blocks — they're redundant (runtime covers them, `en` covers failure).
- **Sort labels come from the search API, verbatim.** jw.org has no translation key for them; fetch `search/results/:code/videos?...` and copy `sorts[].label` for `rel`/`newest`/`oldest` so the pre-query dropdown matches the labels the API returns post-query. (`SearchDialog` shows the sort dropdown before any query using these fallbacks; once a search runs, `response.sorts` labels take over.)
- jw's positional placeholders are Java-style `%1$s`; `t()` does **no** interpolation — components substitute (see the `fmt` helper in `SearchDialog.vue`).

**Locale coverage is traffic-driven, not publisher-driven.** Blocks currently cover `en, nl, es, pt, fr, de, it, ja, ko, ru, pl, tl, cmn_hans, da, fi` (~96–97% of actual site users per analytics; Netherlands dominates, then IT/US/BE/CL/CN/DK). When extending, check real analytics — biggest remaining gaps are Danish (added), Finnish (added), Hebrew (Israel; skipped — RTL, needs `isRTL` layout work). Language → jw `code`/`locale` mapping comes from `GET /languages/E/all` (e.g. Spanish=`S`/`es`, Portuguese-Brazil=`T`/`pt`, Chinese-Mandarin-Simplified=`CHS`/`cmn_hans`).

Note: the Guide button resolves specially in `app.vue` (`uiStrings[locale]?.guide ?? translations.lnkHelpView ?? uiStrings.en.guide`) — a bespoke `guide` entry wins over jw's `lnkHelpView`.

## Routing

- `pages/index.vue` — redirects to `/:browserLanguage` or `/nl`
- `pages/[language]/[[videoId]].vue` — main page; `videoId` is optional

When a video is opened (by clicking a card or from URL), the route becomes `/:language/:languageAgnosticNaturalKey`; closing the dialog pops back to `/:language`. This URL sync has a **single owner**: `composables/useVideoRoute.ts`, called from the page. Do not push/pop video routes anywhere else.

The page validates unknown locales after fetching the full language list (redirect to `/en`) and shows a retry alert if the initial language/translation fetches fail.

## SEO / Prerendering

The app stays `ssr: false`, but `nitro.prerender.routes` emits a static HTML shell per language route (`/`, plus the locales in `prerenderLocales`, kept in sync with `public/sitemap.xml`). Point of this is **not** rendered content — with `ssr: false` the shells contain no markup and page-level `useHead` never runs. It is that GitHub Pages answers `/:language` with a real 200 + full head instead of falling through to `public/404.html`, which carries no meta at all. Social crawlers (WhatsApp, Facebook, X) never execute JS, so a shared deep link previewed as nothing before.

- `config/seoMeta.ts` — locale-keyed `{ title, description }`, `SITE_URL`, `prerenderLocales`, `htmlLangOf` (locale → BCP 47, e.g. `cmn_hans` → `zh-hans`). Locales without an entry fall back to `en`. **No `~`/`@` imports** — nuxt.config loads this file outside the app's alias resolution. `SITE_URL` reads `process.env.NUXT_PUBLIC_SITE_URL` (see Staging).
- `build/prerender-seo.ts` — `applyPrerenderSeo(html, route, base)`, called from the `prerender:generate` nitro hook in `nuxt.config.ts`. Rewrites `<title>`, description, `og:*`/`twitter:*`, `<html lang>`, canonical and hreflang alternates per locale. Strips `base` off the route before reading the locale (staging routes arrive as `/jw-cast-staging/nl`). Skips `/200.html` (fallback shell — a pinned canonical would be wrong) and treats `/index.html` as `/` (nitro prerenders the root twice; the second pass would otherwise overwrite the patched file).
- Prerender routes are built as `` `${baseURL}${locale}` `` — nitro fetches them origin-absolute, so without the base the app just redirects and nitro saves a redirect stub instead of a shell.
- The page (`[language]/[[videoId]].vue`) sets the same values via `useHead` so client-side language switches stay in sync.
- Video routes are deliberately **not** prerendered: unbounded, and the content is jw.org's canonical material.
- **Four lists are kept identical:** `prerenderLocales`, the `seoMeta` blocks, `config/uiStrings.ts` blocks, and `public/sitemap.xml`. A locale is only advertised once it has real translated copy — no half-supported locales getting English meta. Adding one means all four, plus a `bcp47` entry in `seoMeta.ts` if the locale isn't already a valid BCP 47 tag. Locales outside the set still route and work at runtime (jw.org supplies the content strings); they just get no shell, no sitemap entry, and English `seoMeta` fallback.

## API Integration

All HTTP calls go through the typed `$fetch` wrappers in **`utils/api.ts`** (`fetchLanguages`, `fetchTranslations`, `fetchCategory`, `fetchMediaItem`, `fetchSearch`, `fetchToken`), which also owns the API base URL constants. Components/composables call these helpers with `async/await`; don't inline raw endpoint URLs in components.

Endpoints:

- mediator — `/categories/:code/:name`, `/media-items/:code/:lank`, `/languages/:code/all`, `/translations/:code`
- search — `/:code/videos?q=&sort=&offset=&limit=`
- token — returns a JWT for search requests

## Video Player

`player/VideoDialog.vue` is a thin orchestrator; the moving parts live in composables:

- `usePlyrPlayer(playerEl, source)` — Plyr init/destroy behind a load-id race guard, playback-position capture/restore across language switches (Plyr's `source` setter swaps the media element asynchronously — restore happens on Plyr's `ready` event), transcript-control injection into Plyr's control bar, fullscreen Escape capture. Drives the playback store's `local` slice. The player is destroyed on dialog close, and also while a cast is active (see Chromecast). On `smAndDown` the controls array omits the `volume` slider (keeping mute) so the seek bar has room.
- `useMediaItems(onBeforeLanguageReload)` — fetches the audio-language and subtitle-language media items, refetches on video/language changes, exposes `captionUrl`/`subtitleUrl`.

Mobile ergonomics: the dialog auto-enters fullscreen when the device rotates to landscape while a video is playing (and exits on rotation back to portrait); the transcript panel has a full-screen expand toggle (`transcriptExpanded`) that hides the player row and the dialog toolbar so you can read along while casting.

## Chromecast

`composables/useCast.ts` wraps the Google Cast Web Sender SDK (types in `types/cast.ts`):

- Uses the **Default Media Receiver** (`CC1AD845`) — no app registration required
- Loaded via `<script>` in `nuxt.config.ts`; calls `window.__onGCastApiAvailable` when ready
- Shared `ref` state across all component instances: `isAvailable` plus device/config refs (device name, captions, seek/pause capability). Per-media transport state lives in the playback store's `cast` slice, which `useCast` drives from `RemotePlayer` events.
- `castMedia(url, title, subtitleUrl?)` — casts MP4 with optional VTT subtitles; reuses a running session to switch videos
- Playback control actions drive `cast/CastBar.vue`, a global control bar in `app.vue`

**Exclusive playback:** casting is exclusive with the local player. From `SESSION_STARTING` until the cast ends, the local Plyr instance is destroyed and the player area shows a poster placeholder with the cast device name (CastBar carries the controls). The handoff position is carried on the cast `LoadRequest.currentTime` and re-enforced with an explicit seek once the receiver reports the media loaded; when the cast ends with the dialog still open the local player rebuilds at `lastCastPosition`. The connecting state is entered on `SESSION_STARTING` (a device was actually picked), not before `requestSession()`, so cancelling the device picker leaves local playback untouched. `CastButton.vue` shows its own loading spinner across the pending `requestSession` promise.

**Session handshake:** `requestSession()` settles at `SESSION_STARTING`, *not* when the session is usable — `getCurrentSession()` is routinely still `null` when it returns, so loading straight after it made the first cast from a cold page load silently fail (a reload then "fixed" it only because `ORIGIN_SCOPED` auto-rejoin took the reuse branch). `castMedia` therefore awaits `waitForSession()`, which resolves from the `SESSION_STARTED`/`SESSION_RESUMED` handler (or `null` on `SESSION_START_FAILED`/`SESSION_ENDED`/timeout). Never load media off the `requestSession()` promise alone. `requestSession()` also *resolves* with a `chrome.cast.ErrorCode` instead of rejecting on some paths, so its return value is checked. Failures set `castError` (rendered by `cast/CastErrorSnackbar.vue` in `app.vue`) and log to the console; a `'cancel'` code is a dismissed picker, not a failure, and stays silent.

`cast/CastButton.vue` is disabled when the Cast SDK is unavailable (e.g. non-Chromium browsers). Exclusive-cast and handoff behavior needs manual verification with real Chromecast hardware — it can't be exercised headless; `test/nuxt/composables/useCast.test.ts` covers the session handshake against a fake SDK.

**Reload mid-cast:** `ORIGIN_SCOPED` auto-join rejoins the running session, so the receiver keeps playing — but the store's `cast` slice starts idle and `syncRemotePlayer` only writes to a non-idle slice, so nothing would ever bring it back. `restoreResumedSession()` re-adopts it from the persisted `castTargetKey`, then lets `RemotePlayer` events refill title/device/position. It runs from both the `SESSION_RESUMED` handler *and* the tail of `configureCast()`, because auto-join can finish before `app.vue`'s `onMounted` attaches the listener. Caption state is read back off `getMediaSession()`; it is the one thing a `LoadRequest` knows that a rejoined session doesn't. **The breadcrumb is per-tab** — a *new* tab on the same origin auto-joins but has no key, so it shows no CastBar. That is deliberate: cross-tab restore needs localStorage plus invalidation on every session end.

## Search

`search/SearchDialog.vue`:

- **Infinite scroll** (not pagination). Page size `LIMIT = 12`; results accumulate in a `results` array, `fetchResponse(query, { append })` pushes the next page. A `v-intersect` sentinel at the bottom of the scroll region fetches the next `offset` when it enters view; `hasMore` = `results.length < insight.total.value`.
- **Layout is a fixed header + inner-scroll body.** `v-card` is a flex column; the `v-toolbar` (search field) and a sort bar stay pinned while a `v-card-text.results-scroll` scrolls. The scroll region is height-capped on desktop (`@media (min-width: 960px) { max-height: min(70vh, 600px) }`) so one page always overflows — otherwise on tall viewports the sentinel is visible at load and auto-fetches a 2nd page. Mobile dialog is fullscreen and fills.
- **Header** shows a live count (`searchResultsCountText` → "shown of total", grows as pages append) and the sort `v-select`. Both render from dialog open — before any query the count is a `v-skeleton-loader` and the sort dropdown uses the `sort*` uiStrings fallbacks (see UI Strings).
- Sort (relevance / newest / oldest) and new queries reset to `offset 0` + clear `results` (debounced 400ms).
- Stale responses are discarded via a latest-wins request id.
- JWT is fetched lazily on first dialog open and refreshed on 401 with a single bounded retry.
- Pasted jw.org finder / media-items links open the video directly; failures surface the error alert.
- Failed searches show a `v-alert`; zero results show the localized `noSearchResultsText` + `refineSearchResultsText`.

## Testing

Vitest, wired through `@nuxt/test-utils`. `vitest.config.ts` defines three projects so the fast pure-function specs don't pay the Nuxt-runtime cost:

- **`unit`** (`test/unit/`) — plain Node environment, `~`/`@` aliased to `app/`. Pure functions only: `parseVtt`, `formatTime`, `downloadableFiles`, `languageLabel`, `parseVideoLink`/`sortKeyOf`, `activeCueIndex`/`highlightSegments`.
- **`nuxt`** (`test/nuxt/`) — happy-dom-backed Nuxt environment so source auto-imports and the `~` alias resolve. Pinia store specs (`playback`, `ui`, `language`) and component specs via `mountSuspended` (`VideoCard`, `TranscriptPanel`, `SearchDialog`). `test/setup.ts` stubs the browser APIs Vuetify touches on mount (`ResizeObserver`/`IntersectionObserver`/`matchMedia`/`scrollTo`/`scrollIntoView`).
- **`e2e`** (`test/e2e/`) — see below.

`unit` and `nuxt` are what `pnpm test` runs: no network, no external SDKs, no real Chromecast. Pull embedded pure logic out into `utils/` so it can be unit-tested cheaply rather than mounting components to reach it (that's why `searchLink.ts` and `transcript.ts` exist). Vuetify text inputs don't drive their `v-model` under happy-dom, so filter/search interactions are covered by unit tests, not by mounting.

### Browser suite (`pnpm test:e2e`)

`test/e2e/` drives a real browser via `setup({ browser: true })` + `createPage()` from `@nuxt/test-utils/e2e` — still Vitest, not a second runner (`playwright-core` is the only extra dep). It exists because the player's core guarantee is unprovable in happy-dom: a subtitle-language switch must swap the `<track>` on the *live* media element rather than rebuild Plyr, and only a real media pipeline has text tracks, cue rendering and a buffer to lose. The specs assert the media element is never replaced (`sameMedia`) and never `emptied`.

**It is opt-in and excluded from `pnpm test`** because it builds the app and hits jw.org's live API — an offline `pnpm test` stays the fast default.

- Drives the installed Edge (`channel: 'msedge'`); set `E2E_BROWSER_CHANNEL=""` to use Playwright's bundled Chromium instead (needs a separate `playwright install`).
- Autoplay is unblocked with `--autoplay-policy=no-user-gesture-required`; specs call `video.play()` muted themselves.
- The video is **pinned by lank** (`VIDEO_LANK` in `test/e2e/helpers.ts`) so specs don't depend on the weekly catalog rotation. Language option labels and "a language with no subtitles for this video" are **discovered from the API at runtime**, never hardcoded — jw.org's copy and per-language subtitle coverage both drift.
- The specs share one player session and run in order (`fileParallelism: false`, `sequence.concurrent: false`); each starts from the previous one's end state.
- Chromecast is still out of scope — exclusive-cast and handoff need real hardware.

## Patches

`patches/plyr.patch` (pnpm `patchedDependencies`) removes `"type": "module"` from Plyr 3.8.4's `package.json` so its CommonJS build resolves correctly under Nuxt/Vite. Keep the single-`vue` invariant when touching deps: `@nuxt/test-utils` can pull a second `vue` copy alongside the app's, which splits Vuetify onto a different Vue runtime and breaks its directives (`v-intersect` → blank `v-img`s, dead swiper); run `pnpm dedupe` if that recurs.

## Deployment

```bash
pnpm build
# Output is in .output/public/
git subtree push --prefix .output/public origin gh-pages
```

This is a **branch-based** Pages deploy, so Jekyll runs over the pushed tree — `pnpm build` must keep emitting `.nojekyll` or `_nuxt/` and `_fonts/` are stripped and the site serves no JS or CSS (see Development Commands). Staging is immune: it deploys the build as a Pages artifact, which bypasses Jekyll entirely.

`public/404.html` handles GitHub Pages' lack of server-side routing by encoding the path into a query param, which an inline head script in `nuxt.config.ts` restores before the router boots. `pathSegmentsToKeep` in 404.html is the number of leading path segments belonging to the deployment root (0 at a custom domain, 1 under a project page); the restore script prepends `baseURL` back onto the decoded path.

### Staging

`semkeijsper/jw-cast-staging` is a **pure mirror** — its `master` is an exact copy of whatever branch is under test, with **no commits of its own**. Deploy the current branch with:

```bash
pnpm deploy:staging     # git push staging HEAD:master --force
```

Needs the remote once: `git remote add staging https://github.com/semkeijsper/jw-cast-staging.git`. The force is intended — staging holds nothing worth keeping, and `--force-with-lease` would just fail on the first push from a different branch.

Everything that differs between the two deploys is applied at build time by `.github/workflows/staging.yml` (which lives in *this* repo, guarded by `if: github.repository == 'semkeijsper/jw-cast-staging'` so it never runs here):

| Difference | How |
|---|---|
| Served from `/jw-cast-staging/`, not `/` | `NUXT_APP_BASE_URL` — feeds `app.baseURL`, the head `link` hrefs, the 404 restore script, and the prerender routes |
| Canonical/OG point at the staging origin | `NUXT_PUBLIC_SITE_URL` — read by `config/seoMeta.ts`; mirrored into `vite.define` so the client bundle sees it too (`process.env` is an empty shim in the browser) |
| No custom domain | `rm .output/public/CNAME` |
| Extra path segment in 404 fallback | `sed` `pathSegmentsToKeep` 0 → 1 |
| Kept out of search results | `robots.txt` `Disallow: /`, sitemap removed, `robots` meta sed to `noindex, nofollow` |

So: **keep staging-specific behavior in the workflow, never in a commit.** An overlay commit would have to be rebased on every update; this way there is nothing to rebase.

## Git Workflow

- Default branch: `master`
- **Feature work currently branches off, and PRs target, `feature/nuxt-4-migration` — not `master`.** That branch is the integration target until the migration lands; opening a PR against `master` would drag the migration diff in with it. Revert to `master` once it is merged.
- Commit style: lowercase imperative with optional scope (`feat(search): add pagination`)
- No pre-commit hooks

## Things to Avoid

- **Do not use the Options API or Class Components** — `<script setup>` is the standard
- **Do not add Vuex** — the project uses Pinia
- **Do not add another test framework** — Vitest (via `@nuxt/test-utils`) is the standard; add specs to `test/unit`, `test/nuxt` or `test/e2e`. In particular don't add `@playwright/test`: the browser suite runs Playwright *through* Vitest
- **Do not inline API URLs in components** — add or reuse a wrapper in `utils/api.ts`
- **Do not hardcode user-facing strings** — use `languageStore.t(key)` + `config/uiStrings.ts`
- **Do not rename the persisted store fields or the `'app'` persist key** (see State Management)
- **Do not downgrade to Vue 2 / Vuetify 2** — this is a Vue 3 / Vuetify 4 project
- **Do not add SSR** — the app is intentionally client-side only (`ssr: false`)
- **Do not add comments** to self-explanatory code
