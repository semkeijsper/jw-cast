<template>
  <v-container>
    <v-row justify="center">
      <v-col class="mt-3" cols="12">
        <!-- Page title — zero-width space keeps layout stable while loading -->
        <span class="text-display-medium font-weight-bold">
          {{ store.translations.hdgVideos || '\u200D' }}
        </span>

        <v-row>
          <v-col xs="12" sm="6" lg="4" cols="12">
            <v-autocomplete
              v-model="siteLanguage"
              :items="store.languages"
              class="mt-4"
              hide-details
              prepend-icon="mdi-translate"
              :item-title="languageLabel"
              item-value="locale"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <v-divider class="mt-8" />
      </v-col>
    </v-row>

    <template v-if="ready">
      <VideoCategory category-name="LatestVideos" grid divider />
      <VideoCategory category-name="StudioMonthlyPrograms" :limit="12" divider />
      <VideoCategory category-name="StudioTalks" :limit="9" divider />
      <VideoCategory category-name="StudioNewsReports" :limit="9" class="mb-3" />
    </template>
  </v-container>
</template>

<script setup lang="ts">
import type { Language, Translations, Video } from '~/types';

const store = useAppStore();
const route = useRoute();
const router = useRouter();

const ready = ref(false);

const language = computed(() => route.params.language as string);
const videoId = computed(() => route.params.videoId as string | undefined);

// Two-way binding for the language autocomplete
const siteLanguage = computed({
  get: () => store.getSiteLanguage?.locale ?? 'nl',
  set: (value: string) => {
    if (!value) return;
    store.setSiteLanguage(value);
    router.push(`/${value}`);
  },
});

function languageLabel(item: Language): string {
  return item.name === item.vernacular ? item.name : `${item.name} (${item.vernacular})`;
}

async function fetchLanguages() {
  const code = ready.value ? store.getSiteLanguage!.code : '-';
  const url = `${store.mediatorUrl}/languages/${code}/all?clientType=www`;
  const { languages } = await $fetch<{ languages: Language[] }>(url);

  // Pin Dutch and English at the top
  const nl = languages.find((l) => l.locale === 'nl');
  const en = languages.find((l) => l.locale === 'en');
  const rest = languages.filter((l) => l.locale !== 'nl' && l.locale !== 'en');
  if (nl) rest.unshift(nl);
  if (en) rest.splice(nl ? 1 : 0, 0, en);

  store.setLanguages(rest);
}

async function fetchTranslations() {
  const url = `${store.mediatorUrl}/translations/${store.getSiteLanguage!.code}`;
  const response = await $fetch<{ translations: { [key: string]: Translations } }>(url);
  const translations = response.translations[store.getSiteLanguage!.code];
  if (translations) store.setTranslations(translations);
}

async function openVideoFromUrl(lank: string) {
  try {
    const langCode = store.getSiteLanguage?.code ?? 'E';
    const { media } = await $fetch<{ media: Video[] }>(
      `${store.mediatorUrl}/media-items/${langCode}/${lank}?clientType=www`,
    );
    const [video] = media;
    if (video) {
      store.setSelectedVideo(video);
      store.setVideoDialog(true);
    }
  } catch {
    // Invalid lank — silently ignore, don't crash the page
  }
}

// When route language changes (navigating between language pages)
watch(
  language,
  async (newLang) => {
    if (!store.languages.some((l) => l.locale === newLang)) {
      router.replace('/en');
      return;
    }
    store.setSiteLanguage(newLang);
    await Promise.allSettled([fetchLanguages(), fetchTranslations()]);
  },
  { immediate: false },
);

// When videoId disappears from URL (e.g. browser back), close the dialog
watch(videoId, (id) => {
  if (!id && store.videoDialog) {
    store.setVideoDialog(false);
    store.setSelectedVideo(null);
  }
});

onMounted(async () => {
  store.setSiteLanguage(language.value);
  await Promise.allSettled([fetchLanguages(), fetchTranslations()]);

  if (videoId.value) {
    await openVideoFromUrl(videoId.value);
  }

  ready.value = true;
});
</script>
