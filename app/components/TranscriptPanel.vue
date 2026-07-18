<template>
  <div class="transcript-panel d-flex flex-column">
    <v-toolbar class="flex-grow-0" color="primary" density="compact">
      <v-toolbar-title>Transcript</v-toolbar-title>

      <template #append>
        <v-btn icon @click="onCopy">
          <v-icon>mdi-content-copy</v-icon>
        </v-btn>

        <v-btn icon @click="store.setTranscriptDialog(false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-toolbar>

    <div v-if="loading" class="d-flex flex-grow-1 align-center justify-center pa-4">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <div
      v-else-if="cues.length === 0"
      class="d-flex flex-grow-1 align-center justify-center pa-4 text-medium-emphasis"
    >
      No transcript available
    </div>

    <div v-else class="cue-area flex-grow-1">
      <div
        ref="containerEl"
        class="cue-list"
        @touchmove="onUserScroll"
        @wheel="onUserScroll"
      >
        <div
          v-for="(cue, index) in cues"
          :key="cue.start"
          class="cue"
          :class="{ 'cue-active': index === activeIndex }"
          @click="onClickCue(cue)"
        >
          <span class="cue-time">{{ formatCueTime(cue.start) }}</span>
          <span class="cue-text">{{ cue.text }}</span>
        </div>
      </div>

      <v-fade-transition>
        <v-btn
          v-if="userScrolled && activeIndex >= 0"
          class="resume-btn"
          color="primary"
          icon="mdi-arrow-down"
          size="small"
          @click="onResume"
        />
      </v-fade-transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SubtitleCue } from '~/types';

const props = defineProps<{
  vttUrl: string | null;
  currentTime: number;
}>();

const emit = defineEmits<{
  seek: [seconds: number];
}>();

const store = useAppStore();

const containerEl = ref<HTMLElement | null>(null);
const loading = ref(false);
const cues = ref<SubtitleCue[]>([]);
const userScrolled = ref(false);

const activeIndex = computed(() => {
  for (let i = cues.value.length - 1; i >= 0; i--) {
    if (cues.value[i]!.start <= props.currentTime) {
      return i;
    }
  }
  return -1;
});

const plainText = computed(() =>
  cues.value
    .map(c => c.text)
    .join('\n')
    .replace(/(\.\.\.\n|\. \. \.\n|([^.])\n)/g, '$2 '),
);

function scrollToActive(behavior: ScrollBehavior = 'smooth') {
  const container = containerEl.value;
  const row = container?.children[activeIndex.value] as HTMLElement | undefined;
  if (!container || !row) {
    return;
  }
  container.scrollTo({
    top: row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2,
    behavior,
  });
}

function onUserScroll() {
  userScrolled.value = true;
}

function onResume() {
  userScrolled.value = false;
  scrollToActive();
}

function onClickCue(cue: SubtitleCue) {
  userScrolled.value = false;
  emit('seek', cue.start);
}

function onCopy() {
  navigator.clipboard.writeText(plainText.value);
}

watch(activeIndex, () => {
  if (!userScrolled.value) {
    scrollToActive();
  }
});

watch(
  () => props.vttUrl,
  async url => {
    userScrolled.value = false;
    if (!url) {
      cues.value = [];
      return;
    }
    loading.value = true;
    try {
      const raw = await $fetch<string>(url, { responseType: 'text' });
      cues.value = parseVtt(raw);
    }
    catch {
      cues.value = [];
    }
    loading.value = false;
    await nextTick();
    scrollToActive('instant');
  },
  { immediate: true },
);
</script>

<style scoped>
.transcript-panel {
  min-height: 0;
}
.cue-area {
  position: relative;
  min-height: 0;
}
.cue-list {
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.cue {
  display: flex;
  gap: 10px;
  padding: 6px 12px;
  cursor: pointer;
}
.cue:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
}
.cue-active {
  background: rgba(var(--v-theme-primary), 0.18);
}
.cue-time {
  flex-shrink: 0;
  padding-top: 2px;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-primary));
  user-select: none;
}
.cue-text {
  font-size: 0.875rem;
}
.resume-btn {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
