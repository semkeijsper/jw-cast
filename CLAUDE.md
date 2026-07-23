# CLAUDE.md

This file provides guidance for AI assistants working in this repository.

## Project Overview

**jw-cast** is a Nuxt 4 + Vue 3 + TypeScript single-page application that provides a frontend interface for browsing and playing Jehovah's Witnesses media from jw.org. Users can independently select the audio language and subtitle language for videos, and watch via the embedded Plyr player, native Chromecast (Google Cast SDK), or download via VLC.

- **Live site:** https://jwcast.semdev.nl
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
pnpm build            # Static SPA build into .output/public/
pnpm lint             # Run ESLint (lint:fix to autofix)
pnpm preview          # Preview the built output
pnpm test             # Run the Vitest suite once (test:watch for watch mode)
```

Automated tests run under **Vitest** (see the Testing section). Ad-hoc browser verification against the dev server can still be done with one-off Playwright scripts.

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
└── nuxt/                            # Store + component specs (Nuxt env, mountSuspended)
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
| `setCastConnecting` / `setCastActive` / `castIdle` | Cast-slice mutations (connecting seeds `lastCastPosition` for the cancel/fallback case) |
| `setLocalLoading` / `setLocalReady` / `updateLocal` / `localIdle` | Local-slice mutations |
| `isCastTarget(v)` / `isCastingVideo(v)` / `localPositionOf(v)` / `positionFor(v)` | Identity-aware reads for a dialog's `selectedVideo` (`positionFor` is the transcript clock: cast position when casting, else local) |

Mutations are `set*` functions. Async work stays in components/composables, calling `utils/api.ts` helpers.

## UI Strings

`config/uiStrings.ts` holds all locally-owned shell strings, keyed by locale with an `en` block as the final fallback. `languageStore.t(key)` resolves: jw.org API translation → `uiStrings[locale]` → `uiStrings.en` → the key itself. Never hardcode user-facing strings in components — add a key to the dictionary. Translating the shell into a new language = adding one locale block.

## Routing

- `pages/index.vue` — redirects to `/:browserLanguage` or `/nl`
- `pages/[language]/[[videoId]].vue` — main page; `videoId` is optional

When a video is opened (by clicking a card or from URL), the route becomes `/:language/:languageAgnosticNaturalKey`; closing the dialog pops back to `/:language`. This URL sync has a **single owner**: `composables/useVideoRoute.ts`, called from the page. Do not push/pop video routes anywhere else.

The page validates unknown locales after fetching the full language list (redirect to `/en`) and shows a retry alert if the initial language/translation fetches fail.

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

`cast/CastButton.vue` is disabled when the Cast SDK is unavailable (e.g. non-Chromium browsers). Exclusive-cast and handoff behavior needs manual verification with real Chromecast hardware — it can't be exercised headless.

## Search

`search/SearchDialog.vue`:

- Page size: 9 results (`LIMIT` constant); `v-pagination` drives page changes
- Sort (relevance / newest / oldest) and new queries reset to page 1 (debounced 400ms)
- Stale responses are discarded via a latest-wins request id
- JWT is fetched lazily on first dialog open and refreshed on 401 with a single bounded retry
- Pasted jw.org finder / media-items links open the video directly; failures surface the error alert
- Failed searches show a `v-alert`; zero filtered results show a "no videos found" message

## Testing

Vitest, wired through `@nuxt/test-utils`. `vitest.config.ts` defines two projects so the fast pure-function specs don't pay the Nuxt-runtime cost:

- **`unit`** (`test/unit/`) — plain Node environment, `~`/`@` aliased to `app/`. Pure functions only: `parseVtt`, `formatTime`, `downloadableFiles`, `languageLabel`, `parseVideoLink`/`sortKeyOf`, `activeCueIndex`/`highlightSegments`.
- **`nuxt`** (`test/nuxt/`) — happy-dom-backed Nuxt environment so source auto-imports and the `~` alias resolve. Pinia store specs (`playback`, `ui`, `language`) and component specs via `mountSuspended` (`VideoCard`, `TranscriptPanel`, `SearchDialog`). `test/setup.ts` stubs the browser APIs Vuetify touches on mount (`ResizeObserver`/`IntersectionObserver`/`matchMedia`/`scrollTo`/`scrollIntoView`).

No network, no external SDKs, no real Chromecast. Run with `pnpm test` (`test:watch` for watch mode). Pull embedded pure logic out into `utils/` so it can be unit-tested cheaply rather than mounting components to reach it (that's why `searchLink.ts` and `transcript.ts` exist). Vuetify text inputs don't drive their `v-model` under happy-dom, so filter/search interactions are covered by unit tests, not by mounting.

There is no E2E suite in-repo — an earlier Playwright harness was removed. Manual browser checks are done with one-off Playwright scripts against the dev server.

## Patches

`patches/plyr.patch` (pnpm `patchedDependencies`) removes `"type": "module"` from Plyr 3.8.4's `package.json` so its CommonJS build resolves correctly under Nuxt/Vite. Keep the single-`vue` invariant when touching deps: `@nuxt/test-utils` can pull a second `vue` copy alongside the app's, which splits Vuetify onto a different Vue runtime and breaks its directives (`v-intersect` → blank `v-img`s, dead swiper); run `pnpm dedupe` if that recurs.

## Deployment

```bash
pnpm build
# Output is in .output/public/
git subtree push --prefix .output/public origin gh-pages
```

`public/404.html` handles GitHub Pages' lack of server-side routing by encoding the path into a query param, which an inline head script in `nuxt.config.ts` restores before the router boots.

## Git Workflow

- Default branch: `master`
- Feature work: descriptive branches off `master`
- Commit style: lowercase imperative with optional scope (`feat(search): add pagination`)
- No pre-commit hooks

## Things to Avoid

- **Do not use the Options API or Class Components** — `<script setup>` is the standard
- **Do not add Vuex** — the project uses Pinia
- **Do not add another test framework** — Vitest (via `@nuxt/test-utils`) is the standard; add specs to `test/unit` or `test/nuxt`
- **Do not inline API URLs in components** — add or reuse a wrapper in `utils/api.ts`
- **Do not hardcode user-facing strings** — use `languageStore.t(key)` + `config/uiStrings.ts`
- **Do not rename the persisted store fields or the `'app'` persist key** (see State Management)
- **Do not downgrade to Vue 2 / Vuetify 2** — this is a Vue 3 / Vuetify 4 project
- **Do not add SSR** — the app is intentionally client-side only (`ssr: false`)
- **Do not add comments** to self-explanatory code
