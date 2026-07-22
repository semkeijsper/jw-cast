<template>
  <div class="transcript-panel d-flex flex-column">
    <div class="panel-header d-flex align-center flex-grow-0 ga-1 pa-2">
      <v-text-field
        v-model="query"
        clearable
        density="compact"
        hide-details
        :placeholder="languageStore.t('lnkSearch')"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        @keydown.esc="onEscape"
      />

      <v-btn density="comfortable" icon variant="text" @click="onCopy">
        <v-icon :color="copied ? 'success' : undefined">
          {{ copied ? 'mdi-check' : 'mdi-content-copy' }}
        </v-icon>
      </v-btn>

      <v-btn
        v-if="expandable"
        density="comfortable"
        icon
        variant="text"
        @click="onToggleExpand"
      >
        <v-icon>
          {{ uiStore.transcriptExpanded ? 'mdi-arrow-collapse-down' : 'mdi-arrow-expand-up' }}
        </v-icon>
      </v-btn>

      <v-btn
        v-if="closable"
        density="comfortable"
        icon
        variant="text"
        @click="uiStore.setTranscriptPanel(false)"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <div v-if="loading" class="d-flex flex-grow-1 align-center justify-center pa-4">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <div
      v-else-if="cues.length === 0"
      class="d-flex flex-grow-1 align-center justify-center pa-4 text-medium-emphasis"
    >
      {{ languageStore.t('noTranscript') }}
    </div>

    <div v-else class="cue-area flex-grow-1">
      <div
        v-if="isFiltering"
        class="match-count px-3 py-1 text-caption text-medium-emphasis"
      >
        {{ filteredCues.length }} / {{ cues.length }}
      </div>

      <div
        v-if="isFiltering && filteredCues.length === 0"
        class="d-flex flex-grow-1 align-center justify-center pa-4 text-medium-emphasis"
      >
        {{ languageStore.t('noResults') }}
      </div>

      <div
        v-else
        ref="containerEl"
        class="cue-list"
        :class="{ 'cue-list--filtered': isFiltering }"
        @scroll="updateActiveAbove"
        @touchmove="onUserScroll"
        @wheel="onUserScroll"
      >
        <div
          v-for="cue in visibleCues"
          :key="cue.start"
          class="cue"
          :class="{ 'cue-active': !isFiltering && cue === cues[activeIndex] }"
          @click="onClickCue(cue)"
        >
          <span class="cue-time">{{ formatTime(cue.start) }}</span>

          <span class="cue-text">
            <template v-for="(segment, i) in highlightSegments(cue.text, normalizedQuery)" :key="i">
              <mark v-if="segment.match" class="cue-match">{{ segment.text }}</mark>
              <template v-else>{{ segment.text }}</template>
            </template>
          </span>
        </div>
      </div>

      <v-fade-transition>
        <v-btn
          v-if="userScrolled && !isFiltering && activeIndex >= 0"
          class="resume-btn"
          color="primary"
          :icon="activeAbove ? 'mdi-arrow-up' : 'mdi-arrow-down'"
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
  closable?: boolean;
  expandable?: boolean;
}>();

const emit = defineEmits<{
  seek: [seconds: number];
}>();

const languageStore = useLanguageStore();
const uiStore = useUiStore();

const containerEl = ref<HTMLElement | null>(null);
const loading = ref(false);
const cues = ref<SubtitleCue[]>([]);
const userScrolled = ref(false);
const activeAbove = ref(false);
const query = ref<string | null>('');

const activeIndex = computed(() => activeCueIndex(cues.value, props.currentTime));

const normalizedQuery = computed(() => query.value?.trim().toLowerCase() ?? '');
const isFiltering = computed(() => normalizedQuery.value.length > 0);

const filteredCues = computed(() => {
  if (!isFiltering.value) {
    return cues.value;
  }
  return cues.value.filter(c => c.text.toLowerCase().includes(normalizedQuery.value));
});

const visibleCues = computed(() => (isFiltering.value ? filteredCues.value : cues.value));

const plainText = computed(() =>
  cues.value
    .map(c => c.text)
    .join('\n')
    .replace(/(\.\.\.\n|\. \. \.\n|([^.])\n)/g, '$2 '),
);

function scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth') {
  const container = containerEl.value;
  const row = container?.children[index] as HTMLElement | undefined;
  if (!container || !row) {
    return;
  }
  container.scrollTo({
    top: row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2,
    behavior,
  });
}

function scrollToActive(behavior: ScrollBehavior = 'smooth') {
  scrollToIndex(activeIndex.value, behavior);
}

function onUserScroll() {
  userScrolled.value = true;
}

function updateActiveAbove() {
  const container = containerEl.value;
  const row = container?.children[activeIndex.value] as HTMLElement | undefined;
  if (!container || !row) {
    return;
  }
  activeAbove.value = row.offsetTop + row.clientHeight < container.scrollTop;
}

function onResume() {
  userScrolled.value = false;
  scrollToActive();
}

function onToggleExpand() {
  uiStore.setTranscriptExpanded(!uiStore.transcriptExpanded);
  userScrolled.value = false;
  nextTick(() => scrollToActive('instant'));
}

function onClickCue(cue: SubtitleCue) {
  userScrolled.value = false;
  emit('seek', cue.start);
  if (isFiltering.value) {
    query.value = '';
    const index = cues.value.indexOf(cue);
    nextTick(() => scrollToIndex(index, 'instant'));
  }
}

const copied = ref(false);

async function onCopy() {
  try {
    await navigator.clipboard.writeText(plainText.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
  catch {
    // Clipboard unavailable (permissions / insecure context) — nothing to show
  }
}

// Consume Esc while a query is active so it clears the search instead of
// closing the video dialog
function onEscape(event: KeyboardEvent) {
  if (query.value) {
    query.value = '';
    event.stopPropagation();
  }
}

watch(activeIndex, () => {
  if (!userScrolled.value && !isFiltering.value) {
    scrollToActive();
  }
  else {
    updateActiveAbove();
  }
});

watch(
  () => props.vttUrl,
  async url => {
    userScrolled.value = false;
    query.value = '';
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
.panel-header {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.cue-area {
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
}
.match-count {
  flex-shrink: 0;
}
.cue-list {
  flex-grow: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.cue-match {
  background: rgba(var(--v-theme-primary), 0.3);
  color: inherit;
  border-radius: 2px;
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
