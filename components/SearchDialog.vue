<template>
  <v-dialog
    v-model="dialog"
    max-width="1100px"
    transition="dialog-bottom-transition"
    :fullscreen="smAndDown"
    scrollable
  >
    <v-card>
      <v-toolbar color="primary" class="flex-grow-0">
        <v-text-field
          v-model="query"
          prepend-inner-icon="mdi-magnify"
          :placeholder="placeholder"
          hide-details
          single-line
          variant="outlined"
          density="compact"
          clearable
          autofocus
          class="mr-3"
          style="color: white"
        />
        <template #append>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <v-card-text :class="[xs ? 'px-0' : 'px-3', 'py-3']">
        <v-container>
          <!-- Result info + sort -->
          <v-row v-if="response">
            <v-col sm="6" lg="8" cols="12">
              <span>{{ searchMessage }}</span>
              <div
                v-if="response.messages[1]"
                v-html="response.messages[1].message"
                class="mt-1"
              />
            </v-col>
            <v-col v-if="response.sorts.length" sm="6" lg="4" cols="12">
              <v-select
                v-model="sort"
                :items="sortItems"
                item-value="key"
                item-title="label"
                prepend-inner-icon="mdi-sort"
                label="Sort"
                variant="outlined"
                hide-details
                density="compact"
              />
            </v-col>
          </v-row>

          <!-- Skeleton while loading -->
          <v-row v-else>
            <v-col sm="6" lg="4" cols="12">
              <v-skeleton-loader type="text" :loading="isLoading" />
            </v-col>
          </v-row>

          <!-- Results grid -->
          <v-row v-if="response">
            <v-col
              v-for="result in response.results"
              :key="result.lank"
              sm="6"
              lg="4"
              cols="12"
            >
              <v-card rounded class="result-card" @click="onClickResult(result)">
                <v-img :src="result.image.url" :aspect-ratio="2 / 1" cover>
                  <div class="image-overlay d-flex align-end">
                    <v-card-title class="text-white" style="word-break: normal; user-select: none;">
                      {{ result.title }}
                    </v-card-title>
                  </div>
                </v-img>
              </v-card>
            </v-col>
          </v-row>

          <!-- Skeleton grid while loading -->
          <v-row v-else>
            <v-col v-for="i in columnCount" :key="i" sm="6" lg="4" cols="12">
              <v-skeleton-loader type="image" max-height="189" :loading="isLoading" />
            </v-col>
          </v-row>

          <!-- Pagination -->
          <v-row v-if="totalPages > 1" justify="center" class="mt-2">
            <v-pagination v-model="currentPage" :length="totalPages" rounded />
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { FetchError } from 'ofetch';
import { useDisplay } from 'vuetify';
import type { SearchResponse, SearchResult, Video } from '~/types';

const store = useAppStore();
const { xs, smAndDown, name: breakpointName } = useDisplay();

const jwt = ref('');
const sort = ref('rel');
const sortKeys = ['rel', 'newest', 'oldest'];
const isLoading = ref(false);
const searchQuery = ref('');
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const response = ref<SearchResponse | null>(null);
const offset = ref(0);
const limit = 12;

const dialog = computed({
  get: () => store.searchDialog,
  set: (v) => store.setSearchDialog(v),
});

// Debounced query setter
const query = computed({
  get: () => searchQuery.value,
  set: (value: string) => {
    if (debounceTimer.value) clearTimeout(debounceTimer.value);
    debounceTimer.value = setTimeout(() => {
      offset.value = 0;
      searchQuery.value = value;
    }, 400);
  },
});

const placeholder = computed(() => {
  switch (store.siteLanguage) {
    case 'nl':
      return 'Zoek of plak jw.org link...';
    default:
      return 'Search or paste jw.org link...';
  }
});

const searchMessage = computed(
  () => response.value?.pagination?.label ?? response.value?.messages[0]?.message ?? '',
);

const sortItems = computed(() =>
  sortKeys.map((key) => ({
    key,
    label: response.value?.sorts.find((s) => s.link.includes(key))?.label ?? key,
  })),
);

const columnCount = computed(() => {
  switch (breakpointName.value) {
    case 'xl':
    case 'lg':
      return 3;
    case 'md':
    case 'sm':
      return 2;
    default:
      return 1;
  }
});

const totalPages = computed(() =>
  Math.ceil((response.value?.insight.total.value ?? 0) / limit),
);

const currentPage = computed({
  get: () => Math.floor(offset.value / limit) + 1,
  set: (page: number) => {
    offset.value = (page - 1) * limit;
    fetchResponse(searchQuery.value);
  },
});

async function fetchToken() {
  jwt.value = await $fetch<string>(store.tokenUrl, { responseType: 'text' });
}

async function fetchVideo(langCode: string | undefined, lank: string | undefined) {
  if (!langCode || !lank) return;
  const { media } = await $fetch<{ media: Video[] }>(
    `${store.mediatorUrl}/media-items/${langCode}/${lank}?clientType=www`,
  );
  const [video] = media;
  store.setSelectedVideo(video!);
  store.setVideoDialog(true);
}

async function fetchResponse(query: string) {
  isLoading.value = true;
  const url = `${store.searchUrl}/${store.getSiteLanguage!.code}/videos?sort=${sort.value}&offset=${offset.value}&limit=${limit}&q=${encodeURIComponent(query)}`;
  try {
    const data = await $fetch<SearchResponse>(url, {
      headers: { Authorization: `Bearer ${jwt.value}` },
    });
    // Filter out category results — only show individual videos
    data.results = data.results.filter((r) => r.subtype !== 'videoCategory');
    response.value = data;
  } catch (err) {
    if (err instanceof FetchError && err.response?.status === 401) {
      await fetchToken();
      await fetchResponse(query); // retry once after token refresh
    }
  } finally {
    isLoading.value = false;
  }
}

function onClickResult(result: SearchResult) {
  fetchVideo(store.getSiteLanguage!.code, result.lank);
}

watch(searchQuery, async (value) => {
  if (!value) {
    response.value = null;
    return;
  }

  // jw.org finder link
  const finderRegex = /jw\.org\/finder\?.+&.+/;
  const wtLocaleRegex = /wtlocale=(?<code>[A-Za-z]+)/;
  const localeRegex = /locale=(?<locale>[A-Za-z_]+)/;
  const lankRegex = /lank=(?<lank>[\w-]+)/;
  const mediaItemsRegex =
    /jw\.org\/[\w-]+\/.+#(?<locale>[\w-]+)\/mediaitems\/(?<category>[\w-]+)\/(?<lank>[\w-]+)/;

  if (finderRegex.test(value)) {
    const lang =
      wtLocaleRegex.exec(value)?.groups?.code ??
      store.findLanguageByLocale(localeRegex.exec(value)?.groups?.locale)?.code;
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
  if (searchQuery.value) fetchResponse(searchQuery.value);
});

watch(
  () => store.getSiteLanguage,
  () => {
    searchQuery.value = '';
    response.value = null;
  },
);

onMounted(fetchToken);
</script>

<style scoped>
.result-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.result-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
}
.image-overlay {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.55));
  height: 100%;
}
</style>
