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
          class="search-input ml-4 mr-1"
          clearable
          density="compact"
          hide-details
          :placeholder="languageStore.t('searchPlaceholder')"
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

      <v-card-text :class="[xs ? 'px-0' : 'px-3', smAndDown ? 'pt-3 pb-0' : 'py-3']">
        <v-container
          class="search-container d-flex flex-column pa-3"
          :class="{ 'pb-0': smAndDown }"
          fluid
        >
          <!-- Search error -->
          <v-row v-if="hasError" class="flex-grow-0">
            <v-col cols="12">
              <v-alert type="error" variant="tonal">
                {{ languageStore.t('searchFailed') }}
              </v-alert>
            </v-col>
          </v-row>

          <!-- Result info + sort -->
          <v-row v-else-if="response" class="flex-grow-0">
            <v-col cols="12" lg="8" sm="6">
              <span class="text-title-small">{{ searchMessage }}</span>

              <div
                v-if="response.messages[1]"
                class="mt-1 text-title-small search-message"
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
                :list-props="{ density: 'compact' }"
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

            <v-col
              v-for="i in placeholderCount"
              :key="`placeholder-${i}`"
              aria-hidden="true"
              cols="12"
              lg="4"
              sm="6"
            >
              <div class="card-placeholder" />
            </v-col>
          </v-row>

          <!-- Skeleton grid while loading -->
          <v-row v-else-if="!hasError" class="flex-grow-0">
            <v-col
              v-for="i in skeletonCount"
              :key="i"
              cols="12"
              lg="4"
              sm="6"
            >
              <v-skeleton-loader boilerplate class="skeleton-card" :loading="isLoading" type="image" />
            </v-col>
          </v-row>

          <!-- Pagination -->
          <v-row
            v-if="totalPages > 1 && !hasError"
            class="mt-auto pt-6 pb-2 flex-grow-0"
            :class="{ 'pagination-sticky': smAndDown }"
            justify="center"
          >
            <v-pagination
              v-model="currentPage"
              density="comfortable"
              :length="totalPages"
              :total-visible="xs ? 4 : 7"
            />
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { SearchResponse, SearchResult } from '~/types/search';
import { FetchError } from 'ofetch';
import { useDisplay } from 'vuetify';

const languageStore = useLanguageStore();
const uiStore = useUiStore();
const { xs, smAndDown, name: breakpointName } = useDisplay();

const LIMIT = 9;
const DEBOUNCE_MS = 400;

const jwt = ref('');
const sort = ref('rel');
const sortKeys = ['rel', 'newest', 'oldest'];
const isLoading = ref(false);
const hasError = ref(false);
const searchQuery = ref('');
const response = ref<SearchResponse | null>(null);
const offset = ref(0);

const dialog = computed({
  get: () => uiStore.searchDialog,
  set: v => uiStore.setSearchDialog(v),
});

// Debounced query setter
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const query = computed({
  get: () => searchQuery.value,
  set: (value: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      offset.value = 0;
      searchQuery.value = value;
    }, DEBOUNCE_MS);
  },
});

const searchMessage = computed(
  () => response.value?.pagination?.label ?? response.value?.messages[0]?.message ?? '',
);

const sortItems = computed(() =>
  sortKeys.map(key => ({
    key,
    label: response.value?.sorts.find(s => sortKeyOf(s.link) === key)?.label ?? key,
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

const skeletonCount = computed(() => (smAndDown.value ? columnCount.value : LIMIT));

const placeholderCount = computed(() => {
  if (smAndDown.value || totalPages.value <= 1) {
    return 0;
  }
  return Math.max(0, LIMIT - (response.value?.results.length ?? 0));
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

async function loadToken() {
  jwt.value = await fetchToken();
}

async function fetchVideo(langCode: string | undefined, lank: string | undefined) {
  if (!langCode || !lank) {
    hasError.value = true;
    return;
  }
  try {
    const video = await fetchMediaItem(langCode, lank);
    if (!video) {
      hasError.value = true;
      return;
    }
    uiStore.openVideo(video);
  }
  catch {
    hasError.value = true;
  }
}

// Guards against a slow earlier response overwriting a newer one
// (page/sort changes bypass the debounce and can race)
let requestId = 0;

async function fetchResponse(query: string, retried = false) {
  const id = retried ? requestId : ++requestId;
  isLoading.value = true;
  hasError.value = false;
  try {
    const data = await fetchSearch(
      languageStore.siteLanguageInfo.code,
      query,
      { sort: sort.value, offset: offset.value, limit: LIMIT },
      jwt.value,
    );
    if (id !== requestId) {
      return;
    }
    // Filter out category results — only show individual videos
    data.results = data.results.filter(r => r.subtype !== 'videoCategory');
    response.value = data;
  }
  catch (error) {
    if (id !== requestId) {
      return;
    }
    if (!retried && error instanceof FetchError && error.response?.status === 401) {
      try {
        await loadToken();
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
    if (id === requestId) {
      isLoading.value = false;
    }
  }
}

function onClickResult(result: SearchResult) {
  fetchVideo(languageStore.siteLanguageInfo.code, result.lank);
}

watch(searchQuery, async value => {
  if (!value) {
    response.value = null;
    hasError.value = false;
    return;
  }

  // Pasted jw.org finder / media-items link → open that video directly
  const parsed = parseVideoLink(value);
  if (parsed.kind === 'finder' || parsed.kind === 'mediaitems') {
    const lang = 'wtlocale' in parsed && parsed.wtlocale
      ? parsed.wtlocale
      : languageStore.findLanguageByLocale(parsed.locale)?.code;
    await fetchVideo(lang, parsed.lank);
    // Keep the query (and the error alert) when the link failed to resolve
    if (!hasError.value) {
      searchQuery.value = '';
    }
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
  () => languageStore.siteLanguageInfo,
  () => {
    searchQuery.value = '';
    response.value = null;
    hasError.value = false;
  },
);

// Fetch the JWT lazily on first open instead of on app start; the 401
// retry in fetchResponse covers expiry
watch(
  () => uiStore.searchDialog,
  open => {
    if (open && !jwt.value) {
      loadToken().catch(() => {});
    }
  },
);
</script>

<style scoped>
.search-container {
  min-height: 100%;
}
.search-message :deep(ul) {
  margin-block: 8px;
  padding-inline-start: 24px;
  list-style: disc;
}
.pagination-sticky {
  position: sticky;
  bottom: 0;
  z-index: 1;
  background: rgb(var(--v-theme-surface));
}
.skeleton-card {
  aspect-ratio: 2 / 1;
}
.card-placeholder {
  aspect-ratio: 2 / 1;
  visibility: hidden;
}
.skeleton-card :deep(.v-skeleton-loader__image) {
  height: 100%;
}
</style>
