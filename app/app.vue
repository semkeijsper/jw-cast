<template>
  <v-app>
    <v-app-bar color="primary" elevation="2" :height="xs ? 56 : 64">
      <v-app-bar-title>JW Cast</v-app-bar-title>

      <template #append>
        <template v-if="languageStore.translations.lnkSearch">
          <v-btn
            v-if="!xs"
            prepend-icon="mdi-magnify"
            variant="text"
            @click="uiStore.setSearchDialog(true)"
          >
            {{ languageStore.t('lnkSearch') }}
          </v-btn>

          <v-btn v-else icon @click="uiStore.setSearchDialog(true)">
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

    <CastBar />
    <CastErrorSnackbar />

    <SearchDialog />
    <VideoDialog />
    <GetNotifiedDialog />
  </v-app>
</template>

<script setup lang="ts">
import { useDisplay, useTheme } from 'vuetify';
import { uiStrings } from '~/config/uiStrings';

const languageStore = useLanguageStore();
const uiStore = useUiStore();
const { xs } = useDisplay();
const theme = useTheme();
const { initCast } = useCast();

onMounted(() => {
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  theme.change(darkQuery.matches ? 'dark' : 'light');
  // Follow OS theme changes mid-session (app root never unmounts — no cleanup)
  darkQuery.addEventListener('change', event => {
    theme.change(event.matches ? 'dark' : 'light');
  });
  initCast();
});

// Local dict first for nl/en (jw.org's lnkHelpView is a different phrase),
// API translation for other locales, English as the last resort
const guideButtonText = computed(
  () => uiStrings[languageStore.siteLanguage]?.guide ?? languageStore.translations.lnkHelpView ?? uiStrings.en!.guide!,
);
</script>
