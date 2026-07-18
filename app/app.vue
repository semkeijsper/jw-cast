<template>
  <v-app>
    <v-app-bar color="primary" elevation="2">
      <v-app-bar-title>JW Cast</v-app-bar-title>

      <template #append>
        <template v-if="store.translations.lnkSearch">
          <v-btn
            v-if="!xs"
            prepend-icon="mdi-magnify"
            variant="text"
            @click="store.setSearchDialog(true)"
          >
            {{ store.translations.lnkSearch }}
          </v-btn>

          <v-btn v-else icon @click="store.setSearchDialog(true)">
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
        </template>

        <v-btn
          href="https://github.com/semkeijsper/jw-cast#handleiding"
          prepend-icon="mdi-book-open-blank-variant"
          target="_blank"
          variant="text"
        >
          <span v-if="!xs">{{ guideButtonText }}</span>
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <NuxtPage />
    </v-main>

    <SearchDialog />
    <VideoDialog />
    <TranscriptDialog />
    <GetNotifiedDialog />
  </v-app>
</template>

<script setup lang="ts">
import { useDisplay, useTheme } from 'vuetify';

const store = useAppStore();
const { xs } = useDisplay();
const { global: theme } = useTheme();
const { initCast } = useCast();

onMounted(() => {
  theme.name.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  initCast();
});

const guideButtonText = computed(() => {
  switch (store.siteLanguage) {
    case 'nl': {
      return 'Handleiding';
    }
    case 'en': {
      return 'Guide';
    }
    default: {
      return store.translations.lnkHelpView ?? 'Guide';
    }
  }
});
</script>

<style>
@layer vuetify-core.reset {
  ul, ol, figure, details, summary {
    padding: 0;
    margin: 0;
  }

  h1, h2, h3, h4, h5, h6, p {
    margin: 0;
  }
}

@layer vuetify-core.reset {
  * {
    padding: 0;
    margin: 0;
  }
  a:active,
  a:hover {
    outline-width: 0;
  }
  code,
  kbd,
  pre,
  samp {
    font-family: monospace;
  }
  pre {
    font-size: 1em;
  }
  small {
    font-size: 80%;
  }
  sub,
  sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }
  sub {
    bottom: -0.25em;
  }
  sup {
    top: -0.5em;
  }
  textarea {
    resize: vertical;
  }
  button,
  input,
  select,
  textarea {
    background-color: transparent;
    border-style: none;
  }
  select {
    -moz-appearance: none;
    -webkit-appearance: none;
  }
  legend {
    display: table;
    max-width: 100%;
    white-space: normal;
  }
}

* {
  scrollbar-width: thin;
}

html {
  overflow-y: hidden;
  /* Plain font-family declaration so @nuxt/fonts detects and self-hosts Roboto;
     Vuetify only references it inside a var() fallback, which the scanner can't see. */
  font-family: 'Roboto', sans-serif;
}

.v-main {
  height: 100dvh;
  overflow-y: auto;
}
</style>
