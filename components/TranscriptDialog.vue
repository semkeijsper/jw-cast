<template>
  <v-dialog
    v-model="dialog"
    max-width="800px"
    transition="dialog-bottom-transition"
    :fullscreen="smAndDown"
    scrollable
  >
    <v-card>
      <v-toolbar color="primary" density="compact" class="flex-grow-0">
        <v-toolbar-title>Transcript</v-toolbar-title>
        <template #append>
          <v-btn icon @click="onCopy">
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-textarea
          :model-value="subtitles"
          variant="outlined"
          auto-grow
          autofocus
          hide-details
          readonly
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';

const store = useAppStore();
const { smAndDown } = useDisplay();

const vtt = ref<string | null>(null);

const dialog = computed({
  get: () => store.transcriptDialog,
  set: (v) => store.setTranscriptDialog(v),
});

const subtitleUrl = computed(() => {
  const found = store.subtitleMedia?.files.find((f) => f?.subtitles?.url);
  return found?.subtitles?.url ?? null;
});

const subtitles = computed(() => {
  let text = vtt.value;
  if (!text || text.length === 0) return '';

  // Strip VTT timing lines and tags
  text = text.replace(/.+ --> .+/g, '');
  text = text.replace(/<\/c>/g, '');
  text = text.replace(/<.+?>/g, '');
  text = text.replace(/^\s*$/g, '');
  text = text.replace(/&nbsp;/g, ' ');

  let lines = text.split('\n');
  lines.splice(0, 2); // remove WEBVTT header
  lines = lines.map((l) => l.trim());
  lines = lines.filter((l) => l.length > 0);
  lines = lines.filter((l, i, arr) => l !== arr[i + 1]); // deduplicate adjacent

  return lines.join('\n').replace(/(\.\.\.\n|\. \. \.\n|([^.])\n)/g, '$2 ');
});

function onCopy() {
  navigator.clipboard.writeText(subtitles.value ?? '');
}

watch(subtitleUrl, async (url) => {
  if (!url) {
    vtt.value = null;
    return;
  }
  vtt.value = await $fetch<string>(url, { responseType: 'text' });
});
</script>
