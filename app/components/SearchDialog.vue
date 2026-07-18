<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="smAndDown"
    max-width="1100px"
    scrollable
    transition="dialog-bottom-transition"
  >
    <v-card>
      <v-toolbar class="flex-grow-0" color="primary">
        <v-text-field
          v-model="query"
          autofocus
          class="search-input ml-4 mr-3"
          clearable
          density="compact"
          hide-details
          :placeholder="placeholder"
          prepend-inner-icon="mdi-magnify"
          single-line
          variant="outlined"
        />

        <template #append>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <v-card-text :class="[xs ? 'px-0' : 'px-3', 'py-3']">
        <v-container class="search-container d-flex flex-column pa-3" fluid>
          <!-- Search error -->
          <v-row v-if="hasError" class="flex-grow-0">
            <v-col cols="12">
              <v-alert type="error" variant="tonal">
                {{ errorMessage }}
              </v-alert>
            </v-col>
          </v-row>

          <!-- Result info + sort -->
          <v-row v-else-if="response" class="flex-grow-0">
            <v-col cols="12" lg="8" sm="6">
              <span>{{ searchMessage }}</span>

              <div
                v-if="response.messages[1]"
                class="mt-1"
                v-html="response.messages[1].message"
              />
            </v-col>

            <v-col v-if="response.sorts.length > 0" cols="12" lg="4" sm="6">
              <v-select
                v-model="sort"
                density="compact"
                hide-details
                item-title="label"
                item-value="key"
                :items="sortItems"
                prepend-icon="mdi-sort"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <!-- Skeleton while loading -->
          <v-row v-else>
            <v-col cols="12" lg="4" sm="6">
              <v-skeleton-loader boilerplate :loading="isLoading" type="text" />
            </v-col>
          </v-row>

          <!-- Results grid -->
          <v-row v-if="response && !hasError" class="flex-grow-0">
            <v-col
              v-for="result in response.results"
              :key="result.lank"
              cols="12"
              lg="4"
              sm="6"
            >
              <VideoCard
                :src="result.image.url"
                :title="result.title"
                @click="onClickResult(result)"
              />
            </v-col>

            <!-- No results -->
            <v-col v-if="response.results.length === 0" cols="12">
              <span>{{ noResultsMessage }}</span>
            </v-col>
          </v-row>

          <!-- Skeleton grid while loading -->
          <v-row v-else-if="!hasError" class="flex-grow-0">
            <v-col
              v-for="i in columnCount"
              :key="i"
              cols="12"
              lg="4"
              sm="6"
            >
              <v-skeleton-loader boilerplate class="skeleton-card" :loading="isLoading" type="image" />
            </v-col>
          </v-row>

          <!-- Pagination -->
          <v-row v-if="totalPages > 1 && !hasError" class="mt-auto pt-6 pb-2 flex-grow-0" justify="center">
            <v-pagination v-model="currentPage" :length="totalPages" rounded />
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { SearchResponse, SearchResult, Video } from '~/types';
import { FetchError } from 'ofetch';
import { useDisplay } from 'vuetify';

const store = useAppStore();
const { xs, smAndDown, name: breakpointName } = useDisplay();

const LIMIT = 12;
const DEBOUNCE_MS = 400;

const jwt = ref('');
const sort = ref('rel');
const sortKeys = ['rel', 'newest', 'oldest'];
const isLoading = ref(false);
const hasError = ref(false);
const searchQuery = ref('');
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const response = ref<SearchResponse | null>(null);
const offset = ref(0);

const dialog = computed({
  get: () => store.searchDialog,
  set: v => store.setSearchDialog(v),
});

// Debounced query setter
const query = computed({
  get: () => searchQuery.value,
  set: (value: string) => {
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value);
    }
    debounceTimer.value = setTimeout(() => {
      offset.value = 0;
      searchQuery.value = value;
    }, DEBOUNCE_MS);
  },
});

const placeholder = computed(() => {
  switch (store.siteLanguage) {
    case 'nl': {
      return 'Zoek of plak jw.org link...';
    }
    default: {
      return 'Search or paste jw.org link...';
    }
  }
});

const errorMessage = computed(() => {
  switch (store.siteLanguage) {
    case 'nl': {
      return 'Zoeken is mislukt. Probeer het later opnieuw.';
    }
    default: {
      return 'Search failed. Please try again later.';
    }
  }
});

const noResultsMessage = computed(() => {
  switch (store.siteLanguage) {
    case 'nl': {
      return 'Geen video’s gevonden.';
    }
    default: {
      return 'No videos found.';
    }
  }
});

const searchMessage = computed(
  () => response.value?.pagination?.label ?? response.value?.messages[0]?.message ?? '',
);

const sortItems = computed(() =>
  sortKeys.map(key => ({
    key,
    label: response.value?.sorts.find(s => s.link.includes(key))?.label ?? key,
  })),
);

const columnCount = computed(() => {
  switch (breakpointName.value) {
    case 'xl':
    case 'lg': {
      return 3;
    }
    case 'md':
    case 'sm': {
      return 2;
    }
    default: {
      return 1;
    }
  }
});

const totalPages = computed(() =>
  Math.ceil((response.value?.insight.total.value ?? 0) / LIMIT),
);

const currentPage = computed({
  get: () => Math.floor(offset.value / LIMIT) + 1,
  set: (page: number) => {
    offset.value = (page - 1) * LIMIT;
    fetchResponse(searchQuery.value);
  },
});

async function fetchToken() {
  jwt.value = await $fetch<string>(store.tokenUrl, { responseType: 'text' });
}

async function fetchVideo(langCode: string | undefined, lank: string | undefined) {
  if (!langCode || !lank) {
    return;
  }
  const { media } = await $fetch<{ media: Video[] }>(
    `${store.mediatorUrl}/media-items/${langCode}/${lank}?clientType=www`,
  );
  const [video] = media;
  store.setSelectedVideo(video!);
  store.setVideoDialog(true);
}

async function fetchResponse(query: string, retried = false) {
  isLoading.value = true;
  hasError.value = false;
  const url = `${store.searchUrl}/${store.getSiteLanguage!.code}/videos?sort=${sort.value}&offset=${offset.value}&limit=${LIMIT}&q=${encodeURIComponent(query)}`;
  try {
    const data = await $fetch<SearchResponse>(url, {
      headers: { Authorization: `Bearer ${jwt.value}` },
    });
    // Filter out category results — only show individual videos
    data.results = data.results.filter(r => r.subtype !== 'videoCategory');
    response.value = data;
  }
  catch (error) {
    if (!retried && error instanceof FetchError && error.response?.status === 401) {
      try {
        await fetchToken();
        await fetchResponse(query, true);
      }
      catch {
        hasError.value = true;
      }
    }
    else {
      hasError.value = true;
    }
  }
  finally {
    isLoading.value = false;
  }
}

function onClickResult(result: SearchResult) {
  fetchVideo(store.getSiteLanguage!.code, result.lank);
}

watch(searchQuery, async value => {
  if (!value) {
    response.value = null;
    hasError.value = false;
    return;
  }

  // jw.org finder link
  const finderRegex = /jw\.org\/finder\?.+&.+/;
  const wtLocaleRegex = /wtlocale=(?<code>[A-Za-z]+)/;
  const localeRegex = /locale=(?<locale>[A-Za-z_]+)/;
  const lankRegex = /lank=(?<lank>[\w-]+)/;
  const mediaItemsRegex
    = /jw\.org\/[\w-]+\/.+#(?<locale>[\w-]+)\/mediaitems\/(?<category>[\w-]+)\/(?<lank>[\w-]+)/;

  if (finderRegex.test(value)) {
    const lang
      = wtLocaleRegex.exec(value)?.groups?.code
        ?? store.findLanguageByLocale(localeRegex.exec(value)?.groups?.locale)?.code;
    const lank = lankRegex.exec(value)?.groups?.lank;
    await fetchVideo(lang, lank);
    searchQuery.value = '';
    return;
  }

  if (mediaItemsRegex.test(value)) {
    const match = mediaItemsRegex.exec(value);
    const lang = store.findLanguageByLocale(match?.groups?.locale)?.code;
    const lank = match?.groups?.lank;
    await fetchVideo(lang, lank);
    searchQuery.value = '';
    return;
  }

  fetchResponse(value);
});

watch(sort, () => {
  offset.value = 0;
  if (searchQuery.value) {
    fetchResponse(searchQuery.value);
  }
});

watch(
  () => store.getSiteLanguage,
  () => {
    searchQuery.value = '';
    response.value = null;
    hasError.value = false;
  },
);

onMounted(fetchToken);
</script>

<style scoped>
.search-input {
  color: white;
}
.search-container {
  min-height: 100%;
}
.skeleton-card {
  aspect-ratio: 2 / 1;
}
.skeleton-card :deep(.v-skeleton-loader__image) {
  height: 100%;
}
</style>
