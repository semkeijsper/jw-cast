<template>
  <!-- Diagnostics only, shown behind ?castdebug — deliberately not translated -->
  <v-card v-if="enabled" class="cast-debug" elevation="12">
    <div class="d-flex align-center px-2 py-1">
      <v-btn
        density="compact"
        :icon="collapsed ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        size="small"
        variant="text"
        @click="collapsed = !collapsed"
      />

      <span class="text-caption font-weight-medium">cast debug</span>
      <span class="text-caption text-medium-emphasis ml-2">{{ castLogLines.length }}</span>

      <v-spacer />

      <v-btn
        class="text-caption"
        density="compact"
        size="small"
        variant="text"
        @click="onCopy"
      >
        {{ copied ? 'copied' : 'copy' }}
      </v-btn>

      <v-btn
        density="compact"
        icon="mdi-delete-outline"
        size="small"
        variant="text"
        @click="clearCastLog"
      />
    </div>

    <pre v-show="!collapsed" ref="logEl" class="cast-debug-log">{{ text }}</pre>
  </v-card>
</template>

<script setup lang="ts">
const { castLogLines, castDebugEnabled, clearCastLog } = useCast();

const enabled = ref(false);
const collapsed = ref(false);
const copied = ref(false);
const logEl = ref<HTMLElement | null>(null);

// Reads location/localStorage, so it must not run before the client mounts
onMounted(() => {
  enabled.value = castDebugEnabled();
});

const text = computed(() => castLogLines.value.join('\n'));

watch(text, async() => {
  await nextTick();
  if (logEl.value) {
    logEl.value.scrollTop = logEl.value.scrollHeight;
  }
});

async function onCopy() {
  try {
    await navigator.clipboard.writeText(text.value);
  }
  catch {
    // No clipboard permission (or an insecure context) — select it instead so
    // the phone's own copy gesture can pick it up
    if (logEl.value) {
      const range = document.createRange();
      range.selectNodeContents(logEl.value);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    return;
  }
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1500);
}
</script>

<style scoped>
.cast-debug {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  /* Above CastBar (z-index 10000) — both are on screen during the test */
  z-index: 10001;
  border-radius: 0;
  opacity: 0.95;
}

.cast-debug-log {
  max-height: 35vh;
  overflow: auto;
  margin: 0;
  padding: 4px 8px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
}
</style>
