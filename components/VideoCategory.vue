<template>
  <v-row v-if="category" justify="center">
    <v-col cols="12">
      <p v-if="!hideTitle" class="text-headline-large font-weight-medium mb-6">{{ category.name }}</p>
      <VideoGrid v-if="grid" :videos="media" />
      <VideoSwiper v-else :videos="media" />
      <v-divider v-if="divider" :class="grid ? 'mt-8' : 'mt-5'" />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { Category, Video } from '~/types';

const props = defineProps<{
  categoryName: string;
  grid?: boolean;
  hideTitle?: boolean;
  divider?: boolean;
  limit?: number;
  filter?: RegExp;
}>();

const store = useAppStore();
const category = ref<Category | null>(null);

const media = computed<Video[]>(() => {
  if (!category.value?.media) return [];
  if (!props.filter) return category.value.media;
  return category.value.media.filter((m) => props.filter!.test(m.languageAgnosticNaturalKey));
});

const categoryUrl = computed(() => {
  const base = `${store.mediatorUrl}/categories/${store.getSiteLanguage!.code}/${props.categoryName}?detailed=1&clientType=www`;
  return props.limit ? `${base}&limit=${props.limit}` : base;
});

async function loadCategory() {
  try {
    category.value = (await $fetch<{ category: Category }>(categoryUrl.value)).category;
  } catch {
    category.value = null;
  }
}

watch(
  () => store.getSiteLanguage,
  (newLang, oldLang) => {
    if (newLang?.locale !== oldLang?.locale) loadCategory();
  },
);

onMounted(loadCategory);
</script>
