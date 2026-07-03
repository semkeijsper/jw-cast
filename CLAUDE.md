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
| State | Pinia (composition store, no modules) |
| Routing | Vue Router 4 via Nuxt pages/ |
| Video player | Plyr (dynamic import, client-only) |
| Chromecast | Google Cast Web Sender SDK (Default Media Receiver) |
| Carousel | Swiper 12 via `swiper/vue` |
| HTTP client | `$fetch` (Nuxt built-in, via ofetch) |
| Package manager | pnpm (node >= 22) |
| Linting | ESLint flat config: `eslint-config-vuetify` + `@nuxt/eslint` (stylistic rules, no Prettier) |

## Development Commands

```bash
pnpm install          # Install dependencies (also runs nuxt prepare)
pnpm dev              # Start dev server with hot reload
pnpm build            # Static SPA build into .output/public/
pnpm lint             # Run ESLint
pnpm preview          # Preview the built output
```

**There are no automated tests.**

## Repository Structure

```
app/
├── app.vue                      # Root: v-app shell, app bar, global dialogs
├── assets/styles/settings.scss  # Vuetify SASS variable overrides (styles.configFile)
├── pages/
│   ├── index.vue                # Redirect / → /:browser-language
│   └── [language]/
│       └── [[videoId]].vue      # Main page: language selector + 4 category rows
│                                # videoId is optional — opens that video on load
├── components/
│   ├── VideoCategory.vue        # Fetches one named category and renders it
│   ├── VideoDialog.vue          # Full-screen video player modal (Plyr + Cast)
│   ├── VideoSwiper.vue          # Horizontal Swiper carousel for a category
│   ├── VideoGrid.vue            # Responsive grid (used for LatestVideos)
│   ├── SearchDialog.vue         # Search UI with pagination
│   ├── TranscriptDialog.vue     # Renders VTT subtitle file as plain text
│   ├── GetNotifiedDialog.vue    # WhatsApp channel promo dialog
│   └── button/                  # Used as <ButtonCast> etc. (directory-prefixed)
│       ├── Cast.vue             # Chromecast (native Cast SDK, SMPlayer fallback)
│       ├── Subtitle.vue         # Download subtitle / open transcript
│       └── Video.vue            # Download video file
├── config/
│   └── whatsappChannels.ts      # Per-language WhatsApp channel links (not auto-imported)
├── stores/
│   └── app.ts                   # Single flat Pinia composition store
├── composables/
│   └── useCast.ts               # Google Cast SDK wrapper
└── types/
    └── index.ts                 # Domain interfaces: Language, Video, Category, etc.
public/
├── 404.html                     # GitHub Pages SPA redirect trick
├── sitemap.xml, robots.txt, CNAME
└── assets/                      # Favicons, PWA manifest
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
const store = useAppStore();

const label = computed(() => store.translations.btnPlay ?? 'Play');

function doSomething() { ... }
</script>
```

### Auto-imports

Nuxt auto-imports: Vue composables (`ref`, `computed`, `watch`, `onMounted`, etc.), Nuxt composables (`useRoute`, `useRouter`, `navigateTo`, `nextTick`), composables from `composables/`, stores from `stores/`, and all components from `components/`.

**Always** import types explicitly: `import type { Video } from '~/types'`.

Vuetify composables (`useDisplay`, `useTheme`) are **not** auto-imported — import them from `'vuetify'`.

### Naming Conventions

- **Components:** PascalCase filenames (`VideoDialog.vue`)
- **Event handlers:** camelCase prefixed with `on` (`onClickVideo`, `onSelectFile`)
- **Store actions:** `set` prefix (`setSiteLanguage`, `setVideoDialog`)
- **Dialog state:** `dialog` computed wrapping the store boolean (get/set pattern)
- **CSS classes:** kebab-case; Vuetify utilities (`d-flex`, `text-white`, etc.)

### Vuetify 3 API Notes

Key differences from Vuetify 2 used in this codebase:

| Vuetify 2 | Vuetify 3 |
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

- Scoped CSS (plain, not SCSS) inside `.vue` files
- Vuetify grid (`v-container`, `v-row`, `v-col`) for layout
- Responsive breakpoints via `useDisplay()` from `'vuetify'`
- Dark mode: detected once at startup in `app.vue` via `window.matchMedia`
- Image gradient overlay: `<div class="image-overlay">` inside `<v-img>` with `background: linear-gradient(...)`

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

- Strict mode via Nuxt's generated `tsconfig.json`
- All domain types in `types/index.ts`
- No implicit `any`; use `unknown` or proper types

## State Management (Pinia)

`stores/app.ts` is a single flat composition store:

| State field | Purpose |
|---|---|
| `mediatorUrl` | Base URL for jw.org media API |
| `searchUrl` | Base URL for jw.org search API |
| `tokenUrl` | URL for stream JWT tokens |
| `languages` | All available languages (seeded with Dutch + English) |
| `siteLanguage` | Selected UI/content language locale |
| `videoLanguage` | Selected audio language for video (persisted in `jw_videoLanguage` cookie) |
| `subtitleLanguage` | Selected subtitle language (persisted in `jw_subtitleLanguage` cookie) |
| `translations` | Fetched translation strings from jw.org API |
| `searchDialog` | Search dialog open state |
| `videoDialog` | Video player dialog open state |
| `transcriptDialog` | Transcript dialog open state |
| `getNotifiedDialog` | WhatsApp channel dialog open state |
| `selectedVideo` | Currently focused `Video` object |
| `subtitleMedia` | Subtitle `Video` object used by TranscriptDialog |

All mutations are `set*` functions. No Pinia actions for async — API calls are made directly in component `onMounted` hooks and `watch` callbacks.

## Routing

- `pages/index.vue` — redirects to `/:browserLanguage` or `/nl`
- `pages/[language]/[[videoId]].vue` — main page; `videoId` is optional

When a video is opened (by clicking a card or from URL), the route becomes `/:language/:languageAgnosticNaturalKey`. Closing the video dialog pops back to `/:language`. This makes individual videos shareable by URL.

The `VideoDialog` component manages the URL pushes in its `watch(() => store.videoDialog, ...)` handler.

## Chromecast

`composables/useCast.ts` wraps the Google Cast Web Sender SDK:

- Uses the **Default Media Receiver** (`CC1AD845`) — no app registration required
- Loaded via `<script>` in `nuxt.config.ts`; calls `window.__onGCastApiAvailable` when ready
- `isAvailable` is a shared `ref` across all component instances
- `castMedia(url, title, subtitleUrl?)` — casts MP4 with optional VTT subtitles
- `getSmPlayerUrl(...)` — builds an SMPlayer fallback URL for when Cast isn't available

`button/Cast.vue` tries native Cast first; if it fails or Cast is unavailable, opens SMPlayer in a new tab.

## Search Pagination

`SearchDialog.vue` implements full pagination using the jw.org search API's `offset` and `limit` params:

- Page size: 12 results
- `v-pagination` component drives page changes
- Sort (relevance / newest / oldest) resets to page 1
- New search query resets to page 1
- JWT token is fetched on mount and auto-refreshed on 401

## API Integration

All HTTP calls use `$fetch` (Nuxt's built-in fetch, auto-imported) directly inside components. No service layer abstraction. Calls follow `async/await`. Key endpoints (stored as constants in the Pinia store):

- `mediatorUrl` — `/categories/:code/:name`, `/media-items/:code/:lank`, `/languages/:code/all`, `/translations/:code`
- `searchUrl` — `/:code/videos?q=&sort=&offset=&limit=`
- `tokenUrl` — returns a JWT for search requests

## Deployment

```bash
pnpm build
# Output is in .output/public/
git subtree push --prefix .output/public origin gh-pages
```

`public/404.html` handles GitHub Pages' lack of server-side routing by encoding the path into a query param, which `app.vue` restores on mount.

## Git Workflow

- Default branch: `master`
- Feature work: descriptive branches off `master`
- Commit style: lowercase imperative with optional scope (`feat(search): add pagination`)
- No pre-commit hooks

## Things to Avoid

- **Do not use the Options API or Class Components** — `<script setup>` is the standard
- **Do not add Vuex** — the project uses Pinia
- **Do not add a test framework** unless explicitly requested
- **Do not abstract API calls** into a service layer — direct `$fetch` in components is the pattern
- **Do not downgrade to Vue 2 / Vuetify 2** — this is a Vue 3 / Vuetify 3 project
- **Do not add SSR** — the app is intentionally client-side only (`ssr: false`)
- **Do not add comments** to self-explanatory code
