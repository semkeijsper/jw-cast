<template>
  <v-card class="video-card" rounded @click="emit('click')">
    <v-img :aspect-ratio="2 / 1" cover :src="src">
      <div class="image-overlay d-flex align-end">
        <v-card-title class="video-title text-white">
          {{ title }}
        </v-card-title>
      </div>
    </v-img>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{ src: string; title: string }>();

const emit = defineEmits<{ click: [] }>();
</script>

<style scoped>
.video-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.video-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
}
.image-overlay {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.55));
  height: 100%;
}
.video-title {
  flex: 1 1 auto;
  hyphens: none;
  overflow: visible;
  text-overflow: clip;
  user-select: none;
  white-space: normal;
}
</style>
