<template>
  <v-footer class="footer text-caption d-flex justify-center ga-4 py-6" color="transparent">
    <v-btn
      :href="GITHUB_URL"
      prepend-icon="mdi-github"
      rel="noopener"
      size="small"
      target="_blank"
      variant="text"
    >
      {{ languageStore.t('lnkSource') }}
    </v-btn>

    <v-btn
      :href="FEEDBACK_URL"
      prepend-icon="mdi-comment-quote-outline"
      rel="noopener"
      size="small"
      target="_blank"
      variant="text"
    >
      {{ languageStore.t('feedback') }}
    </v-btn>
  </v-footer>
</template>

<script setup lang="ts">
import { FEEDBACK_URL, GITHUB_URL } from '~/config/links';

const languageStore = useLanguageStore();
</script>

<style scoped>
.footer {
  opacity: 0.7;
}
</style>
