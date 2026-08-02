<template>
  <!--
    Diagnostics only, shown behind ?compat — deliberately not translated, and
    deliberately built from plain elements and scoped CSS. It has to stay
    readable on a browser that dropped every Vuetify stylesheet, which is the
    exact failure this panel exists to identify.
  -->
  <div v-if="enabled" class="compat-panel">
    <div class="compat-head">
      <strong>compat</strong>
      <span class="compat-engine">{{ engine }}</span>
      <button class="compat-btn" type="button" @click="onCopy">{{ copied ? 'copied' : 'copy' }}</button>
      <button class="compat-btn" type="button" @click="enabled = false">close</button>
    </div>

    <div class="compat-grid">
      <div v-for="check in checks" :key="check.label" class="compat-row">
        <span :class="['compat-dot', check.ok ? 'is-ok' : 'is-bad']">{{ check.ok ? '✓' : '✕' }}</span>
        <span class="compat-label">{{ check.label }}</span>
        <span class="compat-since">{{ check.since }}</span>
      </div>
    </div>

    <div v-if="buffer.polyfilled.length > 0" class="compat-note">
      polyfilled: {{ buffer.polyfilled.join(', ') }}
    </div>

    <div class="compat-note">
      errors: {{ buffer.errors.length }}
    </div>

    <pre v-if="buffer.errors.length > 0" class="compat-errors">{{ buffer.errors.join('\n') }}</pre>

    <pre class="compat-ua">{{ buffer.ua }}</pre>
  </div>
</template>

<script setup lang="ts">
import type { CompatBuffer, CompatCheck } from '~/utils/compat';

const enabled = ref(false);
const copied = ref(false);
const checks = ref<CompatCheck[]>([]);
const buffer = ref<CompatBuffer>({ ua: '', errors: [], polyfilled: [] });

let poll: ReturnType<typeof setInterval> | undefined;

function readBuffer() {
  const current = compatBuffer();
  // The head script pushes onto a plain array Vue is not tracking, so the copy
  // is what makes a new error render
  buffer.value = { ...current, errors: [...current.errors] };
}

// Reads location/localStorage/CSS.supports, so it must not run before the client mounts
onMounted(() => {
  enabled.value = compatDebugEnabled();
  if (!enabled.value) {
    return;
  }
  readBuffer();
  checks.value = compatChecks(buffer.value.polyfilled);
  // The errors worth catching — a failed API call, a late throw — arrive well
  // after mount, so the panel keeps re-reading rather than watching
  poll = setInterval(readBuffer, 1000);
});

onUnmounted(() => clearInterval(poll));

const engine = computed(() => engineVersion(buffer.value.ua));

const report = computed(() => [
  engine.value,
  buffer.value.ua,
  ...checks.value.map(check => `${check.ok ? 'ok  ' : 'MISS'} ${check.label} (${check.since})`),
  `polyfilled: ${buffer.value.polyfilled.join(', ') || 'none'}`,
  `errors:${buffer.value.errors.length > 0 ? `\n${buffer.value.errors.join('\n')}` : ' none'}`,
].join('\n'));

async function onCopy() {
  try {
    await navigator.clipboard.writeText(report.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1500);
  }
  catch {
    // No clipboard on a TV browser — the panel is sized to be photographed instead
    console.info(report.value);
  }
}
</script>

<style scoped>
.compat-panel {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 20000;
  max-width: 32em;
  max-height: 100%;
  overflow: auto;
  padding: 8px 12px;
  background: #000;
  color: #fff;
  border: 2px solid #4a6da7;
  font-family: monospace;
  font-size: 15px;
  line-height: 1.45;
  text-align: left;
}

.compat-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.compat-engine {
  color: #8fb8ff;
}

.compat-btn {
  padding: 2px 8px;
  background: #222;
  color: #fff;
  border: 1px solid #666;
  font: inherit;
  cursor: pointer;
}

.compat-grid {
  display: block;
}

.compat-row {
  display: flex;
  gap: 8px;
}

.compat-dot {
  width: 1em;
}

.is-ok {
  color: #6ee7a0;
}

.is-bad {
  color: #ff7a7a;
}

.compat-label {
  flex: 1 1 auto;
}

.compat-since {
  color: #9a9a9a;
}

.compat-note {
  margin-top: 6px;
  color: #ffd479;
}

.compat-errors,
.compat-ua {
  margin: 4px 0 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 13px;
  color: #ddd;
}
</style>
