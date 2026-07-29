<template>
  <v-dialog v-model="dialog" :fullscreen="xs" max-width="560px">
    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title>{{ languageStore.t('tutorialTitle') }}</v-toolbar-title>

        <template #append>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <v-window v-model="step" class="pt-6">
        <v-window-item v-for="(item, i) in steps" :key="i" :value="i">
          <v-card-text class="text-center pb-2">
            <v-icon class="mb-4" color="primary" size="64">{{ item.icon }}</v-icon>
            <h3 class="text-h6 mb-2">{{ item.title }}</h3>
            <p class="text-body-1">{{ item.body }}</p>
          </v-card-text>
        </v-window-item>
      </v-window>

      <div class="d-flex justify-center py-2">
        <span
          v-for="(_, i) in steps"
          :key="i"
          class="dot mx-1"
          :class="{ 'dot--active': i === step }"
        />
      </div>

      <v-card-actions class="px-4 pb-4">
        <v-btn
          :disabled="step === 0"
          prepend-icon="mdi-chevron-left"
          variant="text"
          @click="step--"
        >
          {{ languageStore.t('btnBack') }}
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

        <v-spacer />

        <v-btn
          append-icon="mdi-chevron-right"
          color="primary"
          variant="flat"
          @click="onNext"
        >
          {{ isLast ? languageStore.t('btnDone') : languageStore.t('btnNext') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';
import { FEEDBACK_URL } from '~/config/links';

const languageStore = useLanguageStore();
const uiStore = useUiStore();
const { xs } = useDisplay();

const step = ref(0);

const dialog = computed({
  get: () => uiStore.tutorialDialog,
  set: v => uiStore.setTutorialDialog(v),
});

const steps = computed(() => languageStore.tutorialSteps);
const isLast = computed(() => step.value >= steps.value.length - 1);

watch(dialog, open => {
  if (open) {
    step.value = 0;
  }
});

function onNext() {
  if (isLast.value) {
    dialog.value = false;
  }
  else {
    step.value++;
  }
}
</script>

<style scoped>
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--v-theme-on-surface));
  opacity: 0.25;
  transition: opacity 0.2s;
}

.dot--active {
  opacity: 0.9;
}
</style>
