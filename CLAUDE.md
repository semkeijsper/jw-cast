# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

JW Cast is a Vue 2 SPA that re-presents the public jw.org video catalog with a key feature the official site lacks: pairing one language for video/audio with a different language for subtitles. All data (catalog, images, mp4/vtt URLs) is fetched live from the jw.org mediator API — the app stores nothing of its own and has no backend.

The user-facing language is Dutch by default. The README and in-app guide button text are written in Dutch.

## Commands

Package manager is **Yarn 3 (Berry)** pinned via `.yarnrc.yml` to `.yarn/releases/yarn-3.4.1.cjs`. Use `yarn`, not `npm`.

- `yarn install` — install dependencies
- `yarn serve` — run the dev server (Vue CLI / webpack)
- `yarn build` — production build into `dist/`
- `yarn lint` — ESLint (airbnb + TypeScript + Vue + prettier)

There is no test suite configured.

## Deployment

Hosted on GitHub Pages from the `gh-pages` branch. Deploy is a manual subtree push of the build output:

```
git subtree push --prefix dist origin gh-pages
```

The custom domain (`public/CNAME`) is `jwcast.semdev.nl`. The build commits `dist/` into the repo — be aware that `yarn build` will produce diff noise there.

## Architecture

### Data flow

All remote URLs are stored in the Vuex `state` (`src/store/index.ts`):

- `mediatorUrl` → `https://b.jw-cdn.org/apis/mediator/v1` — categories, languages, translations, media items
- `searchUrl` → `https://b.jw-cdn.org/apis/search/results` — search
- `tokenUrl` → JWT for authenticated jw.org calls

Components build URLs from these bases plus the relevant `Language.code` (the jw.org "Watchtower" code such as `O` for Dutch, `E` for English — distinct from the ISO `locale`). The `Language` interface in `src/types/index.ts` documents this distinction; getters like `findLanguageByCode` / `findLanguageByLocale` translate between the two.

There are no Vuex actions — components call `axios.get` directly and write results back via mutations. Anything that needs to be cross-component (selected video, dialog visibility, current site/video/subtitle language) lives in the store; anything local (loaded category, fetched media item) is component-local state.

### Three-language model

The store tracks **three independent languages** that the rest of the app reacts to:

- `siteLanguage` — UI translations and which catalog to fetch
- `videoLanguage` — audio/video track
- `subtitleLanguage` — subtitle track

`VideoDialog.vue` is the place where they diverge: it fetches the same `languageAgnosticNaturalKey` from the mediator twice (once per language) to obtain a video file in one language and a subtitle `.vtt` from another. Watchers re-fetch when any of the three change.

### Routing

`src/router/index.ts` defines a single dynamic route `/:language`. The root path redirects to the browser's locale (`navigator.language.split('-')[0]`), defaulting to `nl`. `vuex-router-sync` mirrors route state into Vuex so components can read `state.route.params.language`. There is effectively one page; everything else is dialogs (`SearchDialog`, `VideoDialog`, `TranscriptDialog`) toggled by store flags.

### Component structure

- `App.vue` — top-level shell: app bar, language picker, four `VideoCategory` rows, all dialogs
- `VideoCategory.vue` — fetches one category by name, renders either `VideoGrid` or `VideoSwiper`
- `VideoDialog.vue` — the core feature: video player (Plyr), language pickers, action buttons. Manages a Plyr instance manually (`loadPlayer` / `destroy`)
- `components/button/{Cast,Video,Subtitle}Button.vue` — the three playback paths: Chromecast via smplayer.info, direct mp4 download, .vtt download
- `SearchDialog.vue`, `TranscriptDialog.vue` — modal overlays driven by `searchDialog` / `transcriptDialog` store flags

The Chromecast button hands off to `https://chromecast.smplayer.info` by base64-encoding the mp4 URL into a query parameter — the app itself does not implement Cast.

## Conventions

- **TypeScript + class components.** Every `.vue` file uses `<script lang="ts">` with `vue-property-decorator` (`@Component`, `@Prop`, `@Watch`) and `vuex-class` (`@State`, `@Getter`, `@Mutation`). Match this style; don't introduce the Composition API or `defineComponent`.
- **Path alias `@/`** maps to `src/` (see `tsconfig.json`). Use it for cross-directory imports.
- **Strict TS** is on. Use the `!` non-null assertion on injected store members as existing components do (e.g. `@State mediatorUrl!: string`).
- **Formatting**: Prettier (`singleQuote`, `trailingComma: all`, `printWidth: 100`, `semi`). ESLint extends `@vue/airbnb` + `@vue/typescript` + `prettier`. Run `yarn lint` before committing.
- **Vuetify 2** for all UI; **Material Design Icons** (`mdi-*`) for icons. The single theme color is `primary: #4a6da7` (`src/plugins/vuetify.ts`); dark mode follows `prefers-color-scheme`.
- **i18n strings** come from the jw.org translations endpoint and are read off `state.translations` (e.g. `translations.lnkSearch`). Don't hardcode user-facing strings — fall back to a hardcoded Dutch/English pair only where the translation key isn't yet loaded (see `guideButtonText` in `App.vue`).
- **No state mutations outside mutations.** Components call mutations like `setSelectedVideo`, never assign to `state` directly.

## Vue 2 / library constraints

This project is on **Vue 2.6 + Vuetify 2 + Vue CLI 4** and is not being upgraded. Don't pull in Vue 3-only patterns or libraries. Plyr is wrapped manually rather than via a Vue plugin; Swiper is the v5 line via `vue-awesome-swiper` (not Swiper 6+).
