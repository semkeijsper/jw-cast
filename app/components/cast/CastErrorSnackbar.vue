<template>
  <v-snackbar
    v-model="visible"
    color="error"
    location="top"
    :timeout="6000"
  >
    {{ languageStore.t('castFailed') }}

    <template #actions>
      <v-btn icon="mdi-close" variant="text" @click="clearCastError" />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
const languageStore = useLanguageStore();
const { castError, clearCastError } = useCast();

const visible = computed({
  get: () => castError.value !== null,
  set: v => {
    if (!v) {
      clearCastError();
    }
  },
});
</script>
