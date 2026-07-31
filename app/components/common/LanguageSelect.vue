<template>
  <v-autocomplete
    v-model="model"
    density="compact"
    hide-details="auto"
    :item-title="languageLabel"
    item-value="locale"
    :items="items"
    :list-props="{ density: 'compact' }"
    :messages="message ?? []"
    :prepend-icon="icon"
    variant="outlined"
  />
</template>

<script setup lang="ts">
import type { Language } from '~/types';

defineProps<{
  items: Language[];
  icon: string;
  /** Shown under the field; `hide-details="auto"` keeps the slot collapsed without one */
  message?: string;
}>();

const model = defineModel<string>({ required: true });
</script>
